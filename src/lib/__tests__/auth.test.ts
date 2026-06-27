import { describe, it, expect, beforeAll } from 'vitest';

// Цикл 39 (M5 развязка): импортируем JWT-функции напрямую из `../jwt`,
// минуя `../auth` (который импортирует `prisma` через `./db` и имеет
// orchestration-side-effects). Это разрывает side-effect import chain.
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-for-unit-tests';
});

import { signAccessToken, signRefreshToken, verifyToken, type JwtPayload } from '../jwt';

describe('JWT token functions', () => {
  const payload: JwtPayload = {
    userId: 'test-user-123',
    username: 'admin',
    role: 'admin',
  };

  it('signAccessToken должен создавать JWT строку', () => {
    const token = signAccessToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT имеет 3 части
  });

  it('signRefreshToken должен создавать JWT с tokenVersion', () => {
    const token = signRefreshToken(payload);
    expect(token).toBeTruthy();
    expect(token.split('.').length).toBe(3);
  });

  it('verifyToken должен декодировать валидный access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('test-user-123');
    expect(decoded?.username).toBe('admin');
    expect(decoded?.role).toBe('admin');
  });

  it('verifyToken должен декодировать refresh token с tokenVersion', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.tokenVersion).toBe(0); // payload без tokenVersion → default 0
  });

  it('verifyToken должен возвращать null для невалидного токена', () => {
    const result = verifyToken('invalid-token-string');
    expect(result).toBeNull();
  });

  it('verifyToken должен возвращать null для пустой строки', () => {
    const result = verifyToken('');
    expect(result).toBeNull();
  });

  it('signRefreshToken должен сохранять переданный tokenVersion', () => {
    const token = signRefreshToken({ ...payload, tokenVersion: 5 });
    const decoded = verifyToken(token);
    expect(decoded?.tokenVersion).toBe(5);
  });

  it('signAccessToken и signRefreshToken создают разные токены', () => {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    expect(accessToken).not.toBe(refreshToken);
  });

  it('verifyToken возвращает корректные типы полей', () => {
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);
    expect(typeof decoded?.userId).toBe('string');
    expect(typeof decoded?.username).toBe('string');
    expect(typeof decoded?.role).toBe('string');
  });
});
