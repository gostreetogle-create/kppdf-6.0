import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

// POST /api/cart — создать новую сессию корзины.
// D-A1 (cycle 47-extension): cart = proposal-builder precursor → manager-only.
export async function POST() {
  try {
    await requireRole(['manager']);
    const session = await prisma.cartSession.create({
      data: {},
      include: { items: { include: { product: true } } },
    });
    return apiOk(session);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
