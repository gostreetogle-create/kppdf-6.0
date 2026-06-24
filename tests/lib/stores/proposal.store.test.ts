/**
 * Tests for src/lib/stores/proposal.store.ts — Zustand persist + debounce semantics.
 * Uses vi.useFakeTimers to deterministically test the 7s debounce.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useProposalStore, AUTOSAVE_DEBOUNCE_MS } from '@/lib/stores/proposal.store';
import type { SerializedProposal } from '@/lib/serialize';

// jsdom doesn't ship localStorage by default — fake it minimally for Zustand persist.
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  globalThis.localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => storage.clear(),
    key: (i: number) => Array.from(storage.keys())[i] ?? null,
    get length() {
      return storage.size;
    },
  } as unknown as Storage;
  useProposalStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

const sampleProposal: SerializedProposal = {
  id: 'p1',
  number: 'КП-0001',
  title: 'Test',
  status: 'DRAFT',
  customerId: 'c1',
  contractorId: 'o1',
  templateId: null,
  parentProposalId: null,
  version: 1,
  vatRate: 20,
  currency: 'RUB',
  paymentTermDays: null,
  packageTag: null,
  notes: null,
  validUntil: null,
  isActive: true,
  sentAt: null,
  acceptedAt: null,
  paidAt: null,
  convertedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'u1',
  totalAmount: 0,
  items: [],
};

describe('proposal.store basics', () => {
  it('setDraft updates draft and resets status', () => {
    useProposalStore.getState().setDraft(sampleProposal);
    expect(useProposalStore.getState().draft?.id).toBe('p1');
    expect(useProposalStore.getState().saveStatus).toBe('idle');
    expect(useProposalStore.getState().pendingDirty).toBe(false);
  });

  it('reset clears everything', () => {
    useProposalStore.getState().setDraft(sampleProposal);
    useProposalStore.getState().reset();
    expect(useProposalStore.getState().draft).toBeNull();
    expect(useProposalStore.getState().saveStatus).toBe('idle');
    expect(useProposalStore.getState().pendingDirty).toBe(false);
  });

  it('addItem + removeItem mutate items immutably and mark dirty', () => {
    useProposalStore.getState().setDraft(sampleProposal);
    const item = {
      id: 'tmp-1',
      productId: 'p1',
      productSku: 'SKU-1',
      productName: 'Test product',
      productUnit: 'шт',
      quantity: 1,
      price: 100,
      discountPercent: null,
      total: 100,
      sortOrder: 1,
      notes: null,
    };
    useProposalStore.getState().addItem(item);
    expect(useProposalStore.getState().draft?.items).toHaveLength(1);
    expect(useProposalStore.getState().pendingDirty).toBe(true);
    useProposalStore.getState().removeItem('tmp-1');
    expect(useProposalStore.getState().draft?.items).toHaveLength(0);
    expect(useProposalStore.getState().pendingDirty).toBe(true);
  });

  it('updateMeta patches top-level fields and marks dirty', () => {
    useProposalStore.getState().setDraft(sampleProposal);
    expect(useProposalStore.getState().pendingDirty).toBe(false);
    useProposalStore.getState().updateMeta({ title: 'New title', vatRate: 10 });
    const d = useProposalStore.getState().draft!;
    expect(d.title).toBe('New title');
    expect(d.vatRate).toBe(10);
    expect(useProposalStore.getState().pendingDirty).toBe(true);
  });
});

describe('proposal.store autosave debounce', () => {
  /** Dirty-маркер helper: каждый тест начинает с локальной правки, чтобы scheduleAutosave не упирался в pendingDirty=false. */
  const markDirty = () => useProposalStore.getState().updateMeta({ title: 'edit' });

  it('schedules send after AUTOSAVE_DEBOUNCE_MS', () => {
    vi.useFakeTimers();
    useProposalStore.getState().setDraft(sampleProposal);
    markDirty();
    const sendPut = vi.fn().mockResolvedValue(undefined);
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    expect(sendPut).not.toHaveBeenCalled();
    expect(useProposalStore.getState().saveStatus).toBe('saving');
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(sendPut).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(sendPut).toHaveBeenCalledTimes(1);
  });

  it('coalesces multiple updates into one send', () => {
    vi.useFakeTimers();
    useProposalStore.getState().setDraft(sampleProposal);
    markDirty();
    const sendPut = vi.fn().mockResolvedValue(undefined);
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    vi.advanceTimersByTime(3000);
    markDirty();
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    vi.advanceTimersByTime(3000);
    markDirty();
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(sendPut).toHaveBeenCalledTimes(1);
  });

  it('cancel callback prevents send', () => {
    vi.useFakeTimers();
    useProposalStore.getState().setDraft(sampleProposal);
    markDirty();
    const sendPut = vi.fn().mockResolvedValue(undefined);
    const cancel = useProposalStore.getState().scheduleAutosave('p1', sendPut);
    vi.advanceTimersByTime(2000);
    cancel();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS);
    expect(sendPut).not.toHaveBeenCalled();
  });

  it('sets saveStatus to error on send failure', async () => {
    vi.useFakeTimers();
    useProposalStore.getState().setDraft(sampleProposal);
    markDirty();
    const sendPut = vi.fn().mockRejectedValue(new Error('Network down'));
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS + 10);
    expect(useProposalStore.getState().saveStatus).toBe('error');
    expect(useProposalStore.getState().errorMessage).toBe('Network down');
    expect(useProposalStore.getState().pendingDirty).toBe(true);
  });

  it('skips scheduling when pendingDirty is false (avoid infinite loop after setDraft)', () => {
    vi.useFakeTimers();
    useProposalStore.getState().setDraft(sampleProposal);
    // Сразу после setDraft dirty=false — scheduleAutosave должен gated early-return.
    const sendPut = vi.fn().mockResolvedValue(undefined);
    useProposalStore.getState().scheduleAutosave('p1', sendPut);
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 100);
    expect(sendPut).not.toHaveBeenCalled();
    expect(useProposalStore.getState().saveStatus).toBe('idle');
  });
});
