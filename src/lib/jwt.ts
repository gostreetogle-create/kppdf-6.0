/**
 * src/lib/jwt.ts — pure JWT sign/verify функции.
 *
 * Модуль НЕ импортирует `./db` — это принципиально для testability:
 * юнит-тесты могут подключить этот модуль без поднятия PrismaClient-
 * коннекшена и без инициализации auth.ts:top-level под side-effects.
 *
 * Lazy secret check: JWT_SECRET читается один раз при загрузке модуля,
 * но throw происходит только при первом вызове signAccessToken / signRefreshToken / verifyToken.
 * Это позволяет импортировать jwt.ts из тестов без env-JWT_SECRET
 * (тесты должны задать process.env.JWT_SECRET в beforeAll).
 */

import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  tokenVersion?: number;
}

function ensureSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set in environment variables');
  }
  return secret;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ensureSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload, tokenVersion: payload.tokenVersion || 0 },
    ensureSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

/** Заглушка для SET-тестов: при инициализации тестового окружения.
 *  Возвращает результат для inspect (например, в vitest-setup.ts).
 *  Не экспортируется через index — internal use only.
 */
export function _jwtSecretDiagnostics(): { secretLoaded: boolean } {
  return { secretLoaded: process.env.JWT_SECRET !== undefined };
}
