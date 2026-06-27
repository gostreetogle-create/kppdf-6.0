/**
 * src/lib/__tests__/integration/status-workflow.test.ts (Cycle 48-49 / 6.1)
 *
 * Integration tests для `src/lib/status-workflow.ts` (cycle 51, foundation B.3).
 *
 * Покрывает ключевые paths используемые 5 PATCH routes:
 *   1. Live query → prisma.statusWorkflow.findMany с where { entity, isActive: true }
 *   2. 60s in-memory cache (per-process Map) — повторный доступ НЕ должен
 *      выполнять дополнительный DB query
 *   3. Admin bypass (consistent с requireRole в src/lib/auth.ts)
 *   4. 'any' wildcard — позволяет любой авторизованный роль
 *   5. INSUFFICIENT_ROLE — когда role нет в list и != 'any' и != 'admin'
 *   6. TRANSITION_NOT_ALLOWED — переход отсутствует в workflow
 *   7. DB-empty fallback — копия hardcoded FALLBACK_TRANSITIONS (managed='manager,admin')
 *   8. invalidateStatusWorkflowCache(entity) — per-entity cache reset
 *
 * Tier promotion: status-workflow.ts → Tier A candidate after this file.
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

import {
  assertTransitionAllowed,
  invalidateStatusWorkflowCache,
  WorkflowError,
} from '@/lib/status-workflow';

const PROPOSAL_ROWS = [
  { entity: 'proposal', fromStatus: 'draft', toStatus: 'sent', roles: 'manager', isActive: true },
  {
    entity: 'proposal',
    fromStatus: 'sent',
    toStatus: 'accepted',
    roles: 'manager,admin',
    isActive: true,
  },
  { entity: 'proposal', fromStatus: 'sent', toStatus: 'paid', roles: 'any', isActive: true },
  { entity: 'proposal', fromStatus: 'paid', toStatus: 'converted', roles: 'manager', isActive: true },
];

describe('status-workflow integration', () => {
  beforeEach(() => {
    resetMockPrisma();
    invalidateStatusWorkflowCache();
    const tree = getMockPrisma();
    tree.statusWorkflow.findMany.mockImplementation(({ where }) =>
      Promise.resolve(
        PROPOSAL_ROWS.filter(
          (r) => r.entity === where?.entity && r.isActive === true,
        ),
      ),
    );
  });

  describe('DB query path', () => {
    it('queries DB with correct filter for entity', async () => {
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledWith({
        where: { entity: 'proposal', isActive: true },
      });
    });

    it('happy path: draft → sent разрешён для manager', async () => {
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'manager'),
      ).resolves.toBeUndefined();
    });

    it('happy path: sent → accepted разрешён для manager', async () => {
      await expect(
        assertTransitionAllowed('proposal', 'sent', 'accepted', 'manager'),
      ).resolves.toBeUndefined();
    });
  });

  describe('cache behavior', () => {
    it('60s cache: 2-й call той же entity НЕ делает повторный DB query', async () => {
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      await assertTransitionAllowed('proposal', 'sent', 'accepted', 'manager');
      await assertTransitionAllowed('proposal', 'paid', 'converted', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledTimes(1);
    });

    it('разные entities — отдельные cache entries, обе идут в DB', async () => {
      // contract rows
      getMockPrisma().statusWorkflow.findMany.mockImplementation(({ where }) =>
        Promise.resolve(
          where?.entity === 'contract'
            ? [
                {
                  entity: 'contract',
                  fromStatus: 'draft',
                  toStatus: 'active',
                  roles: 'manager',
                  isActive: true,
                },
              ]
            : PROPOSAL_ROWS.filter((r) => r.entity === where?.entity),
        ),
      );

      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      await assertTransitionAllowed('contract', 'draft', 'active', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledTimes(2);
    });

    it('invalidateStatusWorkflowCache() сбрасывает per-entity cache', async () => {
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledTimes(1);

      invalidateStatusWorkflowCache('proposal');
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledTimes(2);
    });

    it('invalidateStatusWorkflowCache() без arg сбрасывает все entities', async () => {
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      invalidateStatusWorkflowCache();
      await assertTransitionAllowed('proposal', 'draft', 'sent', 'manager');
      expect(getMockPrisma().statusWorkflow.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('admin bypass', () => {
    it('admin проходит ANY transition (даже если roles не включают admin)', async () => {
      // roles='manager' only — admin должен bypass
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'admin'),
      ).resolves.toBeUndefined();
    });

    it('admin проходит даже UNKNOWN transition… но в DB её нет → TRANSITION_NOT_ALLOWED', async () => {
      // Demonstrating: admin bypass действует ТОЛЬКО после переход найден в workflow.
      // Несуществующий переход всё равно даст ошибку (логично: admin тоже не может).
      await expect(
        assertTransitionAllowed('proposal', 'accepted', 'draft', 'admin'),
      ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    });
  });

  describe('wildcard "any" semantics', () => {
    it('любая авторизованная роль может выполнить transition с roles="any"', async () => {
      await expect(
        assertTransitionAllowed('proposal', 'sent', 'paid', 'viewer'),
      ).resolves.toBeUndefined();
      await expect(
        assertTransitionAllowed('proposal', 'sent', 'paid', 'production'),
      ).resolves.toBeUndefined();
    });
  });

  describe('error paths', () => {
    it('INSUFFICIENT_ROLE: viewer не в roles list', async () => {
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'viewer'),
      ).rejects.toThrow(WorkflowError);
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'viewer'),
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_ROLE',
        message: expect.stringContaining('viewer'),
      });
    });

    it('TRANSITION_NOT_ALLOWED: переход отсутствует в workflow', async () => {
      await expect(
        assertTransitionAllowed('proposal', 'paid', 'draft', 'manager'),
      ).rejects.toThrow(WorkflowError);
      await expect(
        assertTransitionAllowed('proposal', 'paid', 'draft', 'manager'),
      ).rejects.toMatchObject({
        code: 'TRANSITION_NOT_ALLOWED',
        message: expect.stringContaining('Нельзя перевести'),
      });
    });

    it('productionOrderEntity routing — использует DB rows, не fallback', async () => {
      // productionOrder DB rows: planned → in_progress разрешён manager
      getMockPrisma().statusWorkflow.findMany.mockImplementationOnce(() =>
        Promise.resolve([
          {
            entity: 'productionOrder',
            fromStatus: 'planned',
            toStatus: 'in_progress',
            roles: 'manager,production',
            isActive: true,
          },
        ]),
      );
      invalidateStatusWorkflowCache('productionOrder');
      await expect(
        assertTransitionAllowed('productionOrder', 'planned', 'in_progress', 'production'),
      ).resolves.toBeUndefined();
    });
  });

  describe('DB-empty fallback', () => {
    it('пустой rows → fallback к hardcoded FALLBACK_TRANSITIONS', async () => {
      getMockPrisma().statusWorkflow.findMany.mockImplementation(() => Promise.resolve([]));

      // proposal fallbacks: draft→sent разрешён ['manager','admin']
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'manager'),
      ).resolves.toBeUndefined();

      // viewer не должен проходить (fallback roles не включают viewer)
      // Note: cache holds the fallback data now — invalidate first by querying another entity
      await expect(
        assertTransitionAllowed('proposal', 'draft', 'sent', 'viewer'),
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_ROLE' });
    });
  });
});
