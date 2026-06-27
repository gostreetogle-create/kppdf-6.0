/**
 * Cycle 60+ (D-A3 extension) — Per-entity RBAC matrix integration tests.
 *
 * Replaces the 6-test simplified version from cycle 60. Covers the role × route
 * invariants end-to-end at the route boundary, using mocked auth + prisma:
 *
 *   - vi.hoisted() holds mutable `userRecord` + `jwtPayload` so each test
 *     can stub the resolving user without re-mocking.
 *   - vi.clearAllMocks() (NOT reset) in beforeEach clears call history but
 *     preserves stub implementations. (Cycle 60 lesson #1.)
 *   - Persistent `mockImplementation` reads `mocks.userRecord` at call time,
 *     so a single setUp per test covers auth + prisma.user.findUnique without
 *     `mockResolvedValueOnce` chain bugs. (Cycle 60 lesson #2.)
 *
 * Test rule:
 *   - DENIED → expect status === 403 (forbidden, role gate fails)
 *   - ALLOWED → expect status NOT IN [401, 403]
 *     (subsequent 400 from zod or 500 from rejected DB stub is acceptable
 *     because RBAC check already passed — no role enforcement regression.)
 *
 * Cycle 60+ additions: route handlers (`order-closings`, `reconciliation-acts`,
 * `incoming-invoices`) previously caught only UNAUTHORIZED, returning 500 for
 * forbidden roles. Their catch blocks now also handle FORBIDDEN → 403, so the
 * matrix tests assert the correct status. (`cart` POST is zero-arg, no body.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================================
// 1. Hoisted mutable mocks — read by vi.mock factories below
// ============================================================

const mocks = vi.hoisted(() => ({
  userRecord: null as {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    role: 'admin' | 'manager' | 'accountant' | 'storekeeper' | 'production' | 'viewer';
    isActive: boolean;
  } | null,
  jwtPayload: null as { userId: string } | null,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(() => Promise.resolve(mocks.userRecord)),
    },
    // Sentinel stubs for create calls. RBAC matrix tests never reach
    // these (empty body fails zod or role gate fails first), but having
    // them avoids "undefined is not a function" inside deep handlers.
    proposal: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    person: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    organization: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    cartSession: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    orderClosing: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    reconciliationAct: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
    incomingInvoice: { create: vi.fn(() => Promise.reject(new Error('sentinel: not exercised'))) },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => (mocks.jwtPayload ? { value: `mock.${name}.token` } : undefined),
    }),
  ),
}));

vi.mock('@/lib/jwt', () => ({
  verifyToken: vi.fn(() => mocks.jwtPayload),
}));

// ============================================================
// 2. Import handlers AFTER vi.mock declarations.
//    cartPOST is zero-arg (`POST()`) — other handlers take NextRequest.
//    42 matrix + 1 null-user edge = 43 tests.
// ============================================================

import { POST as proposalsPOST } from '@/app/api/proposals/route';
import { POST as personsPOST } from '@/app/api/persons/route';
import { POST as organizationsPOST } from '@/app/api/organizations/route';
import { POST as cartPOST } from '@/app/api/cart/route';
import { POST as orderClosingsPOST } from '@/app/api/order-closings/route';
import { POST as reconciliationActsPOST } from '@/app/api/reconciliation-acts/route';
import { POST as incomingInvoicesPOST } from '@/app/api/incoming-invoices/route';

type HandlerFn = (req: NextRequest) => Promise<Response>;
/** cart POST signature is `POST()` (no body needed for empty session create). */
type CartHandlerFn = () => Promise<Response>;
type RouteKey =
  | 'proposals'
  | 'persons'
  | 'organizations'
  | 'cart'
  | 'orderClosings'
  | 'reconciliationActs'
  | 'incomingInvoices';

const HANDLERS: Record<RouteKey, HandlerFn | CartHandlerFn> = {
  proposals: proposalsPOST,
  persons: personsPOST,
  organizations: organizationsPOST,
  cart: cartPOST,
  orderClosings: orderClosingsPOST,
  reconciliationActs: reconciliationActsPOST,
  incomingInvoices: incomingInvoicesPOST,
};

// ============================================================
// 3. Matrix definition (role × route × expected outcome)
// ============================================================

type Role = 'admin' | 'manager' | 'accountant' | 'storekeeper' | 'production' | 'viewer';

/**
 * Full 6 roles × 7 routes matrix enumerating the RBAC contract.
 * - admin bypass → ALLOWED across all
 * - manager → CRM only (proposals/persons/organizations/cart)
 * - accountant → finance routes only (order-closings/reconciliation-acts/incoming-invoices)
 * - storekeeper / production / viewer → DENIED across this 7-route set
 */
