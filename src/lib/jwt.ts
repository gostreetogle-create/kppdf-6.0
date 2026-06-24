/**
 * JWT helpers через jose (HS256 + HttpOnly cookies).
 * Согласовано: stack §5 «Auth JWT cookies (jose)» + ERRATA v5 (cycle 39).
 */
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';
import { env } from './env';

export interface TokenPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const ALG = 'HS256';
const COOKIE_NAME = 'kppdf_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET);
}

/**
 * Sign JWT с payload + 7-day expiry.
 */
export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Verify и распарсить JWT. Бросает на ошибке/просрочке.
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as UserRole,
    iat: payload.iat,
    exp: payload.exp,
  };
}

/**
 * Cookie helpers для App Router Route Handlers.
 */
export const SESSION_COOKIE = COOKIE_NAME;

export function buildSessionCookie(token: string): string {
  const isProduction = env().NODE_ENV === 'production';
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function buildClearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) : null;
}
