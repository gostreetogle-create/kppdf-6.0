import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===== INLINE vi.mock factory pattern (cycle 49 round-2 fix) =====
//
// vi.mock hoists BEFORE imports. The factory closure is invoked lazily when
// auto-receive-finished-goods.ts imports `{ prisma }` from '../../db'.
// We define stub fns inside the factory so no module-level TDZ risk.
// vi.hoisted() lets us share mutable refs between the factory and tests.

const mocks = vi.hoisted(() => ({
  prisma: {
    productionOrder: { findUnique: vi.fn() },
    proposalItem: { findMany: vi.fn() },
    contract: { findUnique: vi.fn() },
    warehouse: { findFirst: vi.fn() },
    inventoryMovement: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../db', () => ({ prisma: mocks.prisma }));

import { autoReceiveFinishedGoods } from '../auto-receive-finished-goods';

const prismaStub = mocks.prisma;

beforeEach(() => {
  vi.clearAllMocks();
});

// ===== Order not found =====

describe('autoReceiveFinishedGoods — order not found', () => {
  it('должен вернуть {created:0, skipped:0, errors:["Заказ не найден"]} если findUnique = null', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await autoReceiveFinishedGoods('order-bad');
    expect(result).toEqual({ created: 0, skipped: 0, errors: ['Заказ не найден'] });
    expect(prismaStub.proposalItem.findMany).not.toHaveBeenCalled();
  });
});

// ===== No products (proposalItems пустые) =====

describe('autoReceiveFinishedGoods — пустые proposalItems', () => {
  it('должен вернуть {errors:["Нет товаров"]} если proposalItems.length = 0', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 0, skipped: 0, errors: ['Нет товаров в proposal/contract'] });
  });

  it('должен ИГНОРИРОВАТЬ items с productId=null в aggregation (defensive)', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: null, quantity: 5 },
      { productId: 'p-A', quantity: 3 },
      { productId: 'p-A', quantity: 2 }, // aggregated
      { productId: 'p-B', quantity: 1 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.created).toBe(0);
    expect(result.errors).toContain('Нет активного склада для приёмки готовой продукции');
  });
});

// ===== No active warehouse =====

describe('autoReceiveFinishedGoods — нет активного склада', () => {
  it('должен вернуть errors[] без транзакций', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 0, skipped: 0, errors: ['Нет активного склада для приёмки готовой продукции'] });
    expect(prismaStub.$transaction).not.toHaveBeenCalled();
  });
});

// ===== Contract fallback =====

describe('autoReceiveFinishedGoods — contract → proposalId fallback', () => {
  it('должен использовать contract.proposalId.items если contractId есть, proposalId=null', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: null, contractId: 'c1',
    });
    (prismaStub.contract.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      proposalId: 'p-via-contract',
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 10 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await autoReceiveFinishedGoods('o1');
    expect(prismaStub.contract.findUnique).toHaveBeenCalledWith({
      where: { id: 'c1' },
      select: { proposalId: true },
    });
    expect(prismaStub.proposalItem.findMany).toHaveBeenCalledWith({
      where: { proposalId: 'p-via-contract' },
      select: { productId: true, quantity: true },
    });
  });

  it('должен вернуть "Нет товаров" если contract без proposalId', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: null, contractId: 'c1',
    });
    (prismaStub.contract.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      proposalId: null,
    });
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.errors).toContain('Нет товаров в proposal/contract');
    expect(prismaStub.$transaction).not.toHaveBeenCalled();
  });
});

// ===== Idempotent pre-check (skipped) =====

describe('autoReceiveFinishedGoods — idempotent pre-check', () => {
  it('должен skip product если existingMovement уже есть, без $transaction call', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'mv-existing' });
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 0, skipped: 1, errors: [] });
    expect(prismaStub.$transaction).not.toHaveBeenCalled();
  });
});

// ===== Happy path =====

describe('autoReceiveFinishedGoods — happy path', () => {
  it('должен вызвать $transaction + upsert + create при empty pre-check', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 5 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb({
          storageItem: { upsert: vi.fn().mockResolvedValue({ id: 'si-1' }) },
          inventoryMovement: { create: vi.fn().mockResolvedValue({ id: 'mv-1' }) },
        });
      },
    );
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 1, skipped: 0, errors: [] });
    expect(prismaStub.$transaction).toHaveBeenCalledTimes(1);
  });

  it('должен передать корректные аргументы в upsert (warehouseId w1 + productId p-A, quantity=5)', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ productId: 'p-A', quantity: 5 }]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const txUpsert = vi.fn().mockResolvedValue({ id: 'si-1' });
    const txCreate = vi.fn().mockResolvedValue({ id: 'mv-1' });
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          storageItem: { upsert: txUpsert },
          inventoryMovement: { create: txCreate },
        }),
    );
    await autoReceiveFinishedGoods('o1');
    expect(txUpsert).toHaveBeenCalledWith({
      where: { warehouseId_productId: { warehouseId: 'w1', productId: 'p-A' } },
      create: {
        warehouseId: 'w1',
        productId: 'p-A',
        quantity: 5,
        reservedQty: 0,
        minQuantity: 0,
      },
      update: { quantity: { increment: 5 } },
      select: { id: true },
    });
    expect(txCreate).toHaveBeenCalledWith({
      data: {
        storageItemId: 'si-1',
        type: 'in',
        quantity: 5,
        notes: 'Авто-IN: производственный заказ o1',
        productionOrderId: 'o1',
      },
    });
  });
});

