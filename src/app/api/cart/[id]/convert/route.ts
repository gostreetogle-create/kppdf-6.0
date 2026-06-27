import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextProposalNumber } from '@/lib/counter';

// POST /api/cart/[id]/convert — конвертировать корзину в КП.
// D-A1 (cycle 47-extension): cart → proposal, manager-only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['manager']);
    const { id } = await params;
    const body = await request.json();

    // Получаем корзину с товарами
    const session = await prisma.cartSession.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!session) return apiError('Корзина не найдена', 404);
    if (session.items.length === 0) return apiError('Корзина пуста', 400);

    // Генерируем номер КП через counter
    const number = body.number || await nextProposalNumber();

    // Рассчитываем суммы
    const proposalItems = session.items.map((item, index) => {
      const basePrice = item.priceSnapshot;
      const markupMultiplier = 1 + (item.markupPercent || 0) / 100;
      const unitPrice = Math.round(basePrice * markupMultiplier * 100) / 100;
      const total = Math.round(unitPrice * item.quantity * 100) / 100;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        markupPercent: item.markupPercent || 0,
        total,
        sortOrder: index,
      };
    });

    // Создаём КП
    const proposal = await prisma.proposal.create({
      data: {
        number,
        title: body.title || `Коммерческое предложение №${number}`,
        status: 'draft',
        customerId: body.customerId || null,
        organizationId: body.organizationId || null,
        markupPercent: body.markupPercent || 0,
        notes: body.notes || '',
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        items: { create: proposalItems },
      },
      include: { items: { include: { product: true } }, customer: { select: { name: true } }, organization: true },
    });

    // Очищаем корзину
    await prisma.cartSession.delete({ where: { id } });

    return apiOk(proposal, 'КП создано');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
