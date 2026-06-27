'use client';

import { useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { A4Page } from './a4-page';
import { SortableBlock } from './sortable-block';
import type { DocBlock } from '@/types';

interface A4CanvasProps {
  blocks: DocBlock[];
  selectedBlockId: string | null;
  backgroundImage?: string;
  backgroundOpacity?: number;
  editable?: boolean;
  scale?: number;
  onBlockSelect: (id: string) => void;
  onBlocksReorder: (blocks: DocBlock[]) => void;
  onBlockEdit: (block: DocBlock) => void;
  onBlockRemove: (id: string) => void;
  onAddPage?: () => void;
}

export function A4Canvas({
  blocks,
  selectedBlockId,
  backgroundImage,
  backgroundOpacity,
  editable = false,
  scale = 0.6,
  onBlockSelect,
  onBlocksReorder,
  onBlockEdit,
  onBlockRemove,
  onAddPage,
}: A4CanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
      onBlocksReorder(reordered);
    },
    [blocks, onBlocksReorder]
  );

  // Group blocks by page, sorted by page number
  const pages = useMemo(() => {
    const map = new Map<number, DocBlock[]>();
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    for (const block of sorted) {
      const p = block.page || 1;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(block);
    }
    // Sort by page number, ensure page 1 always exists
    const entries = [...map.entries()].sort(([a], [b]) => a - b);
    if (entries.length === 0) entries.push([1, []]);
    return entries;
  }, [blocks]);

  const totalPages = pages.length;

  if (blocks.length === 0) {
    return (
      <A4Page backgroundImage={backgroundImage} backgroundOpacity={backgroundOpacity} scale={scale} editable={editable}>
        <div className="flex items-center justify-center h-64 text-[var(--muted-foreground)] text-sm">
          {editable ? 'Добавьте блоки из панели слева' : 'Нет блоков'}
        </div>
      </A4Page>
    );
  }

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {pages.map(([pageNum, pageBlocks]) => (
          <div key={pageNum}>
            <A4Page
              backgroundImage={backgroundImage}
              backgroundOpacity={backgroundOpacity}
              scale={scale}
              editable={editable}
              pageNumber={pageNum}
              totalPages={totalPages}
            >
              {pageBlocks.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)] text-xs">
                  Пустая страница
                </div>
              ) : (
                <SortableContext items={pageBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {pageBlocks.map(block => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        editable={editable}
                        onSelect={() => onBlockSelect(block.id)}
                        onEdit={() => onBlockEdit(block)}
                        onRemove={() => onBlockRemove(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </A4Page>
          </div>
        ))}
      </DndContext>

      {/* Add page button */}
      {editable && onAddPage && (
        <button
          onClick={onAddPage}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
        >
          <Plus size={16} />
          Добавить страницу
        </button>
      )}
    </div>
  );
}
