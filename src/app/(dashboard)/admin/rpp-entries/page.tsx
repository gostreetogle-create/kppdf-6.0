'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { RPP_STATUS, getStatus } from '@/lib/constants/statuses';
function generateRppNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `РПП-${year}-${rand}`;
}

interface RppEntry {
  id: string;
  number: string;
  title: string;
  status: string;
  notes: string | null;
  createdAt: string;
}



export default function RppEntriesPage() {
  const [items, setItems] = useState<RppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<RppEntry | null>(null);
  const [form, setForm] = useState({ number: '', title: '', status: 'draft', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (search) params.set('search', search);
        const res = await fetch(`/api/rpp-entries?${params}`);
        const data = await res.json();
        if (!cancelled && data.success) setItems(data.data.items || []);
    } catch {
        if (!cancelled) console.error('Load error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, refreshTrigger]);

  const openCreate = async () => {
    const number = generateRppNumber();
    setEditItem(null);
    setError('');
    setForm({ number, title: '', status: 'draft', notes: '' });
    setShowDialog(true);
  };

  const openEdit = (item: RppEntry) => {
    setEditItem(item);
    setForm({ number: item.number, title: item.title, status: item.status, notes: item.notes || '' });
    setError('');
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editItem ? `/api/rpp-entries/${editItem.id}` : '/api/rpp-entries';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setShowDialog(false);
      setRefreshTrigger(t => t + 1);
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/rpp-entries/${deleteTarget}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setRefreshTrigger(t => t + 1);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">РПП записи</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Журнал распоряжений и протоколов</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all shadow-sm">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input type="text" id="search-rpp-entries" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по номеру или названию..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Нет записей РПП"
            description="Добавьте первую запись распоряжения или протокола"
            actionLabel="Добавить"
            onAction={openCreate}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Номер</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Название</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--muted-foreground)]">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Создано</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const status = getStatus(RPP_STATUS, item.status);
                return (
                  <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.number}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{item.title}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"><Edit className="h-4 w-4 text-[var(--muted-foreground)]" /></button>
                        <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--destructive)]/10 transition-colors"><Trash2 className="h-4 w-4 text-[var(--destructive)]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay" onClick={() => setShowDialog(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editItem ? 'Редактировать' : 'Добавить'} запись РПП</h3>
            {error && <div className="mb-3 p-2 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Номер *</label>
                <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" readOnly={!!editItem} placeholder={editItem ? undefined : 'Авто-генерация...'} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Название *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Статус</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                  <option value="draft">Черновик</option>
                  <option value="active">Активно</option>
                  <option value="archived">В архиве</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Примечания</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowDialog(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Удалить запись РПП?" message="Это действие нельзя отменить." confirmLabel="Удалить" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
