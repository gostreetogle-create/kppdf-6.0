'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { FormField, FormTextarea } from '@/components/ui';

interface DocType {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export default function DocTypesPage() {
  const [items, setItems] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DocType | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/doc-types');
        const data = await res.json();
        if (!cancelled) setItems(data?.data?.items ?? data?.data ?? []);
      } catch {
        console.error('Failed to fetch doc types');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editItem?.id ? 'PUT' : 'POST';
      const url = editItem?.id ? `/api/doc-types/${editItem.id}` : '/api/doc-types';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setEditItem(null);
      setForm({ name: '', slug: '', description: '' });
      setTrigger((t) => t + 1);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/doc-types/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      setTrigger((t) => t + 1);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openEdit = (item: DocType) => {
    setEditItem(item);
    setForm({ name: item.name, slug: item.slug, description: item.description });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Типы документов</h1>
        <button
          onClick={() => { setEditItem(null); setForm({ name: '', slug: '', description: '' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Создать
        </button>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Название</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Код</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Описание</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--muted-foreground)]">Загрузка...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--muted-foreground)]">Нет типов документов</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.name}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.slug}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors" title="Редактировать">
                      <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded hover:bg-[var(--destructive)]/10 transition-colors" title="Удалить">
                      <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              {editItem ? 'Редактировать тип документа' : 'Новый тип документа'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Название" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <FormField label="Код" name="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              <FormTextarea label="Описание" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Удалить тип документа?</h3>
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
