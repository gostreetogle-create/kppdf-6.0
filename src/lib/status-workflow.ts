/**
 * status-workflow.ts — Cycle 51 (B.3) foundation layer.
 *
 * Единственный источник истины для допустимых status transitions:
 *   1. Live query к таблице StatusWorkflow (entity, fromStatus, toStatus → roles[]).
 *   2. In-memory cache 60s для уменьшения нагрузки на БД.
 *   3. Hardcoded fallback если таблице пуста (защита от misconfig).
 *   4. Cache invalidation через явный `invalidateStatusWorkflowCache()` call в admin route handlers.
 *
 * Использование в API handlers (например PATCH /api/proposals/[id]):
 *
 *   const user = await requireRole(['manager']); // получаем user один раз
 *   try {
 *     await assertTransitionAllowed('proposal', current.status, newStatus, user.role);
 *   } catch (error) {
 *     if (error instanceof WorkflowError && error.code === 'TRANSITION_NOT_ALLOWED') {
 *       return apiError(`Нельзя перевести из "${current.status}" в "${newStatus}"`, 400);
 *     }
 *     if (error instanceof WorkflowError && error.code === 'INSUFFICIENT_ROLE') {
 *       return apiError(error.message, 403);
 *     }
 *     throw error;
 *   }
 *
 * RBAC:
 *   - admin bypass — всегда проходит (consistent с `requireRole` в `auth.ts`).
 *   - 'any' wildcard в roles — означает любой авторизованный non-admin пользователь.
 *   - Иначе проверяется `roles.includes(user.role)`.
 *
 * Architectural decision: заменил хардкод VALID_TRANSITIONS из 5 route handlers на этот
 * helper, чтобы:
 *   - правила переходов редактируются в `/admin/status-workflows` без деплоя кода;
 *   - 60s cache компенсирует дополнительный DB query hot path;
 *   - единый source of truth = одна точка изменений.
 *
 * Tier classification: API STABLE. Любые изменения — через ADR per docs/CONTRIBUTING.md.
 */
import { prisma } from './db';

/**
 * Типы сущностей, для которых есть workflow.
 * 5 entity = все PATCH routes в проекте, которые ранее имели VALID_TRANSITIONS constant.
 */
export type WorkflowEntity =
  | 'proposal'
  | 'contract'
  | 'productionOrder'
  | 'incomingInvoice'
  | 'supplierOrder';

/**
 * Domain error thrown by assertTransitionAllowed.
 * API route handlers должны сопоставить code → HTTP status.
 */
export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: 'TRANSITION_NOT_ALLOWED' | 'INSUFFICIENT_ROLE',
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  /** Map<"fromStatus->toStatus", roles[]>. */
  data: Map<string, string[]>;
  expiresAt: number;
}

/**
 * Per-process in-memory cache.
 * NOTE: multi-pod deploy потребует revalidateTag (Next.js unstable_cache) или Redis —
 * пока проект работает на 1 инстансе, простая Map-с-killer-invalid достаточно.
 */
const cache = new Map<WorkflowEntity, CacheEntry>();

/**
 * Hardcoded fallback per entity — копия бывших VALID_TRANSITIONS maps из route handlers.
 * Используется когда БД пуста (например, после очистки admin'ом).
 * Default roles для всех = ['manager', 'admin'] — admin bypass обрабатывается отдельно.
 */
const FALLBACK_TRANSITIONS: Record<WorkflowEntity, Record<string, string[]>> = {
  proposal: {
    draft: ['sent'],
    sent: ['accepted', 'rejected', 'paid'],
    accepted: ['converted', 'paid'],
    paid: ['converted'],
    rejected: ['draft'],
  },
  contract: {
    draft: ['active'],
    active: ['completed', 'cancelled'],
    completed: ['cancelled'],
    cancelled: ['draft'],
  },
  productionOrder: {
    planned: ['in_progress', 'cancelled'],
    in_progress: ['manufacturing', 'painting', 'completed', 'cancelled'],
    manufacturing: ['painting', 'completed', 'cancelled'],
    painting: ['shipping', 'completed', 'cancelled'],
    shipping: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['planned'],
  },
  incomingInvoice: {
    draft: ['paid', 'overdue'],
    paid: [],
    overdue: ['paid', 'draft'],
  },
  supplierOrder: {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: ['draft'],
  },
};

async function loadTransitions(entity: WorkflowEntity): Promise<Map<string, string[]>> {
  const cached = cache.get(entity);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const rows = await prisma.statusWorkflow.findMany({
    where: { entity, isActive: true },
  });

  let transitions: Map<string, string[]>;
  if (rows.length === 0) {
    // Логируем warning — в проде это означает missing seed, требует внимания.
    console.warn(
      `[status-workflow] No DB transitions for entity="${entity}", using hardcoded fallback. ` +
        'Run migration 20260620120000_add_status_workflow_unique_and_seed to seed.',
    );
    transitions = new Map(
      Object.entries(FALLBACK_TRANSITIONS[entity]).flatMap(([from, toList]) =>
        toList.map((to) => [`${from}->${to}`, ['manager', 'admin']] as const),
      ),
    );
  } else {
    transitions = new Map(
      rows.map((row) => [
        `${row.fromStatus}->${row.toStatus}`,
        row.roles.split(',').map((r) => r.trim()).filter(Boolean),
      ]),
    );
  }

  cache.set(entity, { data: transitions, expiresAt: Date.now() + CACHE_TTL_MS });
  return transitions;
}

/**
 * Cache invalidation. Call after successful POST/PUT/DELETE в /api/status-workflows/*.
 * Без этого новое правило увидится только через 60s (TTL).
 */
export function invalidateStatusWorkflowCache(entity?: WorkflowEntity): void {
  if (entity) {
    cache.delete(entity);
  } else {
    cache.clear();
  }
}

/**
 * Проверяет допустимость перехода `<fromStatus> → <toStatus>` для пользователя с ролью `userRole`.
 *
 * Throws:
 *   - WorkflowError({code: 'TRANSITION_NOT_ALLOWED'}) если переход отсутствует в workflow.
 *   - WorkflowError({code: 'INSUFFICIENT_ROLE'}) если роль не в списке разрешённых
 *     (и не admin, и не wildcard 'any').
 *
 * Не делает DB write и не мутирует state — это чистая read-проверка.
 */
export async function assertTransitionAllowed(
  entity: WorkflowEntity,
  fromStatus: string,
  toStatus: string,
  userRole: string,
): Promise<void> {
  const transitions = await loadTransitions(entity);
  const key = `${fromStatus}->${toStatus}`;
  const allowedRoles = transitions.get(key);

  if (!allowedRoles) {
    throw new WorkflowError(
      `Нельзя перевести из "${fromStatus}" в "${toStatus}"`,
      'TRANSITION_NOT_ALLOWED',
    );
  }

  // Admin bypass — consistent с поведением requireRole в src/lib/auth.ts.
  if (userRole === 'admin') return;

  // 'any' wildcard — означает, что любой авторизованный пользователь может выполнить переход.
  if (allowedRoles.includes('any')) return;

  if (!allowedRoles.includes(userRole)) {
    throw new WorkflowError(
      `Роль "${userRole}" не может выполнить переход "${fromStatus}" → "${toStatus}"`,
      'INSUFFICIENT_ROLE',
    );
  }
}