// ===== P2002 race condition =====

describe('autoReceiveFinishedGoods — P2002 race', () => {
  it('должен считать code="P2002" как skipped (НЕ error)', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(p2002);
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 0, skipped: 1, errors: [] });
  });

  it('должен считать message содержит "Unique constraint" как P2002 (fallback branch)', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ productId: 'p-A', quantity: 2 }]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const p2002Fallback = new Error('Unique constraint failed on the fields: (`productionOrderId`)');
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(p2002Fallback);
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.skipped).toBe(1);
    expect(result.errors).toEqual([]);
  });
});

// ===== Non-P2002 error =====

describe('autoReceiveFinishedGoods — non-P2002 error', () => {
  it('должен push-ить в errors[] per product при generic Error', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection refused'));
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual(['Product p-A: Connection refused']);
  });

  it('должен продолжить обработку остальных products при ошибке в одном (НЕ блокирует)', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
      { productId: 'p-B', quantity: 3 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    // p-A: throws error; p-B: success
    let callIdx = 0;
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        callIdx++;
        if (callIdx === 1) {
          // p-A: throw
          throw new Error('DB connection lost');
        }
        // p-B: success
        return cb({
          storageItem: { upsert: vi.fn().mockResolvedValue({ id: 'si-2' }) },
          inventoryMovement: { create: vi.fn().mockResolvedValue({ id: 'mv-2' }) },
        });
      },
    );
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Product p-A');
    expect(result.errors[0]).toContain('DB connection lost');
  });
});

// ===== Multiple products happy path =====

describe('autoReceiveFinishedGoods — multiple products', () => {
  it('должен обработать все N products при all-succeed', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 2 },
      { productId: 'p-B', quantity: 3 },
      { productId: 'p-C', quantity: 1 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          storageItem: { upsert: vi.fn().mockResolvedValue({ id: 'si-x' }) },
          inventoryMovement: { create: vi.fn().mockResolvedValue({ id: 'mv-x' }) },
        }),
    );
    const result = await autoReceiveFinishedGoods('o1');
    expect(result).toEqual({ created: 3, skipped: 0, errors: [] });
    expect(prismaStub.$transaction).toHaveBeenCalledTimes(3);
  });

  it('должен АГРЕГИРОВАТЬ quantity для одного productId из нескольких proposalItems', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-A', quantity: 3 },
      { productId: 'p-A', quantity: 5 },
      { productId: 'p-A', quantity: 2 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const txUpsert = vi.fn().mockResolvedValue({ id: 'si-1' });
    const txCreate = vi.fn().mockResolvedValue({ id: 'mv-1' });
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          storageItem: { upsert: txUpsert },
          inventoryMovement: { create: txCreate },
        }),
    );
    await autoReceiveFinishedGoods('o1');
    expect(txUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { warehouseId_productId: { warehouseId: 'w1', productId: 'p-A' } },
        create: expect.objectContaining({ quantity: 10 }),
        update: { quantity: { increment: 10 } },
      }),
    );
  });
});

// ===== Mixed outcomes =====

describe('autoReceiveFinishedGoods — mixed outcomes', () => {
  it('должен считать 1 ok + 1 P2002 + 1 generic error корректно в final breakdown', async () => {
    (prismaStub.productionOrder.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1', proposalId: 'p1', contractId: null,
    });
    (prismaStub.proposalItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { productId: 'p-OK', quantity: 1 },
      { productId: 'p-RACE', quantity: 1 },
      { productId: 'p-ERR', quantity: 1 },
    ]);
    (prismaStub.warehouse.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1', name: 'Main' });
    (prismaStub.inventoryMovement.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    let callIdx = 0;
    (prismaStub.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        callIdx++;
        if (callIdx === 1) {
          // p-OK: success
          return cb({
            storageItem: { upsert: vi.fn().mockResolvedValue({ id: 'si-1' }) },
            inventoryMovement: { create: vi.fn().mockResolvedValue({ id: 'mv-1' }) },
          });
        }
        if (callIdx === 2) {
          // p-RACE: P2002
          throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        }
        // p-ERR: generic
        throw new Error('DB timeout');
      },
    );
    const result = await autoReceiveFinishedGoods('o1');
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toEqual(['Product p-ERR: DB timeout']);
  });
});
