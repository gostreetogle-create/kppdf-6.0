/**
 * auto-receive-finished-goods.ts — Cycle 53 (B.1) foundation.
 *
 * Автоматическое оприходование готовой продукции на склад при завершении
 * производственного заказа (ProductionOrder.status = 'completed').
 *
 * Вызывается из PATCH /api/production-orders/[id]/status сразу после
 * успешного update перевода в 'completed'. Foundation layer (cycles 51+52)
 * уже enforced RBAC (manager+production могут переводить в completed) и
 * уже гарантирует допустимость transition через StatusWorkflow live query.
 *
 * Логика (per product, в prisma.$transaction):
 *   1. Pre-check: уже есть InventoryMovement IN для (order, storageItem)?
 *      -> Idempotent skip (двойной клик completed или retry не удвоит).
 *   2. StorageItem.upsert(warehouseId, productId) — создаёт если нет
 *      (quantity=0), без изменений если есть.
 *   3. InventoryMovement.create(type='in', productionOrderId=orderId) —
 *      @@unique([productionOrderId, storageItemId, type]) защищает от race
 *      даже если pre-check был обойдён concurrent запросом.
 *   4. StorageItem.update(quantity: { increment }) — атомарный рост остатка.
 *
 * Если transaction rolls back (race detected), StorageItem.increment не
 * происходит, search proceeds to next product. Учёт skipped/errors отделён.
 *
 * Tier classification: API surface (signature) STABLE. Internal logic
 * может меняться (cycle 53 → 53.5 если нужна defense от другого race type).
 */
import { prisma } from '../db';

export interface AutoReceiveResult {
  /** Количество успешно оприходованных продуктов. */
  created: number;
  /** Количество пропущенных (race или уже принят в предыдущем вызове). */
  skipped: number;
  /** Сообщения об ошибках per product (НЕ блокируют другие продукты). */
  errors: string[];
}

/**
 * Авто-приёмка готовой продукции для production order.
 *
 * @param orderId - CUID ProductionOrder (status уже transition в 'completed')
 * @returns AutoReceiveResult с created/skipped/errors breakdown
 */
export async function autoReceiveFinishedGoods(orderId: string): Promise<AutoReceiveResult> {
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    select: { id: true, proposalId: true, contractId: true },
  });
  if (!order) {
    return { created: 0, skipped: 0, errors: ['Заказ не найден'] };
  }

  // Собираем productId -> aggregate quantity из proposal/contract items.
  const productQuantities = new Map<string, number>();

  if (order.proposalId) {
    const items = await prisma.proposalItem.findMany({
      where: { proposalId: order.proposalId },
      select: { productId: true, quantity: true },
    });
    for (const item of items) {
      if (item.productId) {
        productQuantities.set(
          item.productId,
          (productQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }
  } else if (order.contractId) {
    // ContractItem не имеет productId → fallback to contract.proposalId.items.
    const contract = await prisma.contract.findUnique({
      where: { id: order.contractId },
      select: { proposalId: true },
    });
    if (contract?.proposalId) {
      const items = await prisma.proposalItem.findMany({
        where: { proposalId: contract.proposalId },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
        if (item.productId) {
          productQuantities.set(
            item.productId,
            (productQuantities.get(item.productId) ?? 0) + item.quantity,
          );
        }
      }
    }
  }

  if (productQuantities.size === 0) {
    return { created: 0, skipped: 0, errors: ['Нет товаров в proposal/contract'] };
  }

  // Default warehouse: первый с isActive=true. Без active warehouse — ранний 5xx.
  const warehouse = await prisma.warehouse.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }, // deterministic choice
    select: { id: true, name: true },
  });
  if (!warehouse) {
    return {
      created: 0,
      skipped: 0,
      errors: ['Нет активного склада для приёмки готовой продукции'],
    };
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [productId, quantity] of productQuantities) {
    try {
      // Idempotent pre-check: если уже принято для этого (order, product),
      // пропускаем без INSERT race.
      const existingMovement = await prisma.inventoryMovement.findFirst({
        where: {
          productionOrderId: orderId,
          type: 'in',
          storageItem: { warehouseId: warehouse.id, productId },
        },
        select: { id: true },
      });
      if (existingMovement) {
        skipped++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // Upsert StorageItem по composite unique (warehouseId, productId).
        // Один round-trip: если StorageItem существует — increment на месте;
        // если нет — create с quantity=quantity (нет ниже отдельного update).
        const storageItem = await tx.storageItem.upsert({
          where: { warehouseId_productId: { warehouseId: warehouse.id, productId } },
          create: {
            warehouseId: warehouse.id,
            productId,
            quantity,
            reservedQty: 0,
            minQuantity: 0,
          },
          update: {
            quantity: { increment: quantity },
          },
          select: { id: true },
        });

        // Создаём InventoryMovement type='in'. @@unique constraint служит
        // last-line race defense если concurrent запрос обошёл pre-check.
        await tx.inventoryMovement.create({
          data: {
            storageItemId: storageItem.id,
            type: 'in',
            quantity,
            notes: `Авто-IN: производственный заказ ${orderId}`,
            productionOrderId: orderId,
          },
        });
      });
      created++;
    } catch (err) {
      // P2002 (Prisma unique constraint violation) = другой concurrent запрос
      // уже принял этот product для этого order. Таблица индексов правильная,
      // это ожидаемый race-condition outcome — не ошибка приложения.
      const isUniqueViolation =
        err instanceof Error &&
        ('code' in err
          ? (err as { code?: string }).code === 'P2002'
          : err.message.includes('Unique constraint'));
      if (isUniqueViolation) {
        skipped++;
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Product ${productId}: ${msg}`);
      }
    }
  }

  return { created, skipped, errors };
}
