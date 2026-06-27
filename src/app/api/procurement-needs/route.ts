import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

/**
 * GET /api/procurement-needs
 * Сводка потребностей в закупках с учётом складских остатков.
 * Агрегирует ModuleMaterial (isPurchased=true) из активных ProductionOrder,
 * сверяет со StorageItem на складах. Возвращает deficit = max(0, need - stock).
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAuth();

    // Получаем все активные производственные заказы с их КП
    const orders = await prisma.productionOrder.findMany({
      where: {
        status: { in: ['planned', 'in_progress'] },
        proposalId: { not: null },
      },
      select: { id: true, number: true, title: true, proposalId: true },
    });

    if (orders.length === 0) {
      return apiOk({ items: [], byOrder: [], totalStockItems: 0 });
    }

    const proposalIds = orders.map(o => o.proposalId!);

    const proposalItems = await prisma.proposalItem.findMany({
      where: { proposalId: { in: proposalIds }, productId: { not: null } },
      select: {
        proposalId: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            modules: {
              select: {
                id: true,
                name: true,
                materials: {
                  where: { isPurchased: true },
                  select: { name: true, quantity: true, unit: true },
                },
              },
            },
          },
        },
      },
    });

    // Загружаем складские остатки: ключ = имяПродукта|единица → { total, byWarehouse }
    const storageItems = await prisma.storageItem.findMany({
      where: { productId: { not: null } },
      include: { warehouse: { select: { id: true, name: true } }, product: { select: { id: true, name: true } } },
    });

    // Индекс склада: для быстрого сопоставления с материалами
    // Ключ: названиеПродукта|единица
    const stockIndex = new Map<string, { total: number; byWarehouse: { warehouse: string; qty: number }[] }>();
    for (const si of storageItems) {
      const pName = si.product?.name?.toLowerCase().trim();
      if (!pName) continue;
      const available = Math.max(0, si.quantity - si.reservedQty);
      if (available <= 0) continue;
      // Ключ — название продукта; единицу будем сопоставлять при сравнении
      const key = pName;
      const existing = stockIndex.get(key) || { total: 0, byWarehouse: [] };
      existing.total += available;
      existing.byWarehouse.push({ warehouse: si.warehouse.name, qty: available });
      stockIndex.set(key, existing);
    }

    // --- Агрегация ---
    const byOrderMap = new Map<string, {
      orderId: string; orderNumber: string; orderTitle: string;
      materials: { name: string; quantity: number; unit: string; source: string; inStock: number; deficit: number }[];
    }>();

    const aggregated = new Map<string, {
      totalQuantity: number; unit: string; inStock: number; deficit: number;
      orders: { orderNumber: string; quantity: number; source: string }[];
    }>();

    for (const item of proposalItems) {
      const order = orders.find(o => o.proposalId === item.proposalId);
      if (!order) continue;

      if (!byOrderMap.has(order.id)) {
        byOrderMap.set(order.id, { orderId: order.id, orderNumber: order.number, orderTitle: order.title, materials: [] });
      }
      const orderEntry = byOrderMap.get(order.id)!;

      for (const mod of (item.product?.modules ?? [])) {
        for (const mat of (mod.materials ?? [])) {
          const neededQty = mat.quantity * item.quantity;
          const key = `${mat.name}|${mat.unit}`;

          // Per-order
          const existing = orderEntry.materials.find(m => m.name === mat.name && m.unit === mat.unit);
          if (existing) {
            existing.quantity += neededQty;
          } else {
            orderEntry.materials.push({
              name: mat.name, quantity: neededQty, unit: mat.unit,
              source: `${item.product?.name || '?'} / ${mod.name}`,
              inStock: 0, deficit: 0,
            });
          }

          // Global
          const agg = aggregated.get(key) || { totalQuantity: 0, unit: mat.unit, inStock: 0, deficit: 0, orders: [] };
          agg.totalQuantity += neededQty;
          agg.unit = mat.unit;
          const orderRef = agg.orders.find(o => o.orderNumber === order.number);
          if (orderRef) { orderRef.quantity += neededQty; }
          else { agg.orders.push({ orderNumber: order.number, quantity: neededQty, source: `${item.product?.name || '?'} / ${mod.name}` }); }
          aggregated.set(key, agg);
        }
      }
    }

    // Рассчитываем inStock и deficit с учётом уже учтённого расхода
    for (const [key, agg] of aggregated) {
      const matName = key.split('|')[0].toLowerCase().trim();
      let stockTotal = 0;
      for (const [sk, sv] of stockIndex) {
        if (sk.includes(matName) || matName.includes(sk)) {
          stockTotal += sv.total;
        }
      }
      agg.inStock = stockTotal;
      agg.deficit = Math.max(0, agg.totalQuantity - agg.inStock);
    }

    // Переносим inStock/deficit на per-order материалы
    for (const [, entry] of byOrderMap) {
      for (const m of entry.materials) {
        const key = `${m.name}|${m.unit}`;
        const agg = aggregated.get(key);
        m.inStock = agg?.inStock ?? 0;
        m.deficit = Math.max(0, m.quantity - m.inStock);
      }
    }

    const items = Array.from(aggregated.entries()).map(([key, val]) => {
      const [name] = key.split('|');
      return { name, unit: val.unit, totalQuantity: val.totalQuantity, inStock: val.inStock, deficit: val.deficit, orders: val.orders };
    });

    const byOrder = Array.from(byOrderMap.values()).filter(o => o.materials.length > 0);

    const matchingStockCount = new Set<string>();
    for (const [key] of aggregated) {
      const matName = key.split('|')[0].toLowerCase().trim();
      for (const [sk] of stockIndex) {
        if (sk.includes(matName) || matName.includes(sk)) {
          matchingStockCount.add(sk);
        }
      }
    }

    return apiOk({ items, byOrder, totalOrders: orders.length, ordersWithNeeds: byOrder.length, totalStockItems: matchingStockCount.size });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