const MATRIX: ReadonlyArray<[Role, RouteKey, 'ALLOWED' | 'DENIED']> = [
  // admin — bypass on all
  ['admin', 'proposals', 'ALLOWED'],
  ['admin', 'persons', 'ALLOWED'],
  ['admin', 'organizations', 'ALLOWED'],
  ['admin', 'cart', 'ALLOWED'],
  ['admin', 'orderClosings', 'ALLOWED'],
  ['admin', 'reconciliationActs', 'ALLOWED'],
  ['admin', 'incomingInvoices', 'ALLOWED'],

  // manager — CRM only
  ['manager', 'proposals', 'ALLOWED'],
  ['manager', 'persons', 'ALLOWED'],
  ['manager', 'organizations', 'ALLOWED'],
  ['manager', 'cart', 'ALLOWED'],
  ['manager', 'orderClosings', 'DENIED'],
  ['manager', 'reconciliationActs', 'DENIED'],
  ['manager', 'incomingInvoices', 'DENIED'],

  // accountant — finance routes only
  ['accountant', 'proposals', 'DENIED'],
  ['accountant', 'persons', 'DENIED'],
  ['accountant', 'organizations', 'DENIED'],
  ['accountant', 'cart', 'DENIED'],
  ['accountant', 'orderClosings', 'ALLOWED'],
  ['accountant', 'reconciliationActs', 'ALLOWED'],
  ['accountant', 'incomingInvoices', 'ALLOWED'],

  // storekeeper — DENIED across this set (own /api/storage-items)
  ['storekeeper', 'proposals', 'DENIED'],
  ['storekeeper', 'persons', 'DENIED'],
  ['storekeeper', 'organizations', 'DENIED'],
  ['storekeeper', 'cart', 'DENIED'],
  ['storekeeper', 'orderClosings', 'DENIED'],
  ['storekeeper', 'reconciliationActs', 'DENIED'],
  ['storekeeper', 'incomingInvoices', 'DENIED'],

  // production — DENIED across this set
  ['production', 'proposals', 'DENIED'],
  ['production', 'persons', 'DENIED'],
  ['production', 'organizations', 'DENIED'],
  ['production', 'cart', 'DENIED'],
  ['production', 'orderClosings', 'DENIED'],
  ['production', 'reconciliationActs', 'DENIED'],
  ['production', 'incomingInvoices', 'DENIED'],

  // viewer — DENIED on every write-handler
  ['viewer', 'proposals', 'DENIED'],
  ['viewer', 'persons', 'DENIED'],
  ['viewer', 'organizations', 'DENIED'],
  ['viewer', 'cart', 'DENIED'],
  ['viewer', 'orderClosings', 'DENIED'],
  ['viewer', 'reconciliationActs', 'DENIED'],
  ['viewer', 'incomingInvoices', 'DENIED'],
];

// ============================================================
// 4. Helpers
// ============================================================

function stubUser(role: Role | null): void {
  mocks.userRecord = role
    ? {
        id: '123',
        username: 'mock',
        displayName: 'Mock User',
        email: null,
        phone: null,
        role,
        isActive: true,
      }
    : null;
  mocks.jwtPayload = role ? { userId: '123' } : null;
}

function makeReq(): NextRequest {
  // Empty JSON body — RBAC tests don't care about validation outcome
  // (4xx/5xx after RBAC pass is acceptable). Body prevents native `.json()` parse error.
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================
// 5. Suite
// ============================================================

describe('Per-entity RBAC matrix (cycle 60+) — 6 roles × 7 routes', () => {
  beforeEach(() => {
    // clearAllMocks preserves stub implementations (mockImplementation still
    // resolves to the latest mocks.userRecord). reset would wipe them — DON'T.
    vi.clearAllMocks();
  });

  describe.each(MATRIX)('role=%s route=%s expect=%s', (role, routeKey, expected) => {
    it(`returns ${expected === 'DENIED' ? '403' : 'non-401/403 (RBAC passed)'}`, async () => {
      stubUser(role);

      const handler = HANDLERS[routeKey];
      expect(handler).toBeDefined();

      // cart POST is zero-arg (no body needed); other handlers take NextRequest.
      const res =
        routeKey === 'cart'
          ? await (handler as CartHandlerFn)()
          : await (handler as HandlerFn)(makeReq());

      if (expected === 'DENIED') {
        expect(res.status).toBe(403);
      } else {
        // RBAC passed → must not be 401/403. Validation 4xx or sentinel 5xx OK.
        expect([401, 403]).not.toContain(res.status);
      }
    });
  });

  describe('Edge cases', () => {
    it('null user (no token cookie) → 401 UNAUTHORIZED', async () => {
      mocks.userRecord = null;
      mocks.jwtPayload = null;
      const res = await proposalsPOST(makeReq());
      expect(res.status).toBe(401);
    });
  });
});
