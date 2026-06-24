/**
 * Tests for src/lib/validations/proposal.schema.ts.
 * Pure functions — Zod schemas + computeLineTotal math.
 */
import { describe, it, expect } from 'vitest';
import {
  proposalCreateSchema,
  proposalUpdateSchema,
  computeLineTotal,
} from '@/lib/validations/proposal.schema';

const validItem = {
  productId: '00000000-0000-0000-0000-000000000001',
  quantity: 1,
  price: 100,
};

const validCreate = {
  title: 'КП на поставку',
  customerId: '00000000-0000-0000-0000-000000000002',
  contractorId: '00000000-0000-0000-0000-000000000003',
  vatRate: 20,
  items: [validItem, { ...validItem, productId: '00000000-0000-0000-0000-000000000004' }],
};

describe('computeLineTotal', () => {
  it('qty * price (no markup, no discount)', () => {
    expect(computeLineTotal(3, 100, 0, null)).toBe(300);
  });
  it('applies discount', () => {
    expect(computeLineTotal(2, 100, 0, 10)).toBe(180);
  });
  it('zero discount behaves as null', () => {
    expect(computeLineTotal(5, 10, 0, 0)).toBe(50);
  });
  it('rounds to 2 decimals', () => {
    expect(computeLineTotal(3, 33.333, 0, null)).toBe(99.99);
  });
  it('100% discount zeroes total', () => {
    expect(computeLineTotal(2, 100, 0, 100)).toBe(0);
  });
});

describe('proposalCreateSchema', () => {
  it('accepts minimal valid proposal', () => {
    const r = proposalCreateSchema.safeParse(validCreate);
    expect(r.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const r = proposalCreateSchema.safeParse({ ...validCreate, items: [] });
    expect(r.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const r = proposalCreateSchema.safeParse({
      ...validCreate,
      items: [{ ...validItem, quantity: -1 }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects discount > 100%', () => {
    const r = proposalCreateSchema.safeParse({
      ...validCreate,
      items: [{ ...validItem, discountPercent: 150 }],
    });
    expect(r.success).toBe(false);
  });

  it('accepts discount === 100% (legitimate edge case)', () => {
    const r = proposalCreateSchema.safeParse({
      ...validCreate,
      items: [{ ...validItem, discountPercent: 100 }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty title', () => {
    const r = proposalCreateSchema.safeParse({ ...validCreate, title: '' });
    expect(r.success).toBe(false);
  });

  it('defaults vatRate to 20', () => {
    const noVat = { ...validCreate };
    delete (noVat as { vatRate?: number }).vatRate;
    const r = proposalCreateSchema.safeParse(noVat);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.vatRate).toBe(20);
  });
});

describe('proposalUpdateSchema', () => {
  it('requires lastUpdatedAt for optimistic lock', () => {
    const r = proposalUpdateSchema.safeParse(validCreate);
    expect(r.success).toBe(false);
  });
  it('accepts when lastUpdatedAt is ISO string', () => {
    const r = proposalUpdateSchema.safeParse({
      ...validCreate,
      lastUpdatedAt: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });
});
