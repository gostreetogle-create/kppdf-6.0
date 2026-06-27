'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, EyeOff, Eye, Settings2, Lock, Unlock, Bold, Italic } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DATA_SOURCES,
  getDataSourceOptions,
  getFieldOptions,
  getFieldLabel,
  getSourceColor,
  type TableTemplateColumnV4,
} from '@/lib/table-template-data';

interface TableTemplate {
  id: string;
  name: string;
  description?: string;
  columns?: string;
}

/**
 * Шейп устаревших v5 колонок (legacy data, не экспортируется из
 * `@/lib/table-template-data.ts`). Мигратор читает ровно эти 5 полей.
 */
interface LegacyV5Column {
  id?: string;
  key?: string;
  label?: string;
  width?: number | string;                                  // число-пиксели (без суффикса "px") ИЛИ строка-ширина (e.g. "100%"); мигратор добавляет "px"-суффикс через template
  type?: 'text' | 'number' | 'date' | 'currency';
}

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'Центр' },
  { value: 'right', label: 'Справа' },
];

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: 'Aa',
  number: '#',
  date: '📅',
  currency: '₽',
};

function reindexColumns(cols: TableTemplateColumnV4[]): TableTemplateColumnV4[] {
  return cols.map((col, i) => ({ ...col, order: i }));
}

function isV4Columns(json: string): boolean {
  try {
    const cols = JSON.parse(json);
    if (!Array.isArray(cols)) return false;
    if (cols.length === 0) return true;
    return 'tableName' in cols[0] && 'fieldName' in cols[0];
  } catch {
    return false;
  }
}

function migrateV5toV4(cols: LegacyV5Column[]): TableTemplateColumnV4[] {
  return cols.map((col, i) => ({
    id: col.id || `col_${Date.now()}_${i}`,
    tableName: 'products',
    fieldName: col.key || 'name',
    label: col.label || '',
    width: col.width ? `${col.width}px` : undefined,
    type: col.type || 'text',
    order: i,
    visible: true,
    align: 'left',
  }));
}

