/**
 * src/lib/__tests__/integration/clone-items.test.ts (Cycle 48-49 Part 3 / 6.1)
 *
 * Integration tests для `src/lib/proposals/clone-items.ts`
 * (cycle 43 / Block 3.2 — deep-copy ProposalItem для новой версии КП).
 *
 * Function contract:
 *   cloneProposalItems(tx, items, newProposalId) → number (count скопированных строк).
 *
 * Coverage (12 tests):
 *   - Input edge cases (2): empty → 0 без createMany; non-empty → createMany called once.
 *   - Data transformation (6): markupPercent null→0; sourceItemId=old.id; proposalId=target;
 *     productId preserved incl. null; passthrough quantity/unitPrice/total/sortOrder; data array length.
 *   - Tx isolation contract (3): custom tx used (NOT implicit); result.count propagates; error re-thrown.
 *
 * Mock strategy note:
 *   clone-items.ts uses tx parameter of type `Pick<TxClient, 'proposalItem'>`
 *   where TxClient is full Prisma TransactionClient (40+ methods on delegate).
 *   Mock approach:
 *   1. buildMockTx() возвращает LOCAL MockTx — `{ proposalItem: { createMany: vi.fn() } }`
 *      (пригодится для test assertions: mockResolvedValue, mock.calls, etc.)
 *   2. asProdTx() helper делает `unknown as Parameters<...>[0]` cast AT CALL SITE
 *      (production code не использует other delegate methods — undefined access OK).
 *
 *   Альтернатива: export narrowed type из clone-items.ts — но это changes production API.
 *
 * Tier promotion: clone-items.ts → Tier A candidate after this file.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  cloneProposalItems,
  type CloneableProposalItem,
} from '@/lib/proposals/clone-items';

// Local mock type — тип-минимум: snapshot deep-copy uses ONLY createMany.
type MockTx = {
  proposalItem: {
    createMany: ReturnType<typeof vi.fn>;
  };
};

function buildMockTx(): MockTx {
  return {
    proposalItem: {
      createMany: vi.fn(),
    },
  };
}

/**
 * Cast MockTx → production tx param type at call site.
 * Production code использует только `tx.proposalItem.createMany`; все
 * other delegate methods остаются неопределёнными — function не обращается.
 * Cast через `unknown` — стандарт structural-shape evasion.
 */
function asProdTx(tx: MockTx) {
  return tx as unknown as Parameters<typeof cloneProposalItems>[0];
}

const NEW_PROPOSAL_ID = 'new-proposal-1';

const ITEMS: CloneableProposalItem[] = [
  {
    id: 'item-1',
    quantity: 5,
    unitPrice: 100,
    markupPercent: 10,
    total: 550,
    sortOrder: 1,
    productId: 'p-1',
  },
  {
    id: 'item-2',
    quantity: 2,
    unitPrice: 200,
    markupPercent: null,
    total: 400,
    sortOrder: 2,
    productId: null,
  },
  {
    id: 'item-3',
    quantity: 1,
    unitPrice: 50,
    markupPercent: 5,
    total: 52.5,
    sortOrder: 0,
    productId: 'p-2',
  },
];

describe('cloneProposalItems', () => {
  let tx: MockTx;

  beforeEach(() => {
    tx = buildMockTx();
    tx.proposalItem.createMany.mockResolvedValue({ count: ITEMS.length });
  });

  describe('input edge cases', () => {
    it('empty items → return 0 без createMany call', async () => {
      const count = await cloneProposalItems(asProdTx(tx), [], NEW_PROPOSAL_ID);
      expect(count).toBe(0);
      expect(tx.proposalItem.createMany).not.toHaveBeenCalled();
    });

    it('non-empty items → createMany вызывается ровно 1 раз', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      expect(tx.proposalItem.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('data transformation', () => {
    it('markupPercent null → coerced to 0', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;

      expect(dataArg[1].markupPercent).toBe(0);
      expect(dataArg[0].markupPercent).toBe(10);
      expect(dataArg[2].markupPercent).toBe(5);
    });

    it('sourceItemId указывает на immediate parent (old item.id)', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;

      for (let i = 0; i < ITEMS.length; i++) {
        expect(dataArg[i].sourceItemId).toBe(ITEMS[i].id);
      }
    });

    it('proposalId = newProposalId для всех copied items', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;

      for (const d of dataArg) {
        expect(d.proposalId).toBe(NEW_PROPOSAL_ID);
      }
    });

    it('productId preserved as-is (включая null)', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;

      expect(dataArg[0].productId).toBe('p-1');
      expect(dataArg[1].productId).toBe(null);
      expect(dataArg[2].productId).toBe('p-2');
    });

    it('passthrough полей: quantity/unitPrice/total/sortOrder', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;

      for (let i = 0; i < ITEMS.length; i++) {
        expect(dataArg[i].quantity).toBe(ITEMS[i].quantity);
        expect(dataArg[i].unitPrice).toBe(ITEMS[i].unitPrice);
        expect(dataArg[i].total).toBe(ITEMS[i].total);
        expect(dataArg[i].sortOrder).toBe(ITEMS[i].sortOrder);
      }
    });

    it('data array length = input length', async () => {
      await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      const dataArg = tx.proposalItem.createMany.mock.calls[0][0].data;
      expect(dataArg).toHaveLength(ITEMS.length);
    });
  });

  describe('tx isolation contract', () => {
    it('использует переданный tx (НЕ implicit global prisma)', async () => {
      const customTx = buildMockTx();
      customTx.proposalItem.createMany.mockResolvedValue({ count: 7 });

      await cloneProposalItems(asProdTx(customTx), ITEMS, NEW_PROPOSAL_ID);

      expect(customTx.proposalItem.createMany).toHaveBeenCalledTimes(1);
    });

    it('return value propagates from tx.createMany result.count', async () => {
      tx.proposalItem.createMany.mockResolvedValue({ count: 999 });

      const count = await cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID);
      expect(count).toBe(999);
    });

    it('если tx.createMany throws → error propagates', async () => {
      const dbError = new Error('Unique constraint failed');
      tx.proposalItem.createMany.mockRejectedValueOnce(dbError);

      await expect(
        cloneProposalItems(asProdTx(tx), ITEMS, NEW_PROPOSAL_ID),
      ).rejects.toThrow('Unique constraint failed');
    });
  });
});
