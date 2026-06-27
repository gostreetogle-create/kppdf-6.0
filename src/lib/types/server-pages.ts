/**
 * Типизированные обёртки для server pages.
 *
 * Цель: заменить `as any[]` casts в 9 server pages точными Prisma-типами,
 * производными от query args через `Prisma.XGetPayload<typeof args>` (для entities
 * с `include`) или от прямого base-model экспорта (для entities без `include`).
 *
 * Паттерн использования (MiMo cycle 14):
 *
 *   // ДО:
 *   const proposals = await prisma.proposal.findMany({ include: {...} });
 *   return <ProposalsClient initialData={proposals as any[]} initialTotal={total} />;
 *
 *   // ПОСЛЕ (entity с include — Proposal, Product, Contract, Client, ProductionOrder):
 *   import { PROPOSAL_LIST_QUERY_ARGS, type ProposalListItem } from '@/lib/types/server-pages';
 *   const proposals = await prisma.proposal.findMany(PROPOSAL_LIST_QUERY_ARGS);
 *   return <ProposalsClient initialData={proposals} initialTotal={total} />;
 *
 *   // ПОСЛЕ (entity без include — Warehouse, ProductCategory, Organization, Tender):
 *   import { WAREHOUSE_LIST_QUERY_ARGS, type WarehouseListItem } from '@/lib/types/server-pages';
 *   const warehouses = await prisma.warehouse.findMany(WAREHOUSE_LIST_QUERY_ARGS);
 *   return <WarehousesClient initialData={warehouses} initialTotal={total} />;
 *
 * Преимущества:
 * - Single source of truth: query shape + return type описаны в helper
 * - Типы автоматически синхронизируются при `prisma generate` (после schema.prisma изменений)
 * - Нет `any` casts → strict TS + ESLint happy
 * - IDE автокомплит полей включая included relations
 */

// ============================================================================
// PATTERN GUIDE — какой паттерн для какой сущности
// ============================================================================
//
// (A) С `include` (5: Proposal, ProductionOrder, Product, Contract, Client):
//
//     export const X_LIST_QUERY_ARGS = {
//       orderBy: {...},
//       take: 20,
//       include: {...},
//     } satisfies Prisma.XFindManyArgs;
//     export type XListItem = Prisma.XGetPayload<typeof X_LIST_QUERY_ARGS>;
//
//     Native `satisfies` (TS 4.9+) сохраняет литеральную форму `include`,
//     `GetPayload<typeof args>` извлекает тип с правильными relations.
//
// (B) БЕЗ `include` (4: Warehouse, ProductCategory, Organization, Tender):
//
//     export const X_LIST_QUERY_ARGS: Prisma.XFindManyArgs = {...};
//     export type XListItem = X;  // прямой base-model export
//
//     Explicit annotation даёт IDE auto-complete для `orderBy`/`take`.
//     Так как `findMany` без select/include возвращает полный flat scalar
//     shape, `XListItem` = базовый model = semantically identical.
//
// © Почему два паттерна из-за TypeScript Weak Type rules: `XFindManyArgs`
//   содержит только optional `select/include/omit` для affects-payload
//   полей. Args только с `orderBy`/`take` не имеют overlap → TS2344 при
//   `satisfies`. Annotation bypasses weak-type check, поэтому (B) возможен.
//
// © `Prisma.validator<T>()()` (Prisma 5.x-нотация) НЕ доступна в custom
//   generator output нашего `@/generated/prisma/client` (Prisma 7) — в
//   `@prisma/client/runtime/library` всё ещё есть, но наш generator не
//   реэкспортит. Поэтому явный annotation/satisfies.
// ============================================================================

// NOTE: Prisma v7 `prisma-client` generator does NOT re-export `Prisma.validator`.
//       Use explicit annotation/satisfies pattern (see PATTERN GUIDE above).
import { Prisma } from '../../generated/prisma/client';
import type {
  Warehouse,
  ProductCategory,
  Organization,
  Person,
  Tender,
  WorkCenter,
  WorkType,
  Worker,
  PurchaseRequest,
} from '../../generated/prisma/client';

