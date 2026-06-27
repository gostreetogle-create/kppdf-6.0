import { type NextRequest } from 'next/server';
import { requireAuth, requireEditor, requireRole } from '@/lib/auth';
import { apiError } from '@/lib/api-response';

type HandlerFn = (request: NextRequest, context: { params: Promise<Record<string, string>> }, user: { id: string; username: string; role: string }) => Promise<Response>;

type Context = { params: Promise<Record<string, string>> };

export function withAuth(handler: HandlerFn) {
  return async (request: NextRequest, context: Context) => {
    try {
      const user = await requireAuth();
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return apiError('Не авторизован', 401);
      }
      return apiError(String(error), 500);
    }
  };
}

export function withEditor(handler: HandlerFn) {
  return async (request: NextRequest, context: Context) => {
    try {
      const user = await requireEditor();
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return apiError('Не авторизован', 401);
      }
      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return apiError('Доступ запрещён', 403);
      }
      return apiError(String(error), 500);
    }
  };
}

export function withRole(roles: string[], handler: HandlerFn) {
  return async (request: NextRequest, context: Context) => {
    try {
      const user = await requireRole(roles);
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return apiError('Не авторизован', 401);
      }
      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return apiError('Доступ запрещён', 403);
      }
      return apiError(String(error), 500);
    }
  };
}
