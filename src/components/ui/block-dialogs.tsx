'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Bold, Italic, Underline, Columns } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { DocBlock, DocTextColumn, DocBlockSettings } from '@/types';

/* ─────────────────────────────────────
   TextBlockDialog — WYSIWYG редактор v3
   ───────────────────────────────────── */
interface TextBlockDialogProps {
  block: DocBlock;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
}

export function TextBlockDialog({ block, onSave, onClose }: TextBlockDialogProps) {
  const [columns, setColumns] = useState<DocTextColumn[]>(
    block.columns && block.columns.length > 0
      ? block.columns
      : [{ id: 'col-1', content: block.content || '', width: '100%', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' }]
  );
  const [title, setTitle] = useState(block.title || '');
  const [settings, setSettings] = useState(block.settings || { padding: '0', fontSize: '14px', align: 'left' as const });
  const colRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // Initialize contentEditable divs via ref (avoids dangerouslySetInnerHTML cursor jump)
  useEffect(() => {
    columns.forEach(c => {
      const el = colRefs.current.get(c.id);
      if (el && el.innerHTML !== c.content) {
        el.innerHTML = DOMPurify.sanitize(c.content || '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount — content is managed by user input after that

  const addColumn = () => {
    const newId = `col-${Date.now()}`;
    const w = `${Math.round(100 / (columns.length + 1))}%`;
    setColumns(prev => [
      ...prev.map(c => ({ ...c, width: w })),
      { id: newId, content: '', width: w, textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    colRefs.current.delete(id);
    const rest = columns.filter(c => c.id !== id);
    const w = `${Math.round(100 / rest.length)}%`;
    setColumns(rest.map(c => ({ ...c, width: w })));
  };

  const updateColumn = (id: string, updates: Partial<DocTextColumn>) => {
    setColumns(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const execCmd = (colId: string, cmd: string, val?: string) => {
    const el = colRefs.current.get(colId);
    if (el) {
      el.focus();
      document.execCommand(cmd, false, val);
    }
  };

  const syncContent = (colId: string) => {
    const el = colRefs.current.get(colId);
    if (el) {
      updateColumn(colId, { content: el.innerHTML });
    }
  };

  const handleSave = () => {
    const finalColumns = columns.map(c => {
      const el = colRefs.current.get(c.id);
      return { ...c, content: el?.innerHTML ?? c.content };
    });
    onSave({
      ...block,
      title,
      content: finalColumns.length === 1 ? finalColumns[0].content : undefined,
      columns: finalColumns.length > 1 ? finalColumns : undefined,
      settings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      <div className="glass-surface rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2.5">
            <Columns size={18} className="text-[var(--primary)]" />
            Редактирование текстового блока
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors">
            <X size={18} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Title + Settings row */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Заголовок блока</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
                placeholder="Опционально" />
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Размер шрифта</label>
              <input type="text" value={settings.fontSize || '14px'} onChange={e => setSettings({ ...settings, fontSize: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Отступ</label>
              <input type="text" value={settings.padding || '0'} onChange={e => setSettings({ ...settings, padding: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Выравн.</label>
              <select value={settings.align || 'left'} onChange={e => setSettings({ ...settings, align: e.target.value as DocBlockSettings['align'] })}
                className="w-full h-10 px-2 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                <option value="left">Лево</option>
                <option value="center">Центр</option>
                <option value="right">Право</option>
              </select>
            </div>
          </div>

          {/* Columns header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Колонки текста</span>
            <button onClick={addColumn}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all shadow-sm shadow-[var(--primary)]/20">
              <Plus size={14} />
              Добавить колонку
            </button>
          </div>

          {/* Columns container — horizontal scroll when many columns */}
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {columns.map((col, i) => (
              <div
                key={col.id}
                className="shrink-0 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm overflow-hidden"
                style={{ width: `max(${col.width || '50%'}, 240px)`, scrollSnapAlign: 'start' }}
              >
                {/* Column toolbar */}
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--muted)]/40 border-b border-[var(--border)] shrink-0">
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)] select-none">
                    Колонка {i + 1}
                  </span>

                  {/* Formatting group */}
                  <div className="flex items-center bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                    <button onClick={() => execCmd(col.id, 'bold')}
                      className="w-8 h-7 flex items-center justify-center hover:bg-[var(--muted)] transition-colors border-r border-[var(--border)]"
                      title="Жирный (Ctrl+B)">
                      <Bold size={14} className="text-[var(--foreground)]" />
                    </button>
                    <button onClick={() => execCmd(col.id, 'italic')}
                      className="w-8 h-7 flex items-center justify-center hover:bg-[var(--muted)] transition-colors border-r border-[var(--border)]"
                      title="Курсив (Ctrl+I)">
                      <Italic size={14} className="text-[var(--foreground)]" />
                    </button>
                    <button onClick={() => execCmd(col.id, 'underline')}
                      className="w-8 h-7 flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
                      title="Подчёркнутый (Ctrl+U)">
                      <Underline size={14} className="text-[var(--foreground)]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {/* Color picker */}
                    <div className="relative w-7 h-7 rounded-md overflow-hidden border border-[var(--border)]">
                      <input type="color" value={col.color || '#2d2318'}
                        onChange={e => { updateColumn(col.id, { color: e.target.value }); execCmd(col.id, 'foreColor', e.target.value); }}
                        className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0"
                        style={{ background: 'transparent' }}
                        title="Цвет текста" />
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: col.color || '#2d2318' }} />
                    </div>
                    {/* Delete column */}
                    {columns.length > 1 && (
                      <button onClick={() => removeColumn(col.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-solid)] transition-colors"
                        title="Удалить колонку">
                        <Trash2 size={13} className="text-[var(--destructive)]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* WYSIWYG area — auto-expands vertically */}
                <div
                  ref={el => { colRefs.current.set(col.id, el); }}
                  contentEditable
                  suppressContentEditableWarning
                  className="flex-1 min-h-[100px] p-3.5 text-sm outline-none focus:bg-[var(--card)] transition-colors whitespace-pre-wrap break-words"
                  style={{
                    textAlign: (col.textAlign || 'left') as 'left' | 'center' | 'right',
                    fontWeight: col.fontWeight || 'normal',
                    fontStyle: col.fontStyle || 'normal',
                    textDecoration: col.textDecoration || 'none',
                    color: col.color || 'inherit',
                    height: 'auto',
                  }}
                  onInput={() => syncContent(col.id)}
                  onBlur={() => syncContent(col.id)}
                />

                {/* Column settings footer */}
                <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-[var(--muted)]/20 border-t border-[var(--border)] shrink-0">
                  <select value={col.textAlign || 'left'}
                    onChange={e => updateColumn(col.id, { textAlign: e.target.value as DocTextColumn['textAlign'] })}
                    className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-[10px] font-medium focus:outline-none cursor-pointer">
                    <option value="left">⬅ Лево</option>
                    <option value="center">↔ Центр</option>
                    <option value="right">➡ Право</option>
                  </select>
                  <select value={col.fontWeight || 'normal'}
                    onChange={e => updateColumn(col.id, { fontWeight: e.target.value as DocTextColumn['fontWeight'] })}
                    className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-[10px] font-medium focus:outline-none cursor-pointer">
                    <option value="normal">Обычный</option>
                    <option value="bold">Жирный</option>
                  </select>
                  <select value={col.fontStyle || 'normal'}
                    onChange={e => updateColumn(col.id, { fontStyle: e.target.value as DocTextColumn['fontStyle'] })}
                    className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-[10px] font-medium focus:outline-none cursor-pointer">
                    <option value="normal">Прямой</option>
                    <option value="italic">Курсив</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <button onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all">
            Отмена
          </button>
          <button onClick={handleSave}
            className="h-10 px-6 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-all shadow-sm shadow-[var(--primary)]/20">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   TableBlockDialog
   ───────────────────────────────────── */
interface TableBlockDialogProps {
  block: DocBlock;
  tableTemplates: Array<{ id: string; name: string }>;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
  onCreateTemplate?: () => void;
}

export function TableBlockDialog({ block, tableTemplates, onSave, onClose, onCreateTemplate }: TableBlockDialogProps) {
  const [title, setTitle] = useState(block.title || '');
  const [tableTemplateId, setTableTemplateId] = useState(block.tableTemplateId || '');
  const [showLine, setShowLine] = useState(block.showLine ?? true);
  const [height, setHeight] = useState(block.height || 0);
  const selectedTemplate = tableTemplates.find(t => t.id === tableTemplateId);

  const handleSave = () => {
    onSave({
      ...block,
      title: title || selectedTemplate?.name || '',
      tableTemplateId: tableTemplateId || undefined,
      showLine,
      height: height || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      <div className="glass-surface rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Настройка таблицы</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors">
            <X size={18} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Заголовок таблицы</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder={selectedTemplate?.name || 'Опционально'} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Шаблон таблицы</label>
              {onCreateTemplate && (
                <button onClick={onCreateTemplate} className="text-xs text-[var(--primary)] hover:underline font-medium">
                  + Создать шаблон
                </button>
              )}
            </div>
            {tableTemplates.length === 0 ? (
              <div className="text-sm text-[var(--muted-foreground)] py-4 text-center border border-dashed border-[var(--border)] rounded-xl">
                Нет шаблонов таблиц.
                {onCreateTemplate && (
                  <button onClick={onCreateTemplate} className="ml-1 text-[var(--primary)] hover:underline font-medium">
                    Создать первый
                  </button>
                )}
              </div>
            ) : (
              <select value={tableTemplateId}
                onChange={e => {
                  setTableTemplateId(e.target.value);
                  const t = tableTemplates.find(t => t.id === e.target.value);
                  if (t && !title) setTitle(t.name);
                }}
                className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer">
                <option value="">Без шаблона (стандартные колонки)</option>
                {tableTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Высота (px)</label>
            <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
              className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Авто" min={0} />
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={showLine} onChange={e => setShowLine(e.target.checked)}
              className="rounded border-[var(--input)] w-4 h-4" />
            <span className="text-[var(--foreground)]">Показывать линии таблицы</span>
          </label>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="h-10 px-5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all">Отмена</button>
          <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-all shadow-sm shadow-[var(--primary)]/20">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   SeparatorBlockDialog
   ───────────────────────────────────── */
interface SeparatorBlockDialogProps {
  block: DocBlock;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
}

export function SeparatorBlockDialog({ block, onSave, onClose }: SeparatorBlockDialogProps) {
  const [height, setHeight] = useState(block.height || 20);
  const [showLine, setShowLine] = useState(block.showLine ?? true);

  const handleSave = () => {
    onSave({ ...block, height, showLine });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      <div className="glass-surface rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Настройка разделителя</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors">
            <X size={18} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Высота (px)</label>
            <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))}
              className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              min={1} max={100} />
          </div>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={showLine} onChange={e => setShowLine(e.target.checked)}
              className="rounded border-[var(--input)] w-4 h-4" />
            <span className="text-[var(--foreground)]">Показывать линию</span>
          </label>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="h-10 px-5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all">Отмена</button>
          <button onClick={handleSave} className="h-10 px-6 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-all shadow-sm shadow-[var(--primary)]/20">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