// PAGE-SIZE CONTRACT (Cycle 26 ADR — closes prior `TODO pagination`):
//
// `take: 20` per entity helper is INTENTIONAL for now. Server pages do NOT
// receive `pageSize` query params. List pages render the first 20 rows
// deterministically (sufficient for 70+ pages with CRUD over modest data).
// RELATED INFRASTRUCTURE (already shipped, orthogonal concern):
//  • API routes already implement `page` + `limit` query params with
//    `skip` / `take` semantics (e.g. `/api/{warehouses,tenders,...}/route.ts`).
//    `/api/my-tasks` is the single-row exception (`take: 1` for per-user task lookup).
//  • Frontend client-side fetches already pass `?limit=N` where CrudPage
//     demands it (admin/dashboard tiles, finance/reports, production/gantt, etc.).
//
// WHEN TO PARAMETERIZE:
//  • User clicks "next page" on a list page → CrudPage triggers server-page
//    reload with `?page=2&pageSize=20` → server-page proxies into
//    `prisma.x.findMany({ take: pageSize, skip: (page - 1) * pageSize })`.
//  • Until CrudPage ships pagination UI:
//      — DO NOT add `pageSize` param to these constants (dead code).
//      — DO NOT change `take: 20` lightly without cross-checking UX impact.
//  • When triggered, add it once: introduce `*_PAGE_SIZE_QUERY_ARGS` shape
//    that accepts `{ page, pageSize }` and apply same pattern uniformly.
//
// STATUS: DEFERRED (not TODO). Closed as architectural decision in Cycle 26.
// See src/components/crud-page.tsx (UI layer) for whether pagination
// has landed yet; check src/lib/types/__tests__/server-pages.test.ts
// for runtime lock that take === 20 across all 8 page-taking entities.
//
// Rationale (cycle 14 → cycle 26): original TODO was created when this file
// was added. Two cycles later (cycle 26 audit) we surveyed all consumers and
// confirmed the API layer owns pagination while server-pages own first-page
// rendering. Different concerns, single source-of-truth each.
// ============================================================================
// Warehouse (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/warehouse/page.tsx
// prisma.warehouse.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
// Раньше: `<WarehousesClient initialData={warehouses as any[]} ... />`

export const WAREHOUSE_LIST_QUERY_ARGS: Prisma.WarehouseFindManyArgs = {
  orderBy: { createdAt: 'desc' },
  take: 20,
};

export type WarehouseListItem = Warehouse;

// ============================================================================
// Proposal (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/proposals/page.tsx
// prisma.proposal.findMany({ orderBy, take, include {client, items} })
// Раньше: `proposals as any[]`

export const PROPOSAL_LIST_QUERY_ARGS = {
  orderBy: { createdAt: 'desc' },
  take: 20,
  include: {
    customer: { select: { name: true } },
    items: { select: { total: true } },
  },
} satisfies Prisma.ProposalFindManyArgs;

export type ProposalListItem = Prisma.ProposalGetPayload<typeof PROPOSAL_LIST_QUERY_ARGS>;

// ============================================================================
// ProductionOrder (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/production/page.tsx
// prisma.productionOrder.findMany({ orderBy, take, include {workType {name}} })
// Раньше: `orders as any[]`

export const PRODUCTION_ORDER_LIST_QUERY_ARGS = {
  orderBy: { createdAt: 'desc' },
  take: 20,
  include: {
    workType: { select: { name: true } },
  },
} satisfies Prisma.ProductionOrderFindManyArgs;

export type ProductionOrderListItem = Prisma.ProductionOrderGetPayload<typeof PRODUCTION_ORDER_LIST_QUERY_ARGS>;

// ============================================================================
// Product (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/products/page.tsx
// prisma.product.findMany({ orderBy, take, include {category {name}} })
// Раньше: `products as any[]`

export const PRODUCT_LIST_QUERY_ARGS = {
  orderBy: { createdAt: 'desc' },
  take: 20,
  include: {
    category: { select: { name: true } },
  },
} satisfies Prisma.ProductFindManyArgs;

export type ProductListItem = Prisma.ProductGetPayload<typeof PRODUCT_LIST_QUERY_ARGS>;

// ============================================================================
// ProductCategory (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/products/categories/page.tsx
// prisma.productCategory.findMany({ orderBy: { sortOrder: 'asc' } })
// INTENTIONAL: NO `take: 20` — categories expected to be a small fixed
// list (~ ≤ 30) used as sidebar/filter. Don't "fix" this to add `take`.
// Раньше: `categories as any[]`

