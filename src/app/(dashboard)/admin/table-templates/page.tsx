'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Table } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  width?: number;
  type?: 'text' | 'number' | 'date' | 'currency';
}

interface TableTemplate {
  id: string;
  name: string;
  description?: string;
  columns?: string;
  createdAt: string;
}

export default function TableTemplatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<TableTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/table-templates');
        const data = await res.json();
        if (!cancelled) setItems(data?.data?.items ?? data?.data ?? []);
      } catch {
        console.error('Failed to fetch table templates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trigger]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/table-templates/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      setTrigger((t) => t + 1);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getColumnsCount = (columnsJson?: string) => {
    if (!columnsJson) return 0;
    try {
      const cols: Column[] = JSON.parse(columnsJson);
      return cols.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Шаблоны таблиц</h1>
        <button
          onClick={() => router.push('/admin/table-templates/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Создать шаблон
        </button>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Название</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Описание</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Колонок</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Создан</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)]">Загрузка...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                  <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Нет шаблонов таблиц
                </td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  <button
                    onClick={() => router.push(`/admin/table-templates/${item.id}`)}
                    className="hover:text-[var(--primary)] hover:underline"
                  >
                    {item.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.description || '—'}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{getColumnsCount(item.columns)}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => router.push(`/admin/table-templates/${item.id}`)}
                      className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="p-1.5 rounded hover:bg-[var(--destructive)]/10 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Удалить шаблон таблицы?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Это действие нельзя отменить.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg bg-[var(--destructive)] text-white text-sm hover:opacity-90 transition-opacity">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
