'use client';

// Cycle 44 (B.3 Block 3.1): PreviewArea sub-component.
// Right-side A4 preview. Two modes:
//   (a) С шаблоном: A4Canvas rendering с filled blocks (from computed.proposalBlocks).
//   (b) Без шаблона: default HTML table с теми же данными.

import { FileText } from 'lucide-react';
import { A4Canvas } from '@/components/ui/a4-canvas';
import { formatCurrency } from '@/lib/utils';
import { useProposalEditor } from './editor-provider';

export function PreviewArea() {
  const { state, actions, computed } = useProposalEditor();

  return (
    <div className="flex-1 overflow-auto bg-[var(--muted)]/30 flex items-start justify-center p-4">
      {state.selectedTemplateData && computed.proposalBlocks.length > 0 ? (
        <A4Canvas
          blocks={computed.proposalBlocks}
          selectedBlockId={state.selectedBlockId}
          backgroundImage={state.selectedTemplateData.backgroundImage}
          backgroundOpacity={state.selectedTemplateData.backgroundOpacity}
          scale={0.52}
          editable={false}
          onBlockSelect={(id) => actions.setSelectedBlockId(id)}
          onBlocksReorder={() => {}}
          onBlockEdit={() => {}}
          onBlockRemove={() => {}}
        />
      ) : state.cart && state.cart.items.length > 0 ? (
        <div className="w-full max-w-[210mm] mx-auto bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-4">
          {computed.selectedOrg && (
            <p className="text-[10px] text-[var(--muted-foreground)] font-medium mb-2">
              {computed.selectedOrg.name}
            </p>
          )}
          <div className="text-center mb-3">
            <p className="text-xs font-bold uppercase">Коммерческое предложение</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Без шаблона — стандартный бланк
            </p>
          </div>
          {computed.selectedCustomer && (
            <p className="text-[10px] text-[var(--muted-foreground)] mb-2">
              Клиент: {computed.selectedCustomer.name}
            </p>
          )}
          <table className="w-full text-[10px] border-collapse border border-[var(--border)]">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="border border-[var(--border)] p-1 text-left">№</th>
                <th className="border border-[var(--border)] p-1 text-left">Наименование</th>
                <th className="border border-[var(--border)] p-1 text-right">Кол-во</th>
                <th className="border border-[var(--border)] p-1 text-center">Ед.</th>
                <th className="border border-[var(--border)] p-1 text-right">Цена</th>
                <th className="border border-[var(--border)] p-1 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {state.cart.items.map((item, i) => {
                const total = item.priceSnapshot * (1 + (item.markupPercent || 0) / 100) * item.quantity;
                return (
                  <tr key={item.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="border border-[var(--border)] p-1 text-center">{i + 1}</td>
                    <td className="border border-[var(--border)] p-1">{item.product.name}</td>
                    <td className="border border-[var(--border)] p-1 text-right">{item.quantity}</td>
                    <td className="border border-[var(--border)] p-1 text-center">{item.product.unit || 'шт'}</td>
                    <td className="border border-[var(--border)] p-1 text-right">
                      {formatCurrency(item.priceSnapshot * (1 + (item.markupPercent || 0) / 100))}
                    </td>
                    <td className="border border-[var(--border)] p-1 text-right font-medium">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Сумма:</span>
              <span>{formatCurrency(computed.subtotal)}</span>
            </div>
            {state.discountPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Скидка:</span>
                <span className="text-[var(--destructive)]">
                  −{formatCurrency(computed.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
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
          <p className="text-[10px] text-[var(--muted-foreground)] mt-4 pt-2 border-t border-[var(--border)]">
            Подпись: ___________________
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Выберите шаблон</p>
          <p className="text-xs mt-1">для предпросмотра документа</p>
        </div>
      )}
    </div>
  );
}
