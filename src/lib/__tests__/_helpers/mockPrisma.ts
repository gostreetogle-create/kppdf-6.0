/**
 * src/lib/__tests__/_helpers/mockPrisma.ts (Cycle 48-49 / 6.1)
 *
 * Centralized vi.mock factory для `@/lib/db` — позволяет per-test override
 * каждого prisma.X.Y метода без boilerplate в каждом test file.
 *
 * Usage:
 * ```typescript
 * vi.mock('@/lib/db', () => {
 *   const result = setupMockPrisma();
 *   registerMockPrismaTree(result.prisma);
 *   return result;
 * });
 *
 * import { getMockPrisma, resetMockPrisma } from '../_helpers/mockPrisma';
 *
 * beforeEach(() => {
 *   resetMockPrisma();
 *   getMockPrisma().userActivity.create.mockResolvedValue({ id: 'act-1', ... });
 * });
 *
 * it('records activity', async () => {
 *   await recordActivity({ ... });
 *   expect(getMockPrisma().userActivity.create).toHaveBeenCalledTimes(1);
 * });
 * ```
 *
 * Critical design decisions:
 *   1. **Memoization**: Proxy `get` handler caches vi.fn() per (model, method) в
 *      module-level WeakMap. Без memoization `mockReset`/`mockImplementation`
 *      применялись бы к разным fn-экземплярам, тестируемый код вызывал бы
 *      третий — assertions рассинхронизировались.
 *   2. **No `__registry` exposure in proxy**: type `MockModelMethods =
 *      Record<string, MockMethod>` — без загрязнения типа Map-property. Это
 *      позволяет TypeScript видеть `tree.statusWorkflow.findMany` напрямую как
 *      MockMethod (без cast, без `[key]` в тестах).
 *
 * Pattern coverage: ~30 основных моделей из schema.prisma. Дополнительные
 * добавлять в MODEL_NAMES ниже.
 *
 * Tier classification: TESTS — внутри Tier A foundation, не production code.
 * Изменения helper не требуют ADR.
 */
import { vi } from 'vitest';

type ModelName =
  | 'user'
  | 'organization'
  | 'person'
  | 'material'
  | 'product'
  | 'productCategory'
  | 'productModule'
  | 'proposal'
  | 'proposalItem'
  | 'contract'
  | 'contractItem'
  | 'productionOrder'
  | 'orderTask'
  | 'orderClosing'
  | 'incomingInvoice'
  | 'supplierOrder'
  | 'purchaseRequest'
  | 'inventoryMovement'
  | 'storageItem'
  | 'warehouse'
  | 'statusWorkflow'
  | 'userActivity'
  | 'cargoRequest'
  | 'docType'
  | 'documentTemplate'
  | 'tableTemplate'
  | 'worker'
  | 'inventorFile'
  | 'rppEntry'
  | 'certificate';

const MODEL_NAMES: ModelName[] = [
  'user',
  'organization',
  'person',
  'material',
  'product',
  'productCategory',
  'productModule',
  'proposal',
  'proposalItem',
  'contract',
  'contractItem',
  'productionOrder',
  'orderTask',
  'orderClosing',
  'incomingInvoice',
  'supplierOrder',
  'purchaseRequest',
  'inventoryMovement',
  'storageItem',
  'warehouse',
  'statusWorkflow',
  'userActivity',
  'cargoRequest',
  'docType',
  'documentTemplate',
  'tableTemplate',
  'worker',
  'inventorFile',
  'rppEntry',
  'certificate',
];

type MockMethod = ReturnType<typeof vi.fn>;
type MockModelMethods = Record<string, MockMethod>;

/**
 * Module-level WeakMap связывает proxy → registry Map<string, MockMethod>.
 * Скрыт от пользовательского типа — пользовательский код видит только
 * `Record<string, MockMethod>` (любое property access → MockMethod).
 */
const _registries = new WeakMap<MockModelMethods, Map<string, MockMethod>>();

function buildModelMock(): MockModelMethods {
  const registry = new Map<string, MockMethod>();
  const proxy = new Proxy({} as MockModelMethods, {
    get: (_target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      if (!registry.has(prop as string)) {
        registry.set(prop as string, vi.fn());
      }
      return registry.get(prop as string);
    },
  });
  _registries.set(proxy, registry);
  return proxy;
}

export type MockPrismaTree = Record<ModelName, MockModelMethods> & {
  $transaction: MockMethod;
};

export function setupMockPrisma(): { prisma: MockPrismaTree } {
  const tree = {} as MockPrismaTree;
  for (const model of MODEL_NAMES) {
    tree[model] = buildModelMock();
  }
  tree.$transaction = vi.fn();
  return { prisma: tree };
}

let _mockTree: MockPrismaTree | null = null;

/**
 * Сохраняет tree singleton из `vi.mock('@/lib/db', () => ...)` callback.
 * Вызывать ВНУТРИ vi.mock factory (hoisted vitest):
 *
 * ```ts
 * vi.mock('@/lib/db', () => {
 *   const result = setupMockPrisma();
 *   registerMockPrismaTree(result.prisma);
 *   return result;
 * });
 * ```
 */
export function registerMockPrismaTree(tree: MockPrismaTree): void {
  _mockTree = tree;
}

/**
 * Возвращает зарегистрированный tree. Throws если vi.mock не настроен —
 * помогает diagnose "mock not applied" errors вместо null-downstream bugs.
 */
export function getMockPrisma(): MockPrismaTree {
  if (!_mockTree) {
    throw new Error(
      '[mockPrisma] getMockPrisma() called before registerMockPrismaTree(). ' +
        'Ensure your test file has vi.mock("@/lib/db", () => { ... registerMockPrismaTree(...) }) ' +
        'ПЕРЕД imports тестируемого модуля.',
    );
  }
  return _mockTree;
}

/**
 * Reset всё: очищает call history + возвращает default (`undefined`).
 * Использовать в `beforeEach` для изоляции между test cases.
 */
export function resetMockPrisma(): void {
  if (!_mockTree) return;
  _mockTree.$transaction.mockReset();
  _mockTree.$transaction.mockImplementation(() => undefined);
  for (const model of MODEL_NAMES) {
    const registry = _registries.get(_mockTree[model]);
    if (!registry) continue;
    for (const fn of registry.values()) {
      fn.mockReset();
      fn.mockImplementation(() => undefined);
    }
  }
}

/**
 * Shorthand для registration once-shot resolved values:
 * `stubOnce(mockPrisma.user.findUnique, { id: 'u1', ... });`
 */
export function stubOnce(fn: MockMethod, value: unknown): void {
  fn.mockResolvedValueOnce(value);
}

/**
 * Stub once-shot P2002 (Prisma unique constraint violation) для race-condition
 * tests:
 *
 * ```ts
 * stubUniqueViolation(getMockPrisma().storageItem.upsert);
 * ```
 */
export function stubUniqueViolation(fn: MockMethod): void {
  const err = Object.assign(new Error('Unique constraint failed on the fields'), {
    code: 'P2002',
  });
  fn.mockRejectedValueOnce(err);
}
