// @vitest-environment jsdom
// Cycle 48: vitest suite for useProposalEditorState mega-hook.
// Mocks: next/navigation useRouter + global.fetch (typed as typeof fetch via cast).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ===== Mocks (must be set BEFORE importing the hook) =====

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ===== fetch helpers =====
// global.fetch needs Response-shaped return to satisfy typeof fetch signature.
// We use a structural type that satisfies the minimum interface used by the hook.

type JsonResponse = { success: boolean; data?: unknown; message?: string };

type FetchResponseShape = {
  ok: boolean;
  status: number;
  json: () => Promise<JsonResponse>;
};

type FetchFn = (url: string | URL | Request, init?: RequestInit) => Promise<FetchResponseShape>;

function ok(data: unknown): JsonResponse {
  return { success: true, data };
}

function routeFetchByPrefix(responses: Record<string, JsonResponse>): FetchFn {
  return async (url: string | URL | Request): Promise<FetchResponseShape> => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    for (const [prefix, resp] of Object.entries(responses)) {
      if (u.includes(prefix)) {
        return { ok: true, status: 200, json: async () => resp };
      }
    }
    return { ok: false, status: 404, json: async () => ({ success: false }) };
  };
}

// ===== Lifecycle helpers =====

let originalFetch: typeof global.fetch;
beforeEach(() => {
  originalFetch = global.fetch;
});
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** Wrapped in act() so async state updates don't trigger 'not wrapped in act' warnings */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// Cast helper for vi.fn as fetch stub (satisfies tsc strict mode)
function setFetch(mock: FetchFn): void {
  global.fetch = mock as unknown as typeof global.fetch;
}

// ===== Import hook AFTER mocks are set =====

import { useProposalEditorState } from '../use-proposal-editor-state';

// ===== Initial state =====

describe('useProposalEditorState — initial state', () => {
  it('должен инициализировать loading=true, cartId=null, cart=null', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'cart-1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    expect(result.current.state.loading).toBe(true);
    expect(result.current.state.cartId).toBeNull();
    expect(result.current.state.cart).toBeNull();
    await settle();
  });

  it('должен иметь initial defaults для proposalMeta + flags + discountPercent', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'cart-1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    expect(result.current.state.proposalTitle).toBe('');
    expect(result.current.state.discountPercent).toBe(0);
    expect(result.current.state.ralCode).toBe('');
    expect(result.current.state.error).toBe('');
    expect(result.current.state.success).toBe(false);
    await settle();
  });

  it('должен предоставить actions: 20 функций', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'cart-1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    expect(Object.keys(result.current.actions)).toHaveLength(20);
    expect(typeof result.current.actions.setSearchQuery).toBe('function');
    expect(typeof result.current.actions.createProposal).toBe('function');
    expect(typeof result.current.actions.resetTemplateSelection).toBe('function');
    await settle();
  });
});

// ===== /api/cart init =====

describe('useProposalEditorState — /api/cart init', () => {
  it('должен вызвать fetch POST /api/cart ровно один раз при mount', async () => {
    const fetchSpy = vi.fn<FetchFn>(async () => ({ ok: true, status: 200, json: async () => ({ success: false }) }));
    setFetch(fetchSpy);
    renderHook(() => useProposalEditorState());
    await settle();
    const calls = fetchSpy.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/api/cart') && (c[1] as { method?: string } | undefined)?.method === 'POST',
    );
    expect(calls).toHaveLength(1);
  });

  it('должен установить cartId + cart + loading=false при success', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'cart-42', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.cartId).toBe('cart-42');
    expect(result.current.state.cart).toEqual({ id: 'cart-42', items: [] });
  });

  it('должен корректно обработать failure response без crash', async () => {
    setFetch(async () => ({ ok: true, status: 500, json: async () => ({ success: false, message: 'auth fail' }) }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.cartId).toBeNull();
    expect(result.current.state.cart).toBeNull();
  });
});

// ===== Catalog load =====

