'use client';

// Cycle 44 (B.3 Block 3.1): EditorCart sub-component.
// Bottom-left cart with line-items (+ / −/ ×), total breakdown.

import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useProposalEditor } from './editor-provider';

export function EditorCart() {
  const { state, actions, computed } = useProposalEditor();

  return (
    <div className="border-t border-[var(--border)] max-h-[35%] overflow-y-auto">
      <div className="px-3 py-1.5 bg-[var(--muted)]/30 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">
          Корзина ({state.cart?.items.length || 0})
        </span>
        <span className="text-xs font-bold text-[var(--foreground)]">
          {formatCurrency(computed.grandTotal)}
        </span>
      </div>

      {state.cart && state.cart.items.length > 0 ? (
        <>
          <div className="divide-y divide-[var(--border)]">
            {state.cart.items.map((item) => {
              const total = item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity;
              return (
                <div key={item.id} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[var(--foreground)] truncate">
                      {item.product.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void actions.updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Уменьшить количество товара ${item.product.name}`}
                      className="h-5 w-5 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)] disabled:opacity-30"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="text-[11px] font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => void actions.updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Увеличить количество товара ${item.product.name}`}
                      className="h-5 w-5 rounded border border-[var(--border)] flex items-center justify-center hover:bg-[var(--muted)]"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--foreground)] w-16 text-right shrink-0">
                    {formatCurrency(total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void actions.removeItem(item.id)}
                    aria-label={`Удалить товар ${item.product.name} из корзины`}
                    className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="px-3 py-1.5 border-t border-[var(--border)] space-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">Сумма:</span>
              <span>{formatCurrency(computed.subtotal)}</span>
            </div>
            {state.discountPercent > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--muted-foreground)]">Скидка:</span>
                <span className="text-[var(--destructive)]">
                  −{formatCurrency(computed.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">
                НДС ({computed.selectedVatRate}%):
              </span>
              <span>{formatCurrency(computed.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1 border-t border-[var(--border)]">
              <span>Итого:</span>
              <span>{formatCurrency(computed.grandTotal)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-4 text-center text-[10px] text-[var(--muted-foreground)]">
          Нажмите на товар чтобы добавить
        </div>
      )}
    </div>
  );
}
