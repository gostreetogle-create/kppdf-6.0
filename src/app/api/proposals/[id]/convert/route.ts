import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextContractNumber } from '@/lib/counter';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

// POST /api/proposals/[id]/convert — конвертировать КП в договор
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(['manager']); // Cycle 57: capture user for activity log
    const { id } = await params;

    // Получаем КП с товарами
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: { select: { name: true } }, organization: true },
    });

    if (!proposal) return apiError('КП не найдено', 404);
    if (proposal.items.length === 0) return apiError('КП не содержит товаров', 400);

    // Cycle 42: hard-block конвертацию superseded версии (только latest active)
    if (proposal.supersededAt) {
      return apiError('Нельзя конвертировать superseded версию. Создайте новую версию.', 400);
    }

    // Проверяем, не конвертировано ли уже
    if (proposal.status === 'converted') {
      return apiError('КП уже конвертировано в договор', 400);
    }

    const existingContract = await prisma.contract.findUnique({
      where: { proposalId: id },
    });
    if (existingContract) {
      return apiError('Договор для этого КП уже существует', 400);
    }

    // Генерируем номер договора
    const number = await nextContractNumber();

    // Переносим товары из КП в договор
    let totalAmount = 0;
    const contractItems = proposal.items.map((item, index) => {
      const total = item.total || Math.round(item.unitPrice * item.quantity * 100) / 100;
      totalAmount += total;

      return {
        name: item.product?.name || `Позиция ${index + 1}`,
        quantity: item.quantity,
        unit: item.product?.unit || 'шт',
        unitPrice: item.unitPrice,
        total,
        sortOrder: index,
      };
    });

    // Создаём договор в транзакции
    const [contract] = await prisma.$transaction([
      prisma.contract.create({
        data: {
          number,
          title: `Договор №${number}`,
          status: 'draft',
          customerId: proposal.customerId,
          organizationId: proposal.organizationId,
          proposalId: id,
          totalAmount: Math.round(totalAmount * 100) / 100,
          notes: proposal.notes || '',
          items: { create: contractItems },
        },
        include: { items: true, customer: { select: { name: true } }, organization: true },
      }),
      prisma.proposal.update({
        where: { id },
        data: { status: 'converted' },
      }),
    ]);

    // Cycle 57 (B.7): audit event for KP → contract conversion.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'convert',
      entity: 'proposal',
      entityId: id,
      details: {
        targetEntity: 'contract',
        targetId: contract.id,
        targetNumber: contract.number,
      },
    });
    return apiOk(contract, 'Договор создан');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