export const PRODUCT_CATEGORY_LIST_QUERY_ARGS: Prisma.ProductCategoryFindManyArgs = {
  orderBy: { sortOrder: 'asc' },
};

export type ProductCategoryListItem = ProductCategory;

// ============================================================================
// Contract (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/contracts/page.tsx
// prisma.contract.findMany({ orderBy, take, include {client {lastName, firstName}} })
// Раньше: `contracts as any[]`

export const CONTRACT_LIST_QUERY_ARGS = {
  orderBy: { createdAt: 'desc' },
  take: 20,
  include: {
    customer: { select: { name: true } },
  },
} satisfies Prisma.ContractFindManyArgs;

export type ContractListItem = Prisma.ContractGetPayload<typeof CONTRACT_LIST_QUERY_ARGS>;

// ============================================================================
// Organization (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/organizations/page.tsx
// prisma.organization.findMany({ orderBy, take })
// Раньше: `organizations as any[]`

export const ORGANIZATION_LIST_QUERY_ARGS: Prisma.OrganizationFindManyArgs = {
  orderBy: { createdAt: 'desc' },
  take: 20,
};

export type OrganizationListItem = Organization;

// ============================================================================
// Person (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/persons/page.tsx
// prisma.person.findMany({ orderBy, take })

export const PERSON_LIST_QUERY_ARGS: Prisma.PersonFindManyArgs = {
  orderBy: { lastName: 'asc' },
  take: 20,
};

export type PersonListItem = Person;

// ============================================================================
// Tender (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/admin/tenders/page.tsx
// prisma.tender.findMany({ orderBy, take })
// NOTE: admin/page.tsx has NO `as any[]` (it's a client-side fetch dashboard),
// so no helper export is needed for it. This is the only Tender wrapper.
// Раньше: `tenders as any[]`

export const TENDER_LIST_QUERY_ARGS: Prisma.TenderFindManyArgs = {
  orderBy: { createdAt: 'desc' },
  take: 20,
};

export type TenderListItem = Tender;

// ============================================================================
// Material (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/materials/page.tsx
// prisma.material.findMany({ orderBy, take, include {supplier {name}, category {name}} })

export const MATERIAL_LIST_QUERY_ARGS = {
  orderBy: { name: 'asc' },
  take: 20,
  include: {
    supplier: { select: { name: true } },
    category: { select: { name: true } },
  },
} satisfies Prisma.MaterialFindManyArgs;

export type MaterialListItem = Prisma.MaterialGetPayload<typeof MATERIAL_LIST_QUERY_ARGS>;

// ============================================================================
// WorkCenter (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/production/work-centers/page.tsx

export const WORK_CENTER_LIST_QUERY_ARGS: Prisma.WorkCenterFindManyArgs = {
  orderBy: { name: 'asc' },
  take: 20,
};

export type WorkCenterListItem = WorkCenter;

// ============================================================================
// WorkType (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/production/work-types/page.tsx

export const WORK_TYPE_LIST_QUERY_ARGS: Prisma.WorkTypeFindManyArgs = {
  orderBy: { name: 'asc' },
  take: 20,
};

export type WorkTypeListItem = WorkType;

// ============================================================================
// Worker (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/production/workers/page.tsx

export const WORKER_LIST_QUERY_ARGS: Prisma.WorkerFindManyArgs = {
  orderBy: { lastName: 'asc' },
  take: 20,
};

export type WorkerListItem = Worker;

// ============================================================================
// StorageItem (with includes) — PATTERN (A)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/warehouse/positions/page.tsx

export const STORAGE_ITEM_LIST_QUERY_ARGS = {
  orderBy: { warehouseId: 'asc' },
  take: 20,
  include: {
    warehouse: { select: { name: true } },
    product: { select: { name: true } },
  },
} satisfies Prisma.StorageItemFindManyArgs;

export type StorageItemListItem = Prisma.StorageItemGetPayload<typeof STORAGE_ITEM_LIST_QUERY_ARGS>;

// ============================================================================
// PurchaseRequest (no includes) — PATTERN (B)
// ============================================================================
//
// page.tsx: src/app/(dashboard)/warehouse/purchases/page.tsx

export const PURCHASE_REQUEST_LIST_QUERY_ARGS: Prisma.PurchaseRequestFindManyArgs = {
  orderBy: { createdAt: 'desc' },
  take: 20,
};

export type PurchaseRequestListItem = PurchaseRequest;