// ── Sortable chip wrapper ──────────────────────────────────────────
function SortableColumnChip({
  col,
  index,
  isEditing,
  onToggleEdit,
  onDelete,
  onUpdate,
}: {
  col: TableTemplateColumnV4;
  index: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<TableTemplateColumnV4>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const isVisible = col.visible !== false;
  const sourceColor = getSourceColor(col.tableName);
  const typeIcon = FIELD_TYPE_ICONS[col.type || 'text'] || 'Aa';

  return (
    <div ref={setNodeRef} style={style} className="group flex-shrink-0">
      {/* Column chip — entire chip is the drag target */}
      <div
        {...attributes}
        {...listeners}
        onClick={onToggleEdit}
        role="button"
        tabIndex={0}
        className={`relative flex items-center gap-2 h-12 px-4 rounded-xl border-2 cursor-grab active:cursor-grabbing ${
          isEditing
            ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
            : isVisible
              ? 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]/30 hover:shadow-sm'
              : 'border-dashed border-[var(--border)] bg-[var(--muted)]/30 opacity-60'
        }`}
      >
        {/* Order badge */}
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--muted)] text-[10px] font-bold text-[var(--muted-foreground)] flex-shrink-0">
          {index + 1}
        </span>

        {/* Type hint */}
        <span className="text-[10px] font-mono text-[var(--muted-foreground)] opacity-60 w-4 text-center flex-shrink-0">
          {typeIcon}
        </span>

        {/* Label */}
        <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[120px]">
          {col.label || col.fieldName}
        </span>

        {/* Source badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${sourceColor}`}>
          {DATA_SOURCES[col.tableName]?.label?.slice(0, 8) || col.tableName.slice(0, 8)}
        </span>

        {/* Visibility icon */}
        {!isVisible && (
          <EyeOff size={12} className="text-[var(--muted-foreground)] flex-shrink-0" />
        )}

        {/* Edit indicator */}
        {isEditing && (
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-[var(--card)] animate-scale-in" />
        )}
      </div>

      {/* Editing popover */}
      {isEditing && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggleEdit} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 w-[360px] bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Settings2 size={14} />
                Колонка #{index + 1}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdate({ visible: !isVisible })}
                  className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]' : 'text-[var(--primary)] bg-[var(--primary)]/10'}`}
                  title={isVisible ? 'Скрыть' : 'Показать'}
                >
                  {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-solid)] transition-colors"
                  title="Удалить колонку"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Source */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Источник</label>
                <select
                  value={col.tableName}
                  onChange={(e) => {
                    const fields = getFieldOptions(e.target.value);
                    const first = fields[0];
                    onUpdate({
                      tableName: e.target.value,
                      fieldName: first?.value || '',
                      label: first?.label || '',
                      type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
                      align: (first?.align || 'left') as 'left' | 'center' | 'right',
                    });
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                >
                  {getDataSourceOptions().map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Field */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Поле</label>
                <select
                  value={col.fieldName}
                  onChange={(e) => {
                    const fieldOptions = getFieldOptions(col.tableName);
                    const fi = fieldOptions.find(f => f.value === e.target.value);
                    const label = getFieldLabel(col.tableName, e.target.value);
                    onUpdate({
                      fieldName: e.target.value,
                      label,
                      type: (fi?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
                      align: (fi?.align || 'left') as 'left' | 'center' | 'right',
                    });
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                >
                  {getFieldOptions(col.tableName).map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Label */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Заголовок <span className="font-normal normal-case tracking-normal text-[var(--muted-foreground)] opacity-60">(оставьте пустым для авто)</span>
                </label>
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
                  placeholder={getFieldLabel(col.tableName, col.fieldName)}
                />
              </div>

              {/* Width + Align row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Ширина</label>
                  <input
                    type="text"
                    value={col.width || ''}
                    onChange={(e) => onUpdate({ width: e.target.value || undefined })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
                    placeholder="auto"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Выравнивание</label>
                  <div className="flex h-9 gap-1 p-0.5 rounded-xl bg-[var(--muted)]">
                    {ALIGN_OPTIONS.map(a => (
                      <button
                        key={a.value}
                        onClick={() => onUpdate({ align: a.value as 'left' | 'center' | 'right' })}
                        className={`flex-1 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                          (col.align || 'left') === a.value
                            ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {a.value === 'left' ? '⬅' : a.value === 'center' ? '↔' : '➡'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bold / Italic toggles */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Начертание</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => onUpdate({ bold: !col.bold })}
                    className={`flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                      col.bold
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                    }`}
                    title="Жирный"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    onClick={() => onUpdate({ italic: !col.italic })}
                    className={`flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                      col.italic
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                    }`}
                    title="Курсив"
                  >
                    <Italic size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview in popover */}
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <div className="text-[10px] text-[var(--muted-foreground)] mb-2">Значение по умолчанию:</div>
              <div className="h-9 px-3 rounded-xl bg-[var(--muted)] flex items-center text-sm" style={{ textAlign: col.align || 'left' }}>
                <span className={
                  col.type === 'currency' ? 'text-success font-semibold' :
                  col.type === 'number' ? 'text-info font-mono' :
                  col.type === 'date' ? 'text-primary' :
                  'text-[var(--foreground)]'
                }>
                  {col.type === 'currency' ? '1 234,00 ₽' :
                   col.type === 'number' ? '1234' :
                   col.type === 'date' ? '01.06.2026' :
                   getFieldLabel(col.tableName, col.fieldName)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function TableTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [template, setTemplate] = useState<TableTemplate>({ id: '', name: '', description: '', columns: '[]' });
  const [columns, setColumns] = useState<TableTemplateColumnV4[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Popover state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Table width & lock
  const [tableWidth, setTableWidth] = useState('100%');
  const [tableLocked, setTableLocked] = useState(false);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Индикатор общей ширины колонок vs A4 content (блок 1.3b):
  // A4 = 210mm ≈ 794px @96dpi; контентная область = 794 - 2×38px(margins) ≈ 718px
  const A4_CONTENT_WIDTH_PX = 718;
  const totalColumnsWidthPx = columns.reduce((sum, c) => {
    const num = parseFloat(c.width || '0');
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const a4WidthPercent = Math.round((totalColumnsWidthPx / A4_CONTENT_WIDTH_PX) * 100);
  const a4WidthWarning = totalColumnsWidthPx > A4_CONTENT_WIDTH_PX;

  // Drag-resize state
  const resizeRef = useRef<{
    colIndex: number;
    startX: number;
    startWidth: number;
    nextColIndex: number | null;
    nextStartWidth: number;
  } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const columnsRef = useRef(columns);
  const tableLockedRef = useRef(tableLocked);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    tableLockedRef.current = tableLocked;
  }, [tableLocked]);

  const handleResizeEndRef = useRef<() => void>(() => {});

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;
    const { colIndex, startX, startWidth, nextColIndex, nextStartWidth } = resizeRef.current;
    const delta = e.clientX - startX;
    const newWidth = Math.max(50, Math.round(startWidth + delta));
    if (nextColIndex !== null) {
      const nextNewWidth = Math.max(50, Math.round(nextStartWidth - delta));
      setColumns(prev => {
        const next = [...prev];
        next[colIndex] = { ...next[colIndex], width: `${newWidth}px` };
        next[nextColIndex] = { ...next[nextColIndex], width: `${nextNewWidth}px` };
        return next;
      });
    }
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResizeMove]);

  useEffect(() => {
    handleResizeEndRef.current = handleResizeEnd;
  });

  // Cleanup on unmount during drag
  useEffect(() => {
    return () => {
      if (resizeRef.current) {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEndRef.current);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e: React.MouseEvent, _colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const cols = columnsRef.current;
    // Use actual DOM widths for precision
    const th = (e.target as HTMLElement).closest('th');
    const nextTh = th?.nextElementSibling as HTMLElement | null;
    if (!th || !nextTh) return;
    const draggedWidth = th.getBoundingClientRect().width;
    const nextWidth = nextTh.getBoundingClientRect().width;
    // Map visible index back to full columns array
    const draggedColId = th.dataset.colId;
    const nextColId = nextTh.dataset.colId;
    resizeRef.current = {
      colIndex: cols.findIndex(c => c.id === draggedColId),
      startX: e.clientX,
      startWidth: draggedWidth,
      nextColIndex: cols.findIndex(c => c.id === nextColId),
      nextStartWidth: nextWidth,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEndRef.current);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleResizeMove]);

  useEffect(() => {
    if (isNew && columns.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumns([{
        id: `col_${Date.now()}`,
        tableName: 'products',
        fieldName: 'name',
        label: 'Наименование',
        width: '200px',
        type: 'text',
        order: 0,
        visible: true,
        align: 'left',
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (isNew) return;
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/table-templates/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const item = data.data || data;
          setTemplate(item);
          if (item.columns) {
            try {
              const parsed = JSON.parse(item.columns);
              if (isV4Columns(item.columns)) {
                setColumns(reindexColumns(parsed as TableTemplateColumnV4[]));
              } else {
                setColumns(reindexColumns(migrateV5toV4(parsed)));
              }
            } catch {
              setColumns([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching template:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [params.id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/table-templates' : `/api/table-templates/${params.id}`;
      const validCols = columns.filter((c) => c.tableName && c.fieldName);
      if (validCols.length === 0) {
        alert('Добавьте хотя бы одну колонку с выбранным источником и полем');
        setSaving(false);
        return;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          columns: JSON.stringify(reindexColumns(validCols)),
        }),
      });
      if (res.ok) router.push('/admin/table-templates');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    const lastSource = columns.length > 0 ? columns[columns.length - 1].tableName : 'products';
    // Авто-заполнение названия при первой колонке (если ещё не задано)
    if (isNew && !template.name) {
      setTemplate(prev => ({ ...prev, name: DATA_SOURCES[lastSource]?.label || '' }));
    }
    const fields = getFieldOptions(lastSource);
    const first = fields[0];
    const newCol: TableTemplateColumnV4 = {
      id: `col_${Date.now()}`,
      tableName: lastSource,
      fieldName: first?.value || 'name',
      label: first?.label || '',
      width: '150px',
      type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency' | 'image',
      order: columns.length,
      visible: true,
      align: (first?.align || 'left') as 'left' | 'center' | 'right',
    };
    setColumns([...columns, newCol]);
    setEditingIndex(columns.length);
  };

  const updateCol = (index: number, patch: Partial<TableTemplateColumnV4>) => {
    const next = [...columns];
    next[index] = { ...next[index], ...patch };
    setColumns(next);
  };

  const deleteColumn = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    setColumns(reindexColumns(columns.filter((_, i) => i !== index)));
  };

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.id === active.id);
      const newIndex = columns.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setColumns(reindexColumns(arrayMove(columns, oldIndex, newIndex)));
      }
    }
  }, [columns]);

  const visibleColumns = columns.filter((c) => c.visible !== false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/table-templates')}
            className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--muted-foreground)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {isNew ? 'Новый шаблон' : template.name}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isNew ? 'Создайте набор колонок для таблицы в документах' : 'Редактирование шаблона таблицы'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !template.name}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary)]/20 active:scale-[0.97]"
        >
          <Save size={16} />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Source → Name → Description row */}
      <div className="flex gap-4">
        <div className="w-48">
          <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Источник данных</label>
          <select
            onChange={(e) => {
              const src = e.target.value;
              const srcLabel = DATA_SOURCES[src]?.label || src;
              // Авто-заполнение названия шаблона из источника (если название пустое)
              if (!template.name || template.name === DATA_SOURCES[columns[0]?.tableName]?.label) {
                setTemplate(prev => ({ ...prev, name: srcLabel }));
              }
              if (columns.length > 0) {
                const fields = getFieldOptions(src);
                const first = fields[0];
                setColumns(columns.map(c => ({
                  ...c,
                  tableName: src,
                  fieldName: first?.value || 'name',
                  label: first?.label || '',
                  type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency' | 'image',
                  align: (first?.align || 'left') as 'left' | 'center' | 'right',
                })));
              }
            }}
            value={columns.length > 0 ? columns[0].tableName : 'products'}
            className="w-full h-10 px-3 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer"
          >
            {getDataSourceOptions().map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Название *</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
            placeholder="Название шаблона..."
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Описание</label>
          <input
            type="text"
            value={template.description || ''}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
            placeholder="Описание (необязательно)"
          />
        </div>
      </div>

      {/* Main editor */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Колонки</h2>
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md font-medium">
              {columns.length} {columns.length === 1 ? 'колонка' : columns.length < 5 ? 'колонки' : 'колонок'}
              {columns.filter(c => c.visible === false).length > 0 &&
                ` · ${columns.filter(c => c.visible === false).length} скрыто`}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-medium ${a4WidthWarning ? 'bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}
              title="Суммарная ширина колонок относительно A4 (210 мм — поля 20 мм = 718 px при 96 dpi). Если больше 100% — таблица перелезет за край листа."
            >
              \u03a3 {totalColumnsWidthPx}px · {a4WidthPercent}% A4
              {a4WidthWarning && ' ⚠'}
            </span>
          </div>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.97]"
          >
            <Plus size={14} />
            Добавить колонку
          </button>
        </div>

        {/* Columns grid — DnD sortable */}
        <div className="p-5">
          {columns.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--muted)] mb-4">
                <span className="text-3xl opacity-40">📊</span>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm font-medium mb-1">Нет колонок</p>
              <p className="text-[var(--muted-foreground)] text-xs mb-5">Нажмите «Добавить колонку», чтобы начать</p>
              <button
                onClick={addColumn}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all active:scale-[0.97]"
              >
                <Plus size={14} />
                Добавить колонку
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                  {columns.map((col, index) => (
                    <SortableColumnChip
                      key={col.id}
                      col={col}
                      index={index}
                      isEditing={editingIndex === index}
                      onToggleEdit={() => setEditingIndex(editingIndex === index ? null : index)}
                      onDelete={() => deleteColumn(index)}
                      onUpdate={(patch) => updateCol(index, patch)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeId ? (() => {
                  const activeCol = columns.find(c => c.id === activeId);
                  const sourceColor = activeCol ? getSourceColor(activeCol.tableName) : '';
                  return (
                  <div className="flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--card)] shadow-xl opacity-95">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--muted)] text-[10px] font-bold text-[var(--muted-foreground)] flex-shrink-0">
                      {activeCol ? columns.indexOf(activeCol) + 1 : ''}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {activeCol?.label || activeCol?.fieldName || ''}
                    </span>
                    {activeCol && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 ${sourceColor}`}>
                        {DATA_SOURCES[activeCol.tableName]?.label?.slice(0, 8) || activeCol.tableName.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Preview table */}
        {visibleColumns.length > 0 && (
          <div className="border-t border-[var(--border)]">
            <div className="px-5 py-3 bg-[var(--muted)]/10 border-b border-[var(--border)] flex items-center justify-between gap-4">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                Предпросмотр таблицы
                <span className="text-[10px] font-normal normal-case tracking-normal text-[var(--muted-foreground)] opacity-60">
                  ({visibleColumns.length} {visibleColumns.length === 1 ? 'колонка' : 'колонок'})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Ширина</label>
                  <input
                    type="text"
                    value={tableWidth}
                    onChange={(e) => setTableWidth(e.target.value)}
                    className="w-20 h-7 px-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-xs text-center focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="100%"
                  />
                </div>
                <button
                  onClick={() => setTableLocked(!tableLocked)}
                  className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                    tableLocked
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                  }`}
                  title={tableLocked ? 'Ширина зафиксирована — колонки не растягиваются' : 'Авто-ширина — колонки заполняют доступное пространство'}
                >
                  {tableLocked ? <Lock size={11} /> : <Unlock size={11} />}
                  {tableLocked ? 'Фикс.' : 'Авто'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table ref={tableRef} className="text-sm border-collapse" style={{ width: tableWidth, tableLayout: 'fixed' as const }}>
                <thead>
                  <tr className="bg-[var(--muted)]/50">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map((col, _vi, arr) => {
                        const origIndex = columns.findIndex(c => c.id === col.id);
                        const isLast = _vi === arr.length - 1;
                        return (
                        <th
                          key={col.id}
                          data-col-id={col.id}
                          className="relative px-4 py-3 text-xs font-semibold text-[var(--foreground)] border-r border-[var(--border)] last:border-r-0 whitespace-nowrap group/th select-none"
                          style={{
                            width: col.width || 'auto',
                            textAlign: col.align || 'left',
                            fontWeight: col.bold ? 700 : 600,
                            fontStyle: col.italic ? 'italic' : 'normal',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[var(--primary)] opacity-50" style={{ fontWeight: 400, fontStyle: 'normal' }}>
                              {col.tableName}.{col.fieldName}
                            </span>
                            <span style={{ fontWeight: col.bold ? 700 : 600, fontStyle: col.italic ? 'italic' : 'normal' }}>
                              {col.label}
                            </span>
                          </div>
                          {/* Resize handle */}
                          {!isLast && (
                            <div
                              onMouseDown={(e) => handleResizeStart(e, origIndex)}
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--primary)]/20 transition-colors z-10 flex items-center justify-center"
                              style={{ marginRight: '-4px' }}
                            >
                              <div className="w-0.5 h-5 rounded-full bg-[var(--border)] group-hover/th:bg-[var(--primary)]/40 transition-colors" />
                            </div>
                          )}
                        </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[var(--muted)]/20 transition-colors">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map(col => (
                        <td
                          key={col.id}
                          className="px-4 py-3 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0"
                          style={{ textAlign: col.align || 'left', fontWeight: col.bold ? 700 : 400, fontStyle: col.italic ? 'italic' : 'normal' }}
                        >
                          <span className={
                            col.type === 'currency' ? 'text-success font-semibold' :
                            col.type === 'number' ? 'text-info font-mono' :
                            col.type === 'date' ? 'text-primary' :
                            'text-[var(--foreground)]'
                          }>
                            {col.type === 'currency' ? '1 234,56 ₽' :
                             col.type === 'number' ? '1234' :
                             col.type === 'date' ? '01.06.2026' :
                             getFieldLabel(col.tableName, col.fieldName)}
                          </span>
                        </td>
                      ))}
                  </tr>
                  <tr className="bg-[var(--muted)]/10">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map(col => (
                        <td
                          key={col.id}
                          className="px-4 py-3 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0"
                          style={{ textAlign: col.align || 'left', fontWeight: col.bold ? 700 : 600, fontStyle: col.italic ? 'italic' : 'normal' }}
                        >
                          <span className={
                            col.type === 'currency' ? 'text-success' :
                            col.type === 'number' ? 'text-info font-mono' :
                            'text-[var(--muted-foreground)]'
                          }>
                            {col.type === 'currency' ? '12 345,00 ₽' :
                             col.type === 'number' ? '9 999' :
                             '—'}
                          </span>
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
