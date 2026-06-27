'use client';

// Cycle 44 (B.3 Block 3.1): EditorHeader sub-component.
// Top compact header: title + cart count + 3 action buttons (PDF preview / PDF download / create proposal).

import { Download, Eye, FileText, AlertCircle } from 'lucide-react';
import { generateProposalPdf, downloadPdf } from '@/lib/pdf';
import { useProposalEditor } from './editor-provider';

export function EditorHeader() {
  const { state, actions, computed } = useProposalEditor();
  const data = computed.pdfData;

  const handleDownloadPdf = async () => {
    if (!data) return;
    const doc = await generateProposalPdf(data);
    // Cycle 45: use data.number (already contains timestamp) instead of fresh
    // Date.now() to satisfy react-compiler "Cannot call impure function during render".
    downloadPdf(doc, `${data.number}.pdf`);
  };

  return (
    <>
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-[var(--foreground)]">Оформление КП</h1>
          <span className="text-xs text-[var(--muted-foreground)]">
            ({state.cart?.items.length || 0} поз.)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => actions.setShowPdfPreview(true)}
            disabled={!state.cart?.items.length}
            className="px-3 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-40 flex items-center gap-1"
          >
            <Eye className="h-3 w-3" /> PDF
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!state.cart?.items.length}
            className="px-3 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-40 flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            onClick={() => void actions.createProposal()}
            disabled={!state.cart?.items.length || state.saving}
            className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1"
          >
            {state.saving ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            Создать КП
          </button>
        </div>
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="mx-4 mt-2 p-2 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 flex items-center gap-2 text-xs text-[var(--destructive)] shrink-0">
          <AlertCircle className="h-3 w-3 shrink-0" /> {state.error}
        </div>
      )}
    </>
  );
}
