'use client';

// Cycles 44-47 (B.3 Block 3.1 + B.4): ProposalEditor orchestrator.
//
// Compose (cycle 47):
//   <ProposalEditorProvider>     — Context с useProposalEditorState
//     <EditorHeader />            — top compact header
//     <ResizableEditorLayout>     — 3 horizontal panels (products|preview|config)
//       <Panel products>          — ProductSelector (search + filter) + EditorCart (bottom)
//       <Panel preview>          — PreviewArea (A4 canvas)
//       <Panel config>            — ConfigPanel (org/client/template/discount/RAL)
//     </ResizableEditorLayout>
//     <SettingsDialog />          — modal: title editor
//     <PdfExport />               — modal: PDF preview
//   </ProposalEditorProvider>
//
// Cycle 47 (Block 4.1) replaced fixed 45/55 split with 3-panel
// `react-resizable-panels`. Layout persists via useDefaultLayout hook
// (autoSaveId 'kppdf-editor-v1'). Mobile breakpoint flips to vertical stack.

import { Check } from 'lucide-react';
import { ProposalEditorProvider, useProposalEditor } from './editor-provider';
import { EditorHeader } from './editor-header';
import { ProductSelector } from './product-selector';
import { ConfigPanel } from './config-panel';
import { EditorCart } from './editor-cart';
import { PreviewArea } from './preview-area';
import { SettingsDialog } from './settings-dialog';
import { PdfExport } from './pdf-export';
import { ResizableEditorLayout } from './resizable-editor-layout';

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 animate-fadeIn">
      <div className="h-16 w-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
        <Check className="h-8 w-8 text-[var(--success)]" />
      </div>
      <h2 className="text-xl font-semibold">КП создано!</h2>
    </div>
  );
}

function EditorBody() {
  const { state } = useProposalEditor();

  if (state.loading) return <LoadingState />;
  if (state.success) return <SuccessState />;
  if (!state.cartId)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--muted-foreground)]">Ошибка инициализации</p>
      </div>
    );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <EditorHeader />
      <ResizableEditorLayout
        productsPanel={
          <div className="flex-1 flex flex-col overflow-hidden">
            <ProductSelector />
            <EditorCart />
          </div>
        }
        previewPanel={<PreviewArea />}
        configPanel={<ConfigPanel />}
      />
      <SettingsDialog />
      <PdfExport />
    </div>
  );
}

export function ProposalEditor() {
  return (
    <ProposalEditorProvider>
      <EditorBody />
    </ProposalEditorProvider>
  );
}

export default ProposalEditor;
