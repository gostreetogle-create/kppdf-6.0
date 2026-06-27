'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, IS_ACTIVE_YESNO } from '@/lib/constants/statuses';

interface StatusWorkflow {
  id: string;
  name: string;
  entity: string;
  fromStatus: string;
  toStatus: string;
  roles: string;
  isActive: boolean;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = {
  proposal: 'КП',
  contract: 'Договор',
  production_order: 'Заказ производства',
  purchase_request: 'Заявка на закупку',
};

export default function StatusWorkflowsPage() {
  const [items, setItems] = useState<StatusWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<StatusWorkflow | null>(null);
  const [form, setForm] = useState({ name: '', entity: 'proposal', fromStatus: '', toStatus: '', roles: 'admin' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/status-workflows?${params}`);
      const data = await res.json();
      if (data.success) setItems(data.data.items || []);
    } catch {
      console.error('Load error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', entity: 'proposal', fromStatus: '', toStatus: '', roles: 'admin' });
    setError('');
    setShowDialog(true);
  };

  const openEdit = (item: StatusWorkflow) => {
    setEditItem(item);
    setForm({ name: item.name, entity: item.entity, fromStatus: item.fromStatus, toStatus: item.toStatus, roles: item.roles });
    setError('');
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editItem ? `/api/status-workflows/${editItem.id}` : '/api/status-workflows';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setShowDialog(false);
      load();
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/status-workflows/${deleteTarget}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } catch {
      console.error('Delete error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Мастер статусов</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Настройка переходов между статусами</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all shadow-sm">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input type="text" id="search-status-workflows" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Нет переходов статусов"
            description="Настройте правила переходов между статусами"
            actionLabel="Добавить"
            onAction={openCreate}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Название</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Сущность</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Из</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">В</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Роли</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--muted-foreground)]">Активен</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{ENTITY_LABELS[item.entity] || item.entity}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]">{item.fromStatus}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-[var(--status-info-bg)] text-[var(--status-info-text)]">{item.toStatus}</span></td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.roles}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.isActive ? 'yes' : 'no'} map={IS_ACTIVE_YESNO} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"><Edit className="h-4 w-4 text-[var(--muted-foreground)]" /></button>
                      <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 rounded-lg hover:bg-[var(--destructive)]/10 transition-colors"><Trash2 className="h-4 w-4 text-[var(--destructive)]" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay" onClick={() => setShowDialog(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editItem ? 'Редактировать' : 'Добавить'} переход</h3>
            {error && <div className="mb-3 p-2 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Название</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Сущность</label>
                <select value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                  {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Из статуса</label>
                  <input type="text" value={form.fromStatus} onChange={(e) => setForm({ ...form, fromStatus: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">В статус</label>
                  <input type="text" value={form.toStatus} onChange={(e) => setForm({ ...form, toStatus: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Роли (через запятую)</label>
                <input type="text" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
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

      <ConfirmDialog open={!!deleteTarget} title="Удалить переход?" message="Это действие нельзя отменить." confirmLabel="Удалить" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
