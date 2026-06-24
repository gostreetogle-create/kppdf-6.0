import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '@/lib/jwt';

describe('jwt (lib/jwt)', () => {
  const validPayload = {
    sub: 'user-id-1',
    email: '[email protected]',
    role: 'ADMIN' as const,
  };

  it('signs and verifies a valid token (roundtrip)', async () => {
    const token = await signToken(validPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature

    const verified = await verifyToken(token);
    expect(verified.sub).toBe(validPayload.sub);
    expect(verified.email).toBe(validPayload.email);
    expect(verified.role).toBe(validPayload.role);
  });

  it('rejects a tampered token (signature invalid)', async () => {
    const token = await signToken(validPayload);
    // Меняем последний символ подписи (flip last char)
    const last = token.slice(-1);
    const flipped = last === 'A' ? 'B' : 'A';
    const tampered = token.slice(0, -1) + flipped;
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it('rejects garbage token (not a JWT)', async () => {
    await expect(verifyToken('not-a-jwt-token')).rejects.toThrow();
    await expect(verifyToken('')).rejects.toThrow();
    await expect(verifyToken('a.b.c')).rejects.toThrow(); // не валидный base64
  });

  it('rejects token with tampered payload (changed sub)', async () => {
    const token = await signToken(validPayload);
    // JWT = header.payload.signature (base64url-encoded JSON)
    const [header, payload, sig] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    decodedPayload.sub = 'attacker-id';
    const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const tampered = `${header}.${tamperedPayload}.${sig}`;
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it('produces different tokens for the same payload (jti/no replay)', async () => {
    const t1 = await signToken(validPayload);
    // Подождём 1 секунду чтобы iat отличался
    await new Promise((r) => setTimeout(r, 1100));
    const t2 = await signToken(validPayload);
    expect(t1).not.toBe(t2);
  });
});
