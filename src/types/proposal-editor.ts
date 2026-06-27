// Cycle 44 (B.3 Block 3.1): ProposalEditor type extraction.
//
// Все интерфейсы ранее были inline в src/app/(dashboard)/proposals/new/page.tsx.
// Теперь вынесены в отдельный файл для шеринга между sub-components.
//
// НЕ ВКЛЮЧАЕТ Prisma-инферированные типы (избегаем конфликтов с src/types/index.ts
// который трогал cycle-54 B.2). Editor-specific типы оставлены здесь.

import type { DocBlock, DocumentTemplateData } from './index';
import type { ProposalPdfData } from '@/lib/pdf';

// ========================================
// Domain models (mirrors of API responses)
// ========================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  basePrice: number;
  defaultMarkupPercent: number;
  unit: string;
  category: { id: string; name: string } | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  markupPercent: number | null;
  product: Product;
}

export interface CartSession {
  id: string;
  items: CartItem[];
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  vatRate?: number;
}



export interface DocumentTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  organizationId?: string | null;
}

// ========================================
// Editor state bundle (consumed by sub-components)
// ========================================

export interface ProposalEditorState {
  // Lifecycle
  loading: boolean;
  cartId: string | null;
  cart: CartSession | null;

  // Catalog
  products: Product[];
  categories: Category[];

  // Catalog filter
  searchQuery: string;
  filterCategory: string;

  // Reference data
  organizations: Organization[];
  customers: Organization[];
  templates: DocumentTemplateSummary[];

  // Selection
  selectedOrgId: string;
  selectedClientId: string;
  selectedTemplateId: string;
  proposalTitle: string;
  discountPercent: number;
  ralCode: string;

  // UI flags
  showSettings: boolean;
  showPdfPreview: boolean;
  saving: boolean;
  error: string;
  success: boolean;

  // Dropdown open flags
  showOrgDropdown: boolean;
  showClientDropdown: boolean;
  showTemplateDropdown: boolean;

  // Template data
  templateBlocks: DocBlock[];
  selectedBlockId: string | null;
  selectedTemplateData: DocumentTemplateData | null;
}

// ========================================
// Editor actions (mutate state bag)
// ========================================

export interface ProposalEditorActions {
  // Catalog filter
  setSearchQuery: (q: string) => void;
  setFilterCategory: (id: string) => void;

  // Selection
  setSelectedOrgId: (id: string) => void;
  setSelectedClientId: (id: string) => void;
  setSelectedTemplateId: (id: string) => void;
  setProposalTitle: (t: string) => void;
  setDiscountPercent: (n: number) => void;
  setRalCode: (c: string) => void;

  // UI flags
  setShowSettings: (b: boolean) => void;
  setShowPdfPreview: (b: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  setShowOrgDropdown: (b: boolean) => void;
  setShowClientDropdown: (b: boolean) => void;
  setShowTemplateDropdown: (b: boolean) => void;
  resetDropdowns: () => void;
  /**
   * Cycle 45: replaces the former `setState-in-effect` reset in the template-load
   * useEffect. Called from config-panel.tsx "— Без шаблона —" button.
   */
  resetTemplateSelection: () => void;

  // Cart CRUD
  addToCart: (product: Product) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  createProposal: () => Promise<void>;
}

// ========================================
// Editor computed (derived from state)
// ========================================

export interface ProposalEditorComputed {
  selectedOrg: Organization | undefined;
  selectedCustomer: Organization | undefined;
  effectiveMarkup: (item: CartItem) => number;
  subtotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
  selectedVatRate: number;
  vatAmount: number;
  grandTotal: number;
  filteredProducts: Product[];
  proposalBlocks: DocBlock[];

  /**
   * Memoized snapshot of all data needed to render/generate the proposal PDF.
   * Cycle 45: replaced `() => ProposalPdfDataLike | null` (function with new
   * instance every render + Date.now() impurity) with a memoized ProposalPdfData
   * value. Eliminates render-side Date.now() + ESLint react-compiler bailout.
   */
  pdfData: ProposalPdfData | null;
}

/**
 * Cycle 45: derived financial bag consumable by buildProposalBlocks and pdfData.
 * Grouping the 6 numbers into one useMemo lets the proposalBlocks/pdfData deps
 * stay short (4 deps instead of 8-11), which preserves React Compiler manual
 * memoization (was bailing out in cycle 44 with the verbose dep arrays).
 */
export type Customer = Organization;

export interface ProposalEditorFinance {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

// ========================================
// Full context bag (state + actions + computed)
// ========================================

export interface ProposalEditorContextValue {
  state: ProposalEditorState;
  actions: ProposalEditorActions;
  computed: ProposalEditorComputed;
}
