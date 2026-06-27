import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseJwtExpiry,
  createRefreshScheduler,
  DEFAULT_REFRESH_LEAD_MS,
} from '@/stores/auth-refresh';

/**
 * Helper: создаёт минимальный JWT с заданным exp claim для unit tests.
 */
function makeJwt(expSeconds: number | null): string {
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url(expSeconds !== null ? { exp: expSeconds } : { userId: 'u1' });
  return `${header}.${payload}.sig`;
}

/**
 * Drain queued microtasks. Используется вместо `await new Promise(setTimeout, 0)` —
 * который в vi.useFakeTimers() режиме никогда не сработает (setTimeout мокнут).
 */
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('parseJwtExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('возвращает expiry в миллисекундах для валидного JWT', () => {
    // Фиксированный exp — 1h после baseline.
    const expSec = 1_716_400_800;
    const result = parseJwtExpiry(makeJwt(expSec));
    expect(result).toBe(expSec * 1000);
  });

  it('возвращает null для невалидного формата', () => {
    expect(parseJwtExpiry('')).toBeNull();
    expect(parseJwtExpiry('not-a-jwt')).toBeNull();
    expect(parseJwtExpiry('only.two-parts')).toBeNull();
    expect(parseJwtExpiry('one.two.three.four')).toBeNull();
  });

  it('возвращает null если exp claim отсутствует', () => {
    expect(parseJwtExpiry(makeJwt(null))).toBeNull();
  });

  it('возвращает null если exp не число', () => {
    const b64url = (obj: object) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    const token = `${b64url({ alg: 'HS256' })}.${b64url({ exp: 'not-number' })}.sig`;
    expect(parseJwtExpiry(token)).toBeNull();
  });

  it('возвращает null если payload corrupted (невалидный base64)', () => {
    // '!!!' is not valid base64 → atob throws → catch returns null.
    expect(parseJwtExpiry('hdr.!!!.sig')).toBeNull();
  });
});

describe('createRefreshScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('вызывает onExpire за beforeMs до expiry', async () => {
    const onExpire = vi.fn();
    const scheduler = createRefreshScheduler(onExpire);
    // expiry = now + 10min, lead = 5min, fires at exactly +5min.
    scheduler.schedule(Date.now() + 10 * 60 * 1000, 5 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();

    // До 5min — не должен сработать.
    vi.advanceTimersByTime(4 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).not.toHaveBeenCalled();

    // На 5min — должен сработать.
    vi.advanceTimersByTime(1 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('refresh immediately если expiry - lead <= now', async () => {
    const onExpire = vi.fn();
    const scheduler = createRefreshScheduler(onExpire);
    // expiry = now + 1s, lead = 5min → target < 0 → fire immediately async.
    scheduler.schedule(Date.now() + 1000, 5 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('refresh immediately если expiry уже в прошлом', async () => {
    const onExpire = vi.fn();
    const scheduler = createRefreshScheduler(onExpire);
    scheduler.schedule(Date.now() - 1000, 5 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('clear() отменяет pending timer', async () => {
    const onExpire = vi.fn();
    const scheduler = createRefreshScheduler(onExpire);
    scheduler.schedule(Date.now() + 10 * 60 * 1000, 5 * 60 * 1000);
    scheduler.clear();
    vi.advanceTimersByTime(10 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('rescheduling отменяет предыдущий timer (нет double-refresh)', async () => {
    const onExpire = vi.fn();
    const scheduler = createRefreshScheduler(onExpire);
    scheduler.schedule(Date.now() + 10 * 60 * 1000, 5 * 60 * 1000); // fires at +5min
    scheduler.schedule(Date.now() + 30 * 60 * 1000, 5 * 60 * 1000); // fires at +25min
    vi.advanceTimersByTime(10 * 60 * 1000);
    await flushMicrotasks();
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(15 * 60 * 1000); // total +25min → second timer fires
    await flushMicrotasks();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('проглатывает ошибки async onExpire (no unhandled rejection)', async () => {
    const unhandled = vi.fn();
    const handler = () => unhandled();
    process.on('unhandledRejection', handler);
    try {
      const onExpire = vi.fn().mockRejectedValue(new Error('boom'));
      const scheduler = createRefreshScheduler(onExpire);
      scheduler.schedule(Date.now() + 10 * 60 * 1000, 5 * 60 * 1000);
      vi.advanceTimersByTime(5 * 60 * 1000);
      await flushMicrotasks();
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', handler);
    }
  });

  it('default lead time = 5 минут', () => {
    expect(DEFAULT_REFRESH_LEAD_MS).toBe(5 * 60 * 1000);
  });
});