describe('useProposalEditorState — catalog load', () => {
  it('должен заполнить products + organizations + customers + templates', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/products?limit=200': ok({ items: [{ id: 'p1', name: 'P1', sku: 'S1', productType: 'product', isActive: true, basePrice: 100, defaultMarkupPercent: 0, unit: 'шт', category: null }] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations': ok({ items: [{ id: 'o1', name: 'Org', vatRate: 20 }] }),
      '/api/organizations?role=client': ok({ items: [{ id: 'cl1', name: 'Client' }] }),
      '/api/document-templates': ok({ items: [{ id: 't1', name: 'Tpl' }] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.products.length).toBe(1));
    expect(result.current.state.organizations).toHaveLength(1);
    expect(result.current.state.customers).toHaveLength(1);
    expect(result.current.state.templates).toHaveLength(1);
  });

  it('должен отфильтровать неактивные products (isActive=false исключаются)', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/products?limit=200': ok({ items: [
        { id: 'p1', name: 'P1', sku: 'S1', productType: 'product', isActive: true, basePrice: 100, defaultMarkupPercent: 0, unit: 'шт', category: null },
        { id: 'p2', name: 'P2', sku: 'S2', productType: 'product', isActive: false, basePrice: 200, defaultMarkupPercent: 0, unit: 'шт', category: null },
      ] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
      '/api/document-templates': ok({ items: [] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.products.length).toBe(1));
    expect(result.current.state.products[0].id).toBe('p1');
  });
});

// ===== filteredProducts math =====

describe('useProposalEditorState — filteredProducts', () => {
  async function setupWithProducts() {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/products?limit=200': ok({ items: [
        { id: 'p1', name: 'Стол', sku: 'STL-001', productType: 'product', isActive: true, basePrice: 1000, defaultMarkupPercent: 0, unit: 'шт', category: { id: 'cat-1', name: 'Мебель' } },
        { id: 'p2', name: 'Стул', sku: 'STL-002', productType: 'product', isActive: true, basePrice: 500, defaultMarkupPercent: 0, unit: 'шт', category: { id: 'cat-2', name: 'Стулья' } },
      ] }),
      '/api/products/categories': ok({ items: [{ id: 'cat-1' }, { id: 'cat-2' }] }),
      '/api/organizations': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
      '/api/document-templates': ok({ items: [] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.products.length).toBe(2));
    return result;
  }

  it('должен фильтровать по searchQuery в name (lowercase)', async () => {
    const result = await setupWithProducts();
    act(() => result.current.actions.setSearchQuery('стол'));
    expect(result.current.computed.filteredProducts).toHaveLength(1);
    expect(result.current.computed.filteredProducts[0].name).toBe('Стол');
  });

  it('должен фильтровать по searchQuery в sku', async () => {
    const result = await setupWithProducts();
    act(() => result.current.actions.setSearchQuery('STL-002'));
    expect(result.current.computed.filteredProducts).toHaveLength(1);
    expect(result.current.computed.filteredProducts[0].sku).toBe('STL-002');
  });

  it('должен фильтровать по filterCategory', async () => {
    const result = await setupWithProducts();
    act(() => result.current.actions.setFilterCategory('cat-1'));
    expect(result.current.computed.filteredProducts).toHaveLength(1);
    expect(result.current.computed.filteredProducts[0].id).toBe('p1');
  });
});

// ===== Finance derivations (cycle-45 invariant) =====

describe('useProposalEditorState — finance derived object', () => {
  it('должен вернуть 6 derivation полей как numbers', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'c1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    const f = result.current.computed;
    expect(typeof f.subtotal).toBe('number');
    expect(typeof f.discountAmount).toBe('number');
    expect(typeof f.vatAmount).toBe('number');
    expect(typeof f.grandTotal).toBe('number');
    expect(f.subtotal).toBe(0);
    expect(f.grandTotal).toBe(0);
  });

  it('должен фолбэчить selectedVatRate=20 при selectedOrg=null', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/organizations': ok({ items: [{ id: 'o1', name: 'Org', vatRate: 20 }] }),
      '/api/products?limit=200': ok({ items: [] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
      '/api/document-templates': ok({ items: [] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.organizations.length).toBe(1));
    expect(result.current.computed.selectedVatRate).toBe(20);
  });
});

// ===== proposalBlocks + pdfData =====

describe('useProposalEditorState — proposalBlocks + pdfData invariants', () => {
  it('должен вернуть proposalBlocks=[] при empty cart (cycle-45 invariant)', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/products?limit=200': ok({ items: [] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
      '/api/document-templates': ok({ items: [] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.computed.proposalBlocks).toEqual([]);
    expect(result.current.computed.pdfData).toBeNull();
  });

  it('должен вернуть proposalBlocks=[] когда template-blocks-loaded но cart.items=[]', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/products?limit=200': ok({ items: [] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
      '/api/document-templates': ok({ items: [{ id: 't1', name: 'Tpl' }] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.templates.length).toBe(1));
    expect(result.current.computed.proposalBlocks).toEqual([]);
  });
});

