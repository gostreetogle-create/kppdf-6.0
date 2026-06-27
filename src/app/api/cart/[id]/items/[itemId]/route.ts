import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

// PATCH /api/cart/[id]/items/[itemId] — обновить количество или наценку.
// D-A1 (cycle 47-extension): cart = proposal-builder precursor → manager-only.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireRole(['manager']);
    const { id, itemId } = await params;
    const body = await request.json();

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, sessionId: id } });
    if (!item) return apiError('Позиция не найдена', 404);

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.markupPercent !== undefined && { markupPercent: body.markupPercent }),
      },
      include: { product: { include: { category: true } } },
    });

    return apiOk(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

// DELETE /api/cart/[id]/items/[itemId] — удалить позицию
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireEditor();
    const { id, itemId } = await params;
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, sessionId: id } });
    if (!item) return apiError('Позиция не найдена', 404);

    await prisma.cartItem.delete({ where: { id: itemId } });
    return apiOk(null, 'Позиция удалена');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
