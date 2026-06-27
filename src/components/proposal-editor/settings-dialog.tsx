'use client';

// Cycle 44 (B.3 Block 3.1): SettingsDialog sub-component.
// Modal for editing proposal title. Backdrop click closes.

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProposalEditor } from './editor-provider';

export function SettingsDialog() {
  const { state, actions } = useProposalEditor();

  if (!state.showSettings) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => actions.setShowSettings(false)}
    >
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold mb-3">Настройки</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              Название КП
            </label>
            <Input
              type="text"
              value={state.proposalTitle}
              onChange={(e) => actions.setProposalTitle(e.target.value)}
              placeholder="Коммерческое предложение"
              className="h-8 text-xs bg-[var(--background)] mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button size="sm" onClick={() => actions.setShowSettings(false)}>
            Готово
          </Button>
        </div>
      </div>
    </div>
  );
}
