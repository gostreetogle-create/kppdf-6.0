'use client';

// Cycle 44 (B.3 Block 3.1): ConfigPanel sub-component.
// 2-column grid: Org / Client / Template dropdowns / Discount slider / RAL selector.
// Sits BETWEEN product-list (above) and cart (below) in left column.

import { ChevronDown } from 'lucide-react';
import { RalSelector } from '@/components/ui/ral-selector';
import { useProposalEditor } from './editor-provider';

export function ConfigPanel() {
  const { state, actions, computed } = useProposalEditor();

  const closeOthers = (open: 'org' | 'client' | 'template') => {
    actions.resetDropdowns();
    if (open === 'org') actions.setShowOrgDropdown(true);
    if (open === 'client') actions.setShowClientDropdown(true);
    if (open === 'template') actions.setShowTemplateDropdown(true);
  };

  return (
    <div className="px-3 py-2 border-b border-[var(--border)] grid grid-cols-2 gap-2 shrink-0">
      {/* Organization dropdown */}
      <div className="relative">
        <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">
          Организация
        </label>
        <button
          onClick={() => closeOthers('org')}
          className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between"
        >
          <span className="truncate">
            {computed.selectedOrg?.shortName || computed.selectedOrg?.name || '—'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
        </button>
        {state.showOrgDropdown && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
            <button
              onClick={() => {
                actions.setSelectedOrgId('');
                actions.setShowOrgDropdown(false);
              }}
              className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]"
            >
              — Не выбрана —
            </button>
            {state.organizations.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  actions.setSelectedOrgId(o.id);
                  actions.setShowOrgDropdown(false);
                }}
                className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate"
              >
                {o.shortName || o.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Client dropdown */}
      <div className="relative">
        <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">
          Клиент
        </label>
        <button
          onClick={() => closeOthers('client')}
          className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between"
        >
          <span className="truncate">
            {computed.selectedCustomer?.name || '—'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
        </button>
        {state.showClientDropdown && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
            <button
              onClick={() => {
                actions.setSelectedClientId('');
                actions.setShowClientDropdown(false);
              }}
              className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]"
            >
              — Не выбран —
            </button>
            {state.customers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  actions.setSelectedClientId(c.id);
                  actions.setShowClientDropdown(false);
                }}
                className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template dropdown */}
      <div className="relative">
        <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">
          Шаблон
        </label>
        <button
          onClick={() => closeOthers('template')}
          className="w-full h-7 px-2 mt-0.5 rounded-md border border-[var(--input)] bg-[var(--background)] text-xs text-left flex items-center justify-between"
        >
          <span className="truncate">{state.selectedTemplateData?.name || '—'}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
        </button>
        {state.showTemplateDropdown && (
          <div className="absolute z-50 top-full mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-32 overflow-auto">
            <button
              onClick={() => {
                // Cycle 45: resetTemplateSelection clears selectedTemplateId +
                // selectedTemplateData + templateBlocks together (replaces the
                // former setState-in-effect pattern in use-proposal-editor-state.ts).
                actions.resetTemplateSelection();
                actions.setShowTemplateDropdown(false);
              }}
              className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)]"
            >
              — Без шаблона —
            </button>
            {state.templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  actions.setSelectedTemplateId(t.id);
                  actions.setShowTemplateDropdown(false);
                }}
                className="w-full px-2 py-1 text-xs text-left hover:bg-[var(--muted)] truncate"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discount slider */}
      <div>
        <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">
          Скидка {state.discountPercent}%
        </label>
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={state.discountPercent}
          onChange={(e) => actions.setDiscountPercent(Number(e.target.value))}
          className="w-full mt-1 h-5"
        />
      </div>

      {/* RAL selector */}
      <div className="col-span-2">
        <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase mb-1 block">
          RAL покраска
        </label>
        <RalSelector value={state.ralCode} onChange={actions.setRalCode} />
      </div>
    </div>
  );
}
