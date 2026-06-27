'use client';

// Cycle 44 (B.3 Block 3.1): EditorProvider — React Context wrapper.
//
// Заворачивает useProposalEditorState() в Context для всех sub-components.
// Single Context (без split) — для cycle 44 scope достаточно;
// cycle 45 (polish) может split на editor-state / editor-actions / editor-computed
// если re-render-profiling покажет bottlenecks.

import { createContext, useContext, type ReactNode } from 'react';
import { useProposalEditorState } from './use-proposal-editor-state';
import type {
  ProposalEditorState,
  ProposalEditorActions,
  ProposalEditorComputed,
} from '@/types/proposal-editor';

interface EditorContextValue {
  state: ProposalEditorState;
  actions: ProposalEditorActions;
  computed: ProposalEditorComputed;
}

const ProposalEditorContext = createContext<EditorContextValue | null>(null);

export function ProposalEditorProvider({ children }: { children: ReactNode }) {
  const value = useProposalEditorState();
  return (
    <ProposalEditorContext.Provider value={value}>
      {children}
    </ProposalEditorContext.Provider>
  );
}

export function useProposalEditor(): EditorContextValue {
  const ctx = useContext(ProposalEditorContext);
  if (!ctx) {
    throw new Error('useProposalEditor must be used within <ProposalEditorProvider>');
  }
  return ctx;
}
