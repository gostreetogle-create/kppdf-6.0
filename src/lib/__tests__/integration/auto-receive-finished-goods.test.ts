/**
 * src/lib/__tests__/integration/auto-receive-finished-goods.test.ts (Cycle 48-49 / 6.1)
 *
 * Integration tests для `src/lib/warehouse/auto-receive-finished-goods.ts`
 * (cycle 53, foundation B.1).
 *
 * Покрывает critical paths в auto-IN при завершении производственного заказа:
 *   1. Happy path: productionOrder.findUnique → proposal.items aggregate
 *      → warehouse.findFirst активный → для каждого product: pre-check +
 *      $transaction(storageItem.upsert + inventoryMovement.create)
 *   2. Idempotency: existing InventoryMovement (pre-check) → skipped без tx
 *   3. Race-condition defence: P2002 из $transaction → skipped без error
 *   4. Non-P2002 error → errors[] added, остальные products продолжают
 *   5. Contract → proposal fallback path (когда productionOrder.contractId нет proposalId)
 *   6. Edge: order not found → early return с error
 *   7. Edge: пустой proposal → early return с error
 *   8. Edge: нет активного warehouse → early return с error
 *
 * Tier promotion: auto-receive-finished-goods.ts → Tier A candidate after this file.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/db', () => {
  const result = setupMockPrisma();
  registerMockPrismaTree(result.prisma);
  return result;
});

import {
  setupMockPrisma,
  registerMockPrismaTree,
  getMockPrisma,
  resetMockPrisma,
} from '../_helpers/mockPrisma';

import { autoReceiveFinishedGoods } from '@/lib/warehouse/auto-receive-finished-goods';

const ORDER_ID = 'order-1';
const PROPOSAL_ID = 'proposal-1';
const CONTRACT_ID = 'contract-1';
const WAREHOUSE_ID = 'warehouse-1';
const PRODUCT_IDS = ['product-A', 'product-B'];

describe('auto-receive-finished-goods integration', () => {
  beforeEach(() => {
    resetMockPrisma();
    const tree = getMockPrisma();

    // productionOrder.findUnique — default: order с proposalId
    tree.productionOrder.findUnique.mockImplementation(({ where, select }) => {
      const data: Record<string, string | null> = {
        id: where?.id ?? ORDER_ID,
        proposalId: PROPOSAL_ID,
        contractId: null,
      };
      return Promise.resolve(
        select
          ? Object.fromEntries(Object.keys(select).map((k) => [k, data[k]]))
          : data,
      );
    });

    // proposalItem.findMany — aggregate returns productId/quantity
    tree.proposalItem.findMany.mockImplementation(() =>
      Promise.resolve(
        PRODUCT_IDS.map((productId, idx) => ({
          productId,
          quantity: idx === 0 ? 10 : 5,
        })),
      ),
    );

    // contract.findUnique — для contract-path tests
    tree.contract.findUnique.mockImplementation(() =>
      Promise.resolve({ id: CONTRACT_ID, proposalId: PROPOSAL_ID }),
    );

    // warehouse.findFirst — active default
    tree.warehouse.findFirst.mockImplementation(() =>
      Promise.resolve({ id: WAREHOUSE_ID, name: 'Main' }),
    );

    // inventoryMovement.findFirst — idempotency pre-check (no existing initially)
    tree.inventoryMovement.findFirst.mockImplementation(() => Promise.resolve(null));

    // storageItem.upsert — return id keyed by productId
    tree.storageItem.upsert.mockImplementation(({ where }) =>
      Promise.resolve({ id: `si-${where.warehouseId_productId?.productId ?? 'unknown'}` }),
    );

    // $transaction — execute callback with same tree as tx
    tree.$transaction.mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(tree);
      }
      return Promise.resolve([]);
    });

    // inventoryMovement.create — succeeds by default
    tree.inventoryMovement.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: `mvt-${data.productionOrderId}-${data.storageItemId}`,
      }),
    );
  });

  describe('happy path', () => {
    it('агрегирует products из proposal.items и создаёт storageItem + movement', async () => {
      const result = await autoReceiveFinishedGoods(ORDER_ID);

      expect(result).toEqual({ created: 2, skipped: 0, errors: [] });

      // upsert вызывался для каждого product (2 раза)
      expect(getMockPrisma().storageItem.upsert).toHaveBeenCalledTimes(2);
      // inventoryMovement.create — 1 per product, всего 2
      expect(getMockPrisma().inventoryMovement.create).toHaveBeenCalledTimes(2);

      // validate calls содержат правильные productionOrderId + type='in'
      for (const call of getMockPrisma().inventoryMovement.create.mock.calls) {
        expect(call[0].data.productionOrderId).toBe(ORDER_ID);
        expect(call[0].data.type).toBe('in');
        expect(call[0].data.quantity).toBeGreaterThan(0);
      }

      // upsert использовал composite unique warehouseId_productId
      for (const call of getMockPrisma().storageItem.upsert.mock.calls) {
        expect(call[0].where.warehouseId_productId).toEqual({
          warehouseId: WAREHOUSE_ID,
          productId: expect.stringMatching(/^product-/),
        });
      }
    });

    it('возвращает result с created==0/errors если пустой proposal', async () => {
      getMockPrisma().proposalItem.findMany.mockImplementation(() => Promise.resolve([]));
      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.errors).toContain('Нет товаров в proposal/contract');
      expect(result.created).toBe(0);
      expect(getMockPrisma().storageItem.upsert).not.toHaveBeenCalled();
    });
  });

  describe('idempotency pre-check', () => {
    it('existing movement для product-A → skipped, без upsert для него', async () => {
      getMockPrisma().inventoryMovement.findFirst.mockImplementation(({ where }) => {
        if (where?.storageItem?.productId === 'product-A') {
          return Promise.resolve({ id: 'existing-mvt-A' });
        }
        return Promise.resolve(null);
      });

      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result).toEqual({ created: 1, skipped: 1, errors: [] });
      // upsert только для product-B
      expect(getMockPrisma().storageItem.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('race-condition defense (P2002)', () => {
    it('P2002 из transaction → skipped++ (не error)', async () => {
      // First product: upsert → P2002, second product: success
      let callIdx = 0;
      getMockPrisma().storageItem.upsert.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) {
          const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
          return Promise.reject(err);
        }
        return Promise.resolve({ id: `si-${callIdx}` });
      });

      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result).toEqual({ created: 1, skipped: 1, errors: [] });
    });

    it('non-P2002 error → errors[] pushed, остальные products OK', async () => {
      getMockPrisma().storageItem.upsert.mockImplementation(() =>
        Promise.reject(new Error('disk full migration')),
      );

      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('disk full migration');
    });
  });

  describe('contract → proposal fallback path', () => {
    it('contractId path: productionOrder.contractId → contract.findUnique → proposal.items', async () => {
      getMockPrisma().productionOrder.findUnique.mockImplementation(({ where }) =>
        Promise.resolve({
          id: where?.id ?? ORDER_ID,
          proposalId: null,
          contractId: CONTRACT_ID,
        }),
      );

      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.created).toBe(2);

      // contract.findUnique был вызван
      expect(getMockPrisma().contract.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CONTRACT_ID } }),
      );
      // proposalItem.findMany вызывался (минимум 1 раз — для aggregation)
      expect(getMockPrisma().proposalItem.findMany).toHaveBeenCalled();
    });

    it('contract без proposalId → 0 products → errors[]', async () => {
      getMockPrisma().productionOrder.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: ORDER_ID,
          proposalId: null,
          contractId: CONTRACT_ID,
        }),
      );
      getMockPrisma().contract.findUnique.mockImplementation(() =>
        Promise.resolve({ id: CONTRACT_ID, proposalId: null }),
      );

      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.errors).toContain('Нет товаров в proposal/contract');
      expect(result.created).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('order not found → early return с "Заказ не найден"', async () => {
      getMockPrisma().productionOrder.findUnique.mockImplementation(() => Promise.resolve(null));
      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.errors).toContain('Заказ не найден');
      expect(result.created).toBe(0);
      // никаких других prisma calls после findUnique
      expect(getMockPrisma().proposalItem.findMany).not.toHaveBeenCalled();
    });

    it('нет активного warehouse → early return с error', async () => {
      getMockPrisma().warehouse.findFirst.mockImplementation(() => Promise.resolve(null));
      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(result.errors).toContain('Нет активного склада для приёмки готовой продукции');
      expect(result.created).toBe(0);
    });
  });

  describe('result contract integrity', () => {
    it('result возвращает собственно numeric counters (created+skipped=total products)', async () => {
      // Default happy path: upsert succeed для both → created=2, skipped=0.
      // Strict `===` (vs `<=` ранее) гарантирует что все products processed без error.
      const result = await autoReceiveFinishedGoods(ORDER_ID);
      expect(typeof result.created).toBe('number');
      expect(typeof result.skipped).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.created + result.skipped).toBe(PRODUCT_IDS.length);
    });
  });
});
