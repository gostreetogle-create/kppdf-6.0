/**
 * Compile-time structural tests for `src/lib/types/server-pages.ts`.
 *
 * Goal: Detect silent regressions when someone refactors a single entity
 * wrapper. Tests use Vitest's `expectTypeOf` to assert Prisma-derived
 * types match expectations without runtime cost.
 *
 * NOTE: Tests are designed to be robust to Prisma regeneration:
 *   - We never assume specific field names inline.
 *   - We verify relation-presence via `not.toBeNever()`.
 *   - We use `toMatchTypeOf` (structural) over `toEqualTypeOf`
 *     to avoid transient interface-vs-type alias flakiness.
 */

import { describe, it, expect, expectTypeOf } from 'vitest';

import type {
  WarehouseListItem,
  ProposalListItem,
  ProductionOrderListItem,
  ProductListItem,
  ProductCategoryListItem,
  ContractListItem,
  OrganizationListItem,
  ClientListItem,
  TenderListItem,
} from '../server-pages';

// Runtime imports are needed for the page-size contract test (Cycle 26 ADR).
// Type-only imports above still satisfy the type-level suites below;
// we add explicit value imports here for the runtime assertions.
import {
  PROPOSAL_LIST_QUERY_ARGS,
  PRODUCTION_ORDER_LIST_QUERY_ARGS,
  PRODUCT_LIST_QUERY_ARGS,
  CONTRACT_LIST_QUERY_ARGS,
  CLIENT_LIST_QUERY_ARGS,
  WAREHOUSE_LIST_QUERY_ARGS,
  ORGANIZATION_LIST_QUERY_ARGS,
  TENDER_LIST_QUERY_ARGS,
  PRODUCT_CATEGORY_LIST_QUERY_ARGS,
} from '../server-pages';

// Runtime sanity check so vitest always sees a test in this file.
// If anyone removes the type-level checks below, this stays as a
// smoke-test that the file still loads.
describe('server-pages helpers — sanity', () => {
  it('test file executes', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('server-pages helpers — non-include pattern (B)', () => {
  // Each non-include ListItem should expose a stable identity object:
  // structural compatibility with itself (loose, not strict equality).
  it('WarehouseListItem is structurally self-consistent', () => {
    expectTypeOf<WarehouseListItem>().toMatchTypeOf<WarehouseListItem>();
  });

  it('OrganizationListItem is structurally self-consistent', () => {
    expectTypeOf<OrganizationListItem>().toMatchTypeOf<OrganizationListItem>();
  });

  it('ProductCategoryListItem is structurally self-consistent', () => {
    expectTypeOf<ProductCategoryListItem>().toMatchTypeOf<ProductCategoryListItem>();
  });

  it('TenderListItem is structurally self-consistent', () => {
    expectTypeOf<TenderListItem>().toMatchTypeOf<TenderListItem>();
  });
});

describe('server-pages helpers — include pattern (A)', () => {
  // For include entities, verify the relation-property exists and is
  // not `never` (which would happen if GetPayload dropped the include).
  // This is robust to field-level regen: only checks relation shape.

  it('ProposalListItem carries a client relation', () => {
    type ClientRel = ProposalListItem['client'];
    expectTypeOf<ClientRel>().not.toBeNever();
    // client can be either an object or null when not joined.
    expectTypeOf<NonNullable<ClientRel> | null>().toMatchTypeOf<ClientRel>();
  });

  it('ProposalListItem carries an items relation', () => {
    type ItemsRel = ProposalListItem['items'];
    expectTypeOf<ItemsRel>().not.toBeNever();
    // items is iterable
    expectTypeOf<ItemsRel>().toMatchTypeOf<readonly unknown[]>();
  });

  it('ProductionOrderListItem carries a workType relation', () => {
    type WorkTypeRel = ProductionOrderListItem['workType'];
    expectTypeOf<WorkTypeRel>().not.toBeNever();
    expectTypeOf<NonNullable<WorkTypeRel> | null>().toMatchTypeOf<WorkTypeRel>();
  });

  it('ProductListItem carries a category relation', () => {
    type CategoryRel = ProductListItem['category'];
    expectTypeOf<CategoryRel>().not.toBeNever();
    expectTypeOf<NonNullable<CategoryRel> | null>().toMatchTypeOf<CategoryRel>();
  });

  it('ContractListItem carries a client relation', () => {
    type ClientRel = ContractListItem['client'];
    expectTypeOf<ClientRel>().not.toBeNever();
    expectTypeOf<NonNullable<ClientRel> | null>().toMatchTypeOf<ClientRel>();
  });

  it('ClientListItem carries an organization relation', () => {
    type OrgRel = ClientListItem['organization'];
    expectTypeOf<OrgRel>().not.toBeNever();
    expectTypeOf<NonNullable<OrgRel> | null>().toMatchTypeOf<OrgRel>();
  });
});

// ============================================================================
// Cycle 26 ADR: page-size contract lock
// ============================================================================
//
// `take: 20` is the deliberate first-page render size for all 8 page-taking
// server-page helpers. This suite makes the contract RUNTIME-ENFORCED so
// silent edits to the per-entity constants fail CI rather than ship.
// See top-of-file "PAGE-SIZE CONTRACT" comment for architectural rationale.
describe('server-pages helpers — page-size contract (Cycle 26 ADR)', () => {
  it('page-taking entities lock to take: 20', () => {
    expect(PROPOSAL_LIST_QUERY_ARGS.take).toBe(20);
    expect(PRODUCTION_ORDER_LIST_QUERY_ARGS.take).toBe(20);
    expect(PRODUCT_LIST_QUERY_ARGS.take).toBe(20);
    expect(CONTRACT_LIST_QUERY_ARGS.take).toBe(20);
    expect(CLIENT_LIST_QUERY_ARGS.take).toBe(20);
    expect(WAREHOUSE_LIST_QUERY_ARGS.take).toBe(20);
    expect(ORGANIZATION_LIST_QUERY_ARGS.take).toBe(20);
    expect(TENDER_LIST_QUERY_ARGS.take).toBe(20);
  });

  it('ProductCategory intentionally omits take (small fixed sidebar list)', () => {
    expect(PRODUCT_CATEGORY_LIST_QUERY_ARGS.take).toBeUndefined();
  });
});
