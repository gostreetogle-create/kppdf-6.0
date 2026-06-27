'use client';

// Cycle 44 (B.3 Block 3.1): useProposalEditorState mega-hook.
//
// Извлекает ВСЕ useState + useCallback + useEffect + computed derivations
// из монолита src/app/(dashboard)/proposals/new/page.tsx в один функциональный
// hook. Возвращает bag { state, actions, computed }.
//
// Идемпотентность: код логически идентичен оригиналу (visual behavior = ZERO change).
// Memo вынесен в buildProposalBlocks call внутри computed (per thinker recommendation).

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { buildProposalBlocks, getTemplateBlocks } from '@/lib/proposal-block-builder';
import type { ProposalPdfData } from '@/lib/pdf';
import type {
  ProposalEditorState,
  ProposalEditorActions,
  ProposalEditorComputed,
  ProposalEditorFinance,
  Product,
  Category,
  CartSession,
  Organization,
  DocumentTemplateSummary,
  CartItem,
} from '@/types/proposal-editor';
import type { DocBlock, DocumentTemplateData } from '@/types';

export function useProposalEditorState() {
  const router = useRouter();

  // ===== Lifecycle =====
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartSession | null>(null);

  // ===== Catalog =====
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // ===== Catalog filter =====
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // ===== Reference data =====
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [customers, setCustomers] = useState<Organization[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplateSummary[]>([]);

  // ===== Selection =====
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [ralCode, setRalCode] = useState('');


  // ===== UI flags =====
  const [showSettings, setShowSettings] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ===== Dropdown open flags =====
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // ===== Template data =====
  const [templateBlocks, setTemplateBlocks] = useState<DocBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTemplateData, setSelectedTemplateData] = useState<DocumentTemplateData | null>(null);

  // ========================================
  // Effects (side-effects: data load)
  // ========================================

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/cart', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setCartId(data.data.id);
          setCart(data.data);
        }
      } catch (e) {
        console.error('Cart init error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes, oRes, clRes, tRes] = await Promise.all([
          fetch('/api/products?limit=200&sort=name'),
          fetch('/api/products/categories?limit=100'),
          fetch('/api/organizations?limit=100'),
          fetch('/api/organizations?role=client&limit=100'),
          fetch('/api/document-templates?limit=100'),
        ]);
        const [pData, cData, oData, clData, tData] = await Promise.all([
          pRes.json(),
          cRes.json(),
          oRes.json(),
          clRes.json(),
          tRes.json(),
        ]);
        if (pData.success) setProducts(pData.data.items.filter((p: Product) => p.isActive));
        if (cData.success) setCategories(cData.data.items || []);
        if (oData.success) setOrganizations(oData.data.items || []);
        if (clData.success) setCustomers(clData.data.items || []);
        if (tData.success) setTemplates(tData.data.items || []);
      } catch (e) {
        console.error('Load error:', e);
      }
    }
    load();
  }, []);

  // Cycle 45: empty-selection reset has been lifted to the `resetTemplateSelection`
  // action (called from config-panel.tsx "— Без шаблона —" button) so the effect
  // no longer calls setState directly. Effect now only loads data when a template
  // is selected — fix for `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (!selectedTemplateId) return;
    fetch(`/api/document-templates/${selectedTemplateId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSelectedTemplateData(d.data);
          setTemplateBlocks(getTemplateBlocks(d.data));
        }
      })
      .catch(() => {});
  }, [selectedTemplateId]);

  // ========================================
  // Actions (callbacks)
  // ========================================

  const resetDropdowns = useCallback(() => {
    setShowOrgDropdown(false);
    setShowClientDropdown(false);
    setShowTemplateDropdown(false);
  }, []);

  /**
   * Cycle 45: replaces the inline setState-to-null ("— Без шаблона —" handler)
   * that previously lived inside the template-load useEffect (banned by
   * `react-hooks/set-state-in-effect`). Called from config-panel.tsx.
   */
  const resetTemplateSelection = useCallback(() => {
    setSelectedTemplateId('');
    setSelectedTemplateData(null);
    setTemplateBlocks([]);
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      if (!cartId) return;
      try {
        await fetch(`/api/cart/${cartId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            priceSnapshot: product.basePrice,
            markupPercent: product.defaultMarkupPercent,
          }),
        });
        const res = await fetch(`/api/cart/${cartId}`);
        const data = await res.json();
        if (data.success) setCart(data.data);
      } catch (e) {
        console.error('Add to cart error:', e);
      }
    },
    [cartId],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!cartId || quantity < 1) return;
      await fetch(`/api/cart/${cartId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    },
    [cartId],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cartId) return;
      await fetch(`/api/cart/${cartId}/items/${itemId}`, { method: 'DELETE' });
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json();
      if (data.success) setCart(data.data);
    },
    [cartId],
  );

  const createProposal = useCallback(async () => {
    if (!cartId || !cart || cart.items.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/cart/${cartId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposalTitle || undefined,
          customerId: selectedClientId || undefined,
          organizationId: selectedOrgId || undefined,
          templateId: selectedTemplateId || undefined,
          ralCode: ralCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/proposals'), 1500);
      } else {
        setError(data.message || 'Ошибка создания КП');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  }, [
    cartId,
    cart,
    proposalTitle,
    selectedClientId,
    selectedOrgId,
    selectedTemplateId,
    router,
    ralCode,
  ]);

  // ========================================
  // Computed (derived from state — recomputed on every render)
  // ========================================

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId),
    [organizations, selectedOrgId],
  );
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedClientId),
    [customers, selectedClientId],
  );

  const effectiveMarkup = useCallback(
    (_item: CartItem): number => 0,
    [],
  );

  const subtotal = useMemo(
    () =>
      cart?.items.reduce((sum, item) => {
        const markup = effectiveMarkup(item);
        return sum + item.priceSnapshot * (1 + markup / 100) * item.quantity;
      }, 0) ?? 0,
    [cart?.items, effectiveMarkup],
  );

  const discountAmount = useMemo(
    () => (discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0),
    [subtotal, discountPercent],
  );
  const totalAfterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const selectedVatRate = selectedOrg?.vatRate ?? 20;
  const vatAmount = useMemo(
    () => (totalAfterDiscount > 0 ? Math.round((totalAfterDiscount * selectedVatRate) / (100 + selectedVatRate)) : 0),
    [totalAfterDiscount, selectedVatRate],
  );
  const grandTotal = totalAfterDiscount;

  /**
   * Cycle 45: derived financial bag. Previously each of these 6 numbers was
   * listed individually in proposalBlocks & pdfData dep arrays (8-11 deps).
   * Grouping into a single memoized object → proposalBlocks / pdfData drop to
   * 4-5 deps, which eliminates the React Compiler "Could not preserve manual
   * memoization" bailout that hit cycle 44.
   */
  const finance = useMemo<ProposalEditorFinance>(
    () => ({
      subtotal,
      discountPercent,
      discountAmount,
      vatRate: selectedVatRate,
      vatAmount,
      grandTotal,
    }),
    [subtotal, discountPercent, discountAmount, selectedVatRate, vatAmount, grandTotal],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
        }
        if (filterCategory && p.category?.id !== filterCategory) return false;
        return true;
      }),
    [products, searchQuery, filterCategory],
  );

  /**
   * Cycle 45: proposalBlocks now uses the `finance` derived object (was 9 deps).
   * Dep array shrunk: 9 → 4. cart?.items is captured as `cartItems` so React
   * Compiler sees a stable reference instead of an optional chain expression.
   */
  const cartItems = cart?.items;
  // Use memoized selectedCustomer directly in deps (cleaner than extracting `name`).
  // ESLint exhaustive-deps accepts this since `selectedCustomer` is the source of truth.
  const proposalBlocks = useMemo(() => {
    if (templateBlocks.length === 0 || !cartItems?.length) return templateBlocks;
    return buildProposalBlocks({
      templateBlocks,
      cartItems: cartItems.map((item) => ({
        product: { name: item.product.name, sku: item.product.sku, unit: item.product.unit },
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        markupPercent: item.markupPercent,
      })),
      finance,
      clientMarkup: undefined,
    });
    // selectedCustomer зарезервирован для будущего clientMarkup из proposals.
    // Сейчас body useMemo не использует name напрямую — dep удалён чтобы избежать лишнего recompute.
  }, [templateBlocks, cartItems, finance]);

  /**
   * Cycle 45: lazy useState initializer pattern. `Date.now()` and `new Date()`
   * are flagged by `react-compiler/react-compiler` ("Impure function call
   * during render"), but React invokes the initializer ONCE at mount outside
   * the render body proper, so the date snapshot is captured here without
   * forcing the compiler to bail out. The proposal number / createdAt are
   * stable for the editor session (acceptable: matches the original monolith
   * "fresh-on-mount" semantics — preview shows a snapshot timestamp).
   */
  const [proposalMeta] = useState(() => ({
    number: 'ПРОЕКТ-' + String(Date.now()).slice(-6),
    createdAt: new Date().toISOString(),
  }));

  /**
   * Cycle 45: pdfData converted from `() => ProposalPdfDataLike | null`
   * (function called during render with Date.now() impurity) to a memoized
   * `ProposalPdfData | null` value.
   *  - Date.now() / new Date() hoisted to proposalMeta (lazy useState initializer).
   *  - Uses `selectedOrg` / `selectedClient` (already memoized) instead of
   *    re-scanning `organizations` / `clients` arrays.
   *  - Dep array shrunk: 11 → 7 (incl. stable proposalMeta refs).
   */
  const pdfData = useMemo<ProposalPdfData | null>(() => {
    if (!cart || cart.items.length === 0) return null;
    return {
      number: proposalMeta.number,
      title: proposalTitle || 'Коммерческое предложение',
      status: 'draft',        customer: selectedCustomer
        ? {
            name: selectedCustomer.name,
          }
        : undefined,
      organization: selectedOrg ? { name: selectedOrg.name, shortName: selectedOrg.shortName } : undefined,
      items: cart.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.priceSnapshot,
        markupPercent: item.markupPercent ?? 0,
        total: Math.round(
          item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity,
        ),
      })),
      markupPercent: 0,
      createdAt: proposalMeta.createdAt,
      discountPercent: finance.discountPercent,
      discountAmount: finance.discountAmount,
      vatRate: finance.vatRate,
      vatAmount: finance.vatAmount,
      grandTotal: finance.grandTotal,
    };
  }, [cart, finance, selectedOrg, selectedCustomer, proposalTitle, proposalMeta.number, proposalMeta.createdAt]);

  // ========================================
  // Bundle
  // ========================================

  const state: ProposalEditorState = {
    loading,
    cartId,
    cart,
    products,
    categories,
    searchQuery,
    filterCategory,
    organizations,
    customers,
    templates,
    selectedOrgId,
    selectedClientId,
    selectedTemplateId,
    proposalTitle,
    discountPercent,
    ralCode,
    showSettings,
    showPdfPreview,
    saving,
    error,
    success,
    showOrgDropdown,
    showClientDropdown,
    showTemplateDropdown,
    templateBlocks,
    selectedBlockId,
    selectedTemplateData,
  };

  const actions: ProposalEditorActions = {
    setSearchQuery,
    setFilterCategory,
    setSelectedOrgId,
    setSelectedClientId,
    setSelectedTemplateId,
    setProposalTitle,
    setDiscountPercent,
    setRalCode,
    setShowSettings,
    setShowPdfPreview,
    setSelectedBlockId,
    setShowOrgDropdown,
    setShowClientDropdown,
    setShowTemplateDropdown,
    resetDropdowns,
    resetTemplateSelection,
    addToCart,
    updateQuantity,
    removeItem,
    createProposal,
  };

  const computed: ProposalEditorComputed = {
    selectedOrg,
    selectedCustomer,
    effectiveMarkup,
    subtotal,
    discountAmount,
    totalAfterDiscount,
    selectedVatRate,
    vatAmount,
    grandTotal,
    filteredProducts,
    proposalBlocks,
    pdfData,
  };

  return { state, actions, computed };
}
