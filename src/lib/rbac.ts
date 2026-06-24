/**
 * RBAC middleware helpers для App Router Route Handlers.
 * 6 ролей (admin/director/manager/accountant/warehouse/production_head)
 * согласовано в OPEN-QUESTIONS-MASTER.md (финансы: C — все роли видят маржу)
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@prisma/client';
import { verifyToken, readSessionCookie, type TokenPayload } from './jwt';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Извлечь TokenPayload из cookies, верифицировать.
 * Бросает AuthError при отсутствии/просрочке.
 */
export async function requireAuth(req: NextRequest): Promise<TokenPayload> {
  const token = readSessionCookie(req.headers.get('cookie'));
  if (!token) throw new AuthError('No session cookie', 401);
  try {
    return await verifyToken(token);
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }
}

/**
 * Проверить, что роль пользователя входит в список разрешённых.
 * Бросает AuthError(403) если нет.
 */
export function requireRole(payload: TokenPayload, allowed: UserRole[]): void {
  if (!allowed.includes(payload.role)) {
    throw new AuthError(`Role ${payload.role} not allowed`, 403);
  }
}

/**
 * Обёртка для Route Handler: аутентифицирует + авторизует + передаёт payload.
 * Использование:
 *   export async function GET(req: NextRequest) {
 *     return requireAuthAndRole(req, ['admin', 'director'], async (payload) => {
 *       return NextResponse.json({ ok: true });
 *     });
 *   }
 */
export async function requireAuthAndRole(
  req: NextRequest,
  allowed: UserRole[],
  handler: (payload: TokenPayload) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const payload = await requireAuth(req);
    requireRole(payload, allowed);
    return await handler(payload);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

/**
 * Только аутентификация (без проверки роли).
 * Для публичных endpoints, доступных только залогиненным.
 */
export async function requireAuthOnly(
  req: NextRequest,
  handler: (payload: TokenPayload) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const payload = await requireAuth(req);
    return await handler(payload);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
