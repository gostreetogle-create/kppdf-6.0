'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Pencil } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { DocBlock } from '@/types';

interface SortableBlockProps {
  block: DocBlock;
  isSelected: boolean;
  editable: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function SortableBlock({
  block,
  isSelected,
  editable,
  onSelect,
  onEdit,
  onRemove,
}: SortableBlockProps) {
  // Блок 2.3: drag-handle убран — uсеSortable attrs/listeners вешаются на root div через spread conditional.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Блок 2.3: dnd-kit attributes/listeners на root, чтобы можно было схватить за весь блок.
      {...(editable ? attributes : {})}
      {...(editable ? listeners : {})}
      // Блок 2.3: hover-эффект «фонарь за блоком» — лёгкая тень + cursor-grab.
      className={[
        'relative group',
        editable
          ? 'cursor-grab active:cursor-grabbing transition-all hover:shadow-[0_0_20px_rgba(45,35,24,0.08)] hover:bg-[var(--muted)]/40'
          : '',
        isSelected ? 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]' : '',
      ].filter(Boolean).join(' ')}
      onClick={onSelect}
      onDoubleClick={editable ? onEdit : undefined}
    >
      {/* Блок 2.2: action-кнопки внутри границ (top-right абсолютно, появляются на hover через group-hover).
          Убрано -left-6/-right-8 (теперь 0/0 — ничего не вылезает за блок). z-50 над контентом. */}
      {isSelected && editable && (
        <div className="absolute top-1 right-1 flex gap-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--background)]/95 backdrop-blur-sm p-1 rounded-lg border border-[var(--border)] shadow-md pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
            title="Редактировать"
          >
            <Pencil size={13} className="text-[var(--muted-foreground)]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-md hover:bg-[var(--destructive)]/10 transition-colors"
            title="Удалить"
          >
            <Trash2 size={13} className="text-[var(--destructive)]" />
          </button>
        </div>
      )}

      <BlockContent block={block} />
    </div>
  );
}

function BlockContent({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlockContent block={block} />;
    case 'table':
      return <TableBlockContent block={block} />;
    case 'separator':
      return <SeparatorBlockContent block={block} />;
    default:
      return null;
  }
}

function TextBlockContent({ block }: { block: DocBlock }) {
  if (block.columns && block.columns.length > 0) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {block.columns.map((col) => (
          <div
            key={col.id}
            style={{
              width: col.width || `${100 / block.columns!.length}%`,
              flex: '1 1 0',
              minWidth: 0,
              textAlign: col.textAlign || 'left',
              fontWeight: col.fontWeight || 'normal',
              fontStyle: col.fontStyle || 'normal',
              textDecoration: col.textDecoration || 'none',
              color: col.color || undefined,
            }}
            className="text-sm"
          >
            <div
              className="whitespace-pre-wrap break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(col.content || 'Текст') }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="text-sm"
      style={{
        textAlign: block.settings?.align || 'left',
        fontSize: block.settings?.fontSize || '14px',
        padding: block.settings?.padding || '0',
      }}
    >
      <div
        className="whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content || 'Текстовый блок') }}
      />
    </div>
  );
}

function TableBlockContent({ block }: { block: DocBlock }) {
  // Блок 2.1: image-cell рендер с object-contain чтобы фото НЕ обрезалось.
  // Используется когда row[column.fieldName] содержит URL (например row.photo).
  return (
    <div>
      {block.title && (
        <h3 className="text-sm font-medium mb-2">{block.title}</h3>
      )}
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--status-neutral-bg)]">
              <th className="border border-[var(--border)] px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">Наименование</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Кол-во</th>
              <th className="border border-[var(--border)] px-3 py-2 text-center text-xs font-medium text-[var(--muted-foreground)]">Ед.</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Цена</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {(block._inlineRows && block._inlineRows.length > 0) ? (
              block._inlineRows.map((row: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  <td className="border border-[var(--border)] px-3 py-2 text-[var(--foreground)]">
                    {/* Блок 2.1: если name пустое но есть photo — рендерим фото с object-fit: contain. */}
                    {row.photo && !row.name ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(row.photo)} alt=""
                        className="max-w-full max-h-[80px] object-contain align-middle"
                      />
                    ) : (
                      String(row.name || '')
                    )}
                  </td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.quantity || '')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-center text-[var(--muted-foreground)]">{String(row.unit || 'шт')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.price || '')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.total || '')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border border-[var(--border)] px-3 py-4 text-center text-[var(--muted-foreground)]">
                  Данные будут подставлены из КП
                </td>
              </tr>
            )}
          </tbody>
          {block._footerRows && block._footerRows.length > 0 && (
            <tfoot>
              {block._footerRows.map((row, i) => (
                <tr key={i} className="font-medium">
                  <td colSpan={4} className="border border-[var(--border)] px-3 py-2 text-right font-medium">
                    {row.label}
                  </td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right font-semibold">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SeparatorBlockContent({ block }: { block: DocBlock }) {
  return (
    <div style={{ height: block.height ? `${block.height}px` : '20px' }}>
      {block.showLine !== false && (
        <hr className="border-t border-[var(--border)] mt-2" />
      )}
    </div>
  );
}
