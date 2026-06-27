import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

// POST /api/cart/[id]/items — добавить товар в корзину.
// D-A1 (cycle 47-extension): cart = proposal-builder precursor → manager-only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['manager']);
    const { id } = await params;
    const body = await request.json();

    const session = await prisma.cartSession.findUnique({ where: { id } });
    if (!session) return apiError('Корзина не найдена', 404);

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return apiError('Товар не найден', 404);

    // Проверяем, не добавлен ли уже этот товар
    const existing = await prisma.cartItem.findFirst({
      where: { sessionId: id, productId: body.productId },
    });

    if (existing) {
      // Увеличиваем количество
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (body.quantity || 1) },
        include: { product: { include: { category: true } } },
      });
      return apiOk(updated);
    }

    const item = await prisma.cartItem.create({
      data: {
        sessionId: id,
        productId: body.productId,
        quantity: body.quantity || 1,
        priceSnapshot: body.priceSnapshot || product.basePrice,
        markupPercent: body.markupPercent || product.defaultMarkupPercent || 0,
      },
      include: { product: { include: { category: true } } },
    });

    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
