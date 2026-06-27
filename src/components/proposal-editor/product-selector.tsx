'use client';

// Cycle 44 (B.3 Block 3.1): ProductSelector sub-component.
// Searchable + filterable product list with click-to-add-to-cart UX.
//
// обёрнут React.memo — избегаем re-renders при unrelated state changes (e.g.
// при updateQuantity cart cart подёргивается только cartRefresh → нет cascade).

import { memo } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { useProposalEditor } from './editor-provider';

export const ProductSelector = memo(function ProductSelector() {
  const { state, actions, computed } = useProposalEditor();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar: search + filter */}
      <div className="px-3 py-2 border-b border-[var(--border)] space-y-2 shrink-0">
        <Input
          id="search-tovary"
          type="search"
          value={state.searchQuery}
          onChange={(e) => actions.setSearchQuery(e.target.value)}
          placeholder="Поиск..."
          prefix={<Search className="h-3.5 w-3.5" />}
          className="h-8 text-xs bg-[var(--background)]"
        />
        <Select
          value={state.filterCategory}
          onChange={(e) => actions.setFilterCategory(e.target.value)}
          options={[
            { value: '', label: 'Все категории' },
            ...state.categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          className="h-7 text-xs"
        />
      </div>

      {/* Product list */}
      <div className="divide-y divide-[var(--border)]">
        {computed.filteredProducts.map((product) => {
          const inCart = state.cart?.items.some((i) => i.productId === product.id);
          return (
            <div
              key={product.id}
              onClick={() => !inCart && void actions.addToCart(product)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                inCart ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--muted)]/50'
              }`}
            >
              <div
                className={`h-7 w-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  inCart
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                {product.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--foreground)] truncate">
                  {product.name}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {product.sku} · {product.unit}
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--foreground)] shrink-0">
                {formatCurrency(product.basePrice)}
              </span>
              {inCart && <Check className="h-3 w-3 text-[var(--primary)] shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
});
