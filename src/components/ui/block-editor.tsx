'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Type, Table, Minus, Undo2, Redo2 } from 'lucide-react';
import { A4Canvas } from './a4-canvas';
import { TextBlockDialog, TableBlockDialog, SeparatorBlockDialog } from './block-dialogs';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { useDraftAutosave } from '@/hooks/use-draft-autosave';
import type { DocBlock } from '@/types';

interface BlockEditorProps {
  blocks: DocBlock[];
  onChange: (blocks: DocBlock[]) => void;
  backgroundImage?: string;
  backgroundOpacity?: number;
  templateId?: string;
  tableTemplates?: Array<{ id: string; name: string }>;
  onCreateTableTemplate?: () => void;
}

export function BlockEditor({
  blocks,
  onChange,
  backgroundImage,
  backgroundOpacity,
  templateId,
  tableTemplates = [],
  onCreateTableTemplate,
}: BlockEditorProps) {
  const {
    state: editorBlocks,
    setState: setEditorBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<DocBlock[]>(blocks);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<DocBlock | null>(null);

  // Adaptive scale for A4 canvas
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [a4Scale, setA4Scale] = useState(0.6);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        // 210mm ≈ 794px at 96dpi, 32px padding
        const s = Math.max(0.3, Math.min(1.2, (w - 32) / 794));
        setA4Scale(s);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onChangeRef = useRef(onChange);
  const prevBlocksRef = useRef(editorBlocks);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { loadDraft, clearDraft } = useDraftAutosave(editorBlocks, {
    key: templateId || 'new',
    interval: 2000,
    enabled: !!templateId,
  });

  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (templateId && !draftLoadedRef.current) {
      draftLoadedRef.current = true;
      const draft = loadDraft();
      if (draft && Array.isArray(draft)) {
        setEditorBlocks(draft);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => {
    if (prevBlocksRef.current !== editorBlocks) {
      prevBlocksRef.current = editorBlocks;
      onChangeRef.current(editorBlocks);
    }
  }, [editorBlocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const addBlock = useCallback(
    (type: DocBlock['type'], pageNum?: number) => {
      const newBlock: DocBlock = {
        id: `block-${Date.now()}`,
        type,
        order: editorBlocks.length,
        page: pageNum || 1,
        title: '',
        content: type === 'text' ? '' : undefined,
        showLine: type === 'table' || type === 'separator' ? true : undefined,
        height: type === 'separator' ? 20 : undefined,
      };
      setEditorBlocks([...editorBlocks, newBlock]);
      setSelectedBlockId(newBlock.id);
      setEditingBlock(newBlock);
    },
    [editorBlocks, setEditorBlocks]
  );

  const handleAddPage = useCallback(() => {
    const maxPage = editorBlocks.reduce((max, b) => Math.max(max, b.page || 1), 1);
    addBlock('text', maxPage + 1);
  }, [editorBlocks, addBlock]);

  const handleBlockSelect = useCallback((id: string) => {
    setSelectedBlockId(id);
  }, []);

  const handleBlockEdit = useCallback((block: DocBlock) => {
    setEditingBlock(block);
  }, []);

  const handleBlockRemove = useCallback(
    (id: string) => {
      setEditorBlocks(editorBlocks.filter((b) => b.id !== id));
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [editorBlocks, setEditorBlocks, selectedBlockId]
  );

  const handleBlocksReorder = useCallback(
    (reordered: DocBlock[]) => {
      setEditorBlocks(reordered);
    },
    [setEditorBlocks]
  );

  const handleBlockSave = useCallback(
    (updatedBlock: DocBlock) => {
      setEditorBlocks(editorBlocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
      setEditingBlock(null);
    },
    [editorBlocks, setEditorBlocks]
  );

  const handleClearDraft = useCallback(() => {
    clearDraft();
    setEditorBlocks(blocks);
  }, [clearDraft, blocks, setEditorBlocks]);

  return (
    <div className="flex gap-4">
      {/* LEFT SIDEBAR — Add blocks */}
      <div className="w-14 shrink-0 flex flex-col items-center gap-2 pt-2">
        <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Блоки
        </div>
        <button
          onClick={() => addBlock('text')}
          className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 transition-all group"
          title="Текст"
        >
          <Type size={16} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          <span className="text-[9px] font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">Текст</span>
        </button>
        <button
          onClick={() => addBlock('table')}
          className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 transition-all group"
          title="Таблица"
        >
          <Table size={16} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          <span className="text-[9px] font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">Табл.</span>
        </button>
        <button
          onClick={() => addBlock('separator')}
          className="flex flex-col items-center gap-1 w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 transition-all group"
          title="Разделитель"
        >
          <Minus size={16} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          <span className="text-[9px] font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">Разд.</span>
        </button>

        <div className="border-t border-[var(--border)] w-8 mt-2 pt-2" />

        <button
          onClick={undo}
          disabled={!canUndo}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] disabled:opacity-25 transition-all"
          title="Отменить (Ctrl+Z)"
        >
          <Undo2 size={16} className="text-[var(--muted-foreground)]" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] disabled:opacity-25 transition-all"
          title="Повторить (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} className="text-[var(--muted-foreground)]" />
        </button>

        {templateId && (
          <button
            onClick={handleClearDraft}
            className="mt-1 text-[9px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Сброс
          </button>
        )}
      </div>

      {/* RIGHT — A4 Canvas */}
      <div
        ref={canvasContainerRef}
        className="flex-1 border rounded-xl overflow-hidden bg-[var(--muted)]/30 p-4 min-h-[500px] flex items-start justify-center"
      >
        <A4Canvas
          blocks={editorBlocks}
          selectedBlockId={selectedBlockId}
          backgroundImage={backgroundImage}
          backgroundOpacity={backgroundOpacity}
          editable={true}
          scale={a4Scale}
          onBlockSelect={handleBlockSelect}
          onBlocksReorder={handleBlocksReorder}
          onBlockEdit={handleBlockEdit}
          onBlockRemove={handleBlockRemove}
          onAddPage={handleAddPage}
        />
      </div>

      {editingBlock && editingBlock.type === 'text' && (
        <TextBlockDialog
          block={editingBlock}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {editingBlock && editingBlock.type === 'table' && (
        <TableBlockDialog
          block={editingBlock}
          tableTemplates={tableTemplates}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
          onCreateTemplate={onCreateTableTemplate}
        />
      )}

      {editingBlock && editingBlock.type === 'separator' && (
        <SeparatorBlockDialog
          block={editingBlock}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}
