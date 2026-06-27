import { describe, it, expect, beforeAll } from 'vitest';
import { signAccessToken, signRefreshToken, verifyToken, _jwtSecretDiagnostics } from '../jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
});

describe('signAccessToken', () => {
  it('должен возвращать строку (JWT)', () => {
    const token = signAccessToken({ userId: '1', username: 'admin', role: 'admin' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('должен подписывать payload с tokenVersion', () => {
    const token = signAccessToken({ userId: '1', username: 'admin', role: 'admin', tokenVersion: 5 });
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.tokenVersion).toBe(5);
  });
});

describe('signRefreshToken', () => {
  it('должен возвращать строку (JWT)', () => {
    const token = signRefreshToken({ userId: '1', username: 'admin', role: 'admin' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('должен подписывать payload с tokenVersion по умолчанию 0', () => {
    const token = signRefreshToken({ userId: '1', username: 'admin', role: 'admin' });
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.tokenVersion).toBe(0);
  });

  it('должен подписывать payload с указанным tokenVersion', () => {
    const token = signRefreshToken({ userId: '1', username: 'admin', role: 'admin', tokenVersion: 3 });
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.tokenVersion).toBe(3);
  });
});

describe('verifyToken', () => {
  it('должен возвращать decoded payload для валидного токена', () => {
    const payload = { userId: '123', username: 'test', role: 'manager' };
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe('123');
    expect(decoded!.username).toBe('test');
    expect(decoded!.role).toBe('manager');
  });

  it('должен возвращать null для невалидного токена', () => {
    expect(verifyToken('invalid.token.here')).toBeNull();
  });

  it('должен возвращать null для пустой строки', () => {
    expect(verifyToken('')).toBeNull();
  });
});

describe('_jwtSecretDiagnostics', () => {
  it('должен возвращать secretLoaded=true если JWT_SECRET задан', () => {
    const result = _jwtSecretDiagnostics();
    expect(result.secretLoaded).toBe(true);
  });
});
