import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { logOrderAction } from '@/lib/order-history';
// Cycle 51 (B.3): live workflow вместо VALID_TRANSITIONS.
import { assertTransitionAllowed, WorkflowError } from '@/lib/status-workflow';
// Cycle 53 (B.1): авто-приёмка готовой продукции на склад при completed.
import { autoReceiveFinishedGoods } from '@/lib/warehouse/auto-receive-finished-goods';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

// Cycle 51 (B.3): VALID_TRANSITIONS удалён — теперь live query через assertTransitionAllowed.

/**
 * Авто-списание материалов со склада при старте производства
 */
async function autoDeductMaterials(orderId: string) {
  // Получаем заказ с proposal/contract
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      proposalId: true,
      contractId: true,
    },
  });
  if (!order) return;

  // Собираем ID продуктов из proposal или contract
  const productIds = new Set<string>();

  if (order.proposalId) {
    const items = await prisma.proposalItem.findMany({
      where: { proposalId: order.proposalId },
      select: { productId: true },
    });
    items.forEach((i) => { if (i.productId) productIds.add(i.productId); });
  }

  if (order.contractId) {
    // ContractItem не имеет productId, используем proposalItems
    const contract = await prisma.contract.findUnique({
      where: { id: order.contractId },
      select: { proposalId: true },
    });
    if (contract?.proposalId) {
      const items = await prisma.proposalItem.findMany({
        where: { proposalId: contract.proposalId },
        select: { productId: true },
      });
      items.forEach((i) => { if (i.productId) productIds.add(i.productId); });
    }
  }

  if (productIds.size === 0) return;

  // Ищем модули продуктов и их материалы
  const materials = await prisma.moduleMaterial.findMany({
    where: {
      module: {
        productId: { in: Array.from(productIds) },
      },
    },
    select: {
      name: true,
      quantity: true,
      unit: true,
      module: {
        select: { productId: true },
      },
    },
  });

  if (materials.length === 0) return;

  // Списание материалов со склада
  for (const material of materials) {
    const storageItems = await prisma.storageItem.findMany({
      where: {
        product: {
          modules: {
            some: {
              materials: {
                some: { name: material.name },
              },
            },
          },
        },
      },
      select: { id: true, quantity: true },
    });

    let remainingQty = Math.ceil(material.quantity);
    for (const item of storageItems) {
      if (remainingQty <= 0) break;
      const deduct = Math.min(item.quantity, remainingQty);
      if (deduct <= 0) continue;

      await prisma.storageItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - deduct },
      });

      await prisma.inventoryMovement.create({
        data: {
          storageItemId: item.id,
          type: 'out',
          quantity: deduct,
          notes: `Авто-списание: производственный заказ ${orderId}`,
        },
      });

      remainingQty -= deduct;
    }
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Cycle 52 (B.6): manager или production могут менять статус (admin bypass).
    // Cycle 51 (B.3): capture user.role для transition check.
    const user = await requireRole(['manager', 'production']);
    const { id } = await params;
    const { status } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.productionOrder.findUnique({
      where: { id },
      select: { status: true, number: true },
    });
    if (!current) return apiError('Заказ не найден', 404);

    // Cycle 51 (B.3): live workflow + role-aware transition check.
    try {
      await assertTransitionAllowed('productionOrder', current.status, status, user.role);
    } catch (error) {
      if (error instanceof WorkflowError) {
        if (error.code === 'TRANSITION_NOT_ALLOWED') {
          return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
        }
        if (error.code === 'INSUFFICIENT_ROLE') {
          return apiError(error.message, 403);
        }
      }
      throw error;
    }

    // Авто-списание материалов при старте производства
    if (current.status === 'planned' && status === 'in_progress') {
      await autoDeductMaterials(id);
    }

    const item = await prisma.productionOrder.update({
      where: { id },
      data: { status, actualStart: status === 'in_progress' ? new Date() : undefined, actualEnd: status === 'completed' ? new Date() : undefined },
      include: { tasks: true, workType: true, workCenter: true },
    });

    // Cycle 57 (B.7): audit event for status transition (UI timeline).
    // Placed BEFORE side-effects (autoReceive, logOrderAction) per ADR-007/code-review:
    // даже если downstream throw, timeline все равно получит событие (best-effort в helper).
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'update_status',
      entity: 'production_order',
      entityId: id,
      details: { from: current.status, to: status, number: current.number },
    });

    // Cycle 53 (B.1): авто-IN готовой продукции на склад при completed.
    // Выполняем ПОСЛЕ update статуса — если update упадёт, IN не создастся.
    // autoReceiveFinishedGoods внутренне идемпотентен (race-safe + UNIQUE constraint).
    if (current.status !== 'completed' && status === 'completed') {
      try {
        const result = await autoReceiveFinishedGoods(id);
        if (result.errors.length > 0) {
          console.warn(
            `[cycle-53] Auto-IN partial fail для заказа ${id}: ${result.errors.join('; ')}`,
          );
        }
        if (result.created > 0 || result.skipped > 0) {
          console.log(
            `[cycle-53] Авто-IN для заказа ${id}: создано ${result.created}, пропущено ${result.skipped} (повторные/расы)`,
          );
        }
      } catch (err) {
        // Логируем но НЕ fail заказа — completion важнее чем inventory perfect-sync.
        // Это намеренный trade-off: business-critical (production completion) wins над
        // warehouse consistency (admin can manually adjust).
        console.error(`[cycle-53] Auto-IN critically failed для заказа ${id}:`, err);
      }
    }

    // Логируем смену статуса
    await logOrderAction({
      orderId: id,
      action: status === 'completed' ? 'closed' : 'status_changed',
      details: { fromStatus: current.status, toStatus: status },
    });

    return apiOk(item, `Заказ №${current.number} переведён в статус "${status}"`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