// ===== createProposal error path =====

describe('useProposalEditorState — createProposal error path', () => {
  it('должен установить error + сбросить saving при failure response (independent renderHook)', async () => {
    // Independent fresh renderHook: fetch routes /api/cart ok AND /convert failure
    setFetch(async (url) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/convert')) {
        return { ok: true, status: 500, json: async () => ({ success: false, message: 'Invalid proposal' }) };
      }
      if (u.includes('/api/cart')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { id: 'c1', items: [{ id: 'i1', productId: 'p1', quantity: 1, priceSnapshot: 100, markupPercent: 0, product: { name: 'X', sku: 'X', productType: 'product', basePrice: 100, defaultMarkupPercent: 0, unit: 'шт', category: null, isActive: true } }] },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: { items: [] } }) };
    });
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    await act(async () => {
      await result.current.actions.createProposal();
    });
    expect(result.current.state.error).toBe('Invalid proposal');
    expect(result.current.state.saving).toBe(false);
    expect(result.current.state.success).toBe(false);
  });
});

// ===== resetTemplateSelection (cycle-45 invariant) =====

describe('useProposalEditorState — resetTemplateSelection', () => {
  it('должен очистить selectedTemplateId + selectedTemplateData + templateBlocks', async () => {
    setFetch(routeFetchByPrefix({
      '/api/cart': ok({ id: 'c1', items: [] }),
      '/api/document-templates': ok({ items: [{ id: 't1', name: 'Tpl' }] }),
      '/api/products?limit=200': ok({ items: [] }),
      '/api/products/categories': ok({ items: [] }),
      '/api/organizations': ok({ items: [] }),
      '/api/organizations?role=client': ok({ items: [] }),
    }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.templates.length).toBe(1));
    act(() => result.current.actions.setSelectedTemplateId('t1'));
    await waitFor(() => expect(result.current.state.selectedTemplateId).toBe('t1'));
    act(() => result.current.actions.resetTemplateSelection());
    expect(result.current.state.selectedTemplateId).toBe('');
    expect(result.current.state.selectedTemplateData).toBeNull();
    expect(result.current.state.templateBlocks).toEqual([]);
  });
});

// ===== addToCart: no-op when cartId=null =====

describe('useProposalEditorState — addToCart no-op', () => {
  it('должен НЕ вызывать fetch когда cartId ещё null', async () => {
    const fetchSpy = vi.fn<FetchFn>(async () => ({ ok: true, status: 200, json: async () => ({ success: false }) }));
    setFetch(fetchSpy);
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    const callsBefore = fetchSpy.mock.calls.length;
    await act(async () => {
      await result.current.actions.addToCart({
        id: 'p1',
        name: 'X',
        sku: 'X',
        productType: 'product',
        basePrice: 100,
        defaultMarkupPercent: 0,
        unit: 'шт',
        category: null,
        isActive: true,
      });
    });
    const callsAfter = fetchSpy.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });
});

// ===== modal flags + dropdowns =====

describe('useProposalEditorState — modal flags + resetDropdowns', () => {
  it('должен иметь showSettings/showPdfPreview=false initially и toggle через actions', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'c1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.showSettings).toBe(false);
    expect(result.current.state.showPdfPreview).toBe(false);
    act(() => result.current.actions.setShowSettings(true));
    expect(result.current.state.showSettings).toBe(true);
    act(() => result.current.actions.setShowPdfPreview(true));
    expect(result.current.state.showPdfPreview).toBe(true);
  });

  it('должен закрыть все 3 dropdown флага разом', async () => {
    setFetch(routeFetchByPrefix({ '/api/cart': ok({ id: 'c1', items: [] }) }));
    const { result } = renderHook(() => useProposalEditorState());
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    act(() => {
      result.current.actions.setShowOrgDropdown(true);
      result.current.actions.setShowClientDropdown(true);
      result.current.actions.setShowTemplateDropdown(true);
    });
    expect(result.current.state.showOrgDropdown).toBe(true);
    expect(result.current.state.showClientDropdown).toBe(true);
    expect(result.current.state.showTemplateDropdown).toBe(true);
    act(() => result.current.actions.resetDropdowns());
    expect(result.current.state.showOrgDropdown).toBe(false);
    expect(result.current.state.showClientDropdown).toBe(false);
    expect(result.current.state.showTemplateDropdown).toBe(false);
  });
});
