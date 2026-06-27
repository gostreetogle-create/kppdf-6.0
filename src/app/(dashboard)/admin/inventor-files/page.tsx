'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileDown, FileImage, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface InventorFile {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number | null;
  url: string | null;
  description: string | null;
  createdAt: string;
}

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  dwg: { icon: FileDown, color: 'text-info' },
  dxf: { icon: FileDown, color: 'text-success' },
  pdf: { icon: FileText, color: 'text-destructive' },
  ipt: { icon: FileImage, color: 'text-primary' },
  iam: { icon: FileImage, color: 'text-warning' },
};

export default function InventorFilesPage() {
  const [items, setItems] = useState<InventorFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<InventorFile | null>(null);
  const [form, setForm] = useState({ filename: '', fileType: 'dwg', url: '', description: '' });
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
        const res = await fetch(`/api/inventor-files?${params}`);
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

  const openCreate = () => {
    setEditItem(null);
    setForm({ filename: '', fileType: 'dwg', url: '', description: '' });
    setError('');
    setShowDialog(true);
  };

  const openEdit = (item: InventorFile) => {
    setEditItem(item);
    setForm({ filename: item.filename, fileType: item.fileType, url: item.url || '', description: item.description || '' });
    setError('');
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body = { ...form, url: form.url || null, description: form.description || null };
      const url = editItem ? `/api/inventor-files/${editItem.id}` : '/api/inventor-files';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
      await fetch(`/api/inventor-files/${deleteTarget}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setRefreshTrigger(t => t + 1);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1048576).toFixed(1)} МБ`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">CAD-файлы</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Файлы Inventor и чертежи</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all shadow-sm">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input type="text" id="search-inventor-files" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени файла..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Нет CAD-файлов"
            description="Загрузите файлы чертежей и моделей"
            actionLabel="Добавить"
            onAction={openCreate}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Файл</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Размер</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Описание</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const fileIcon = FILE_ICONS[item.fileType] || { icon: FileDown, color: 'text-muted-foreground' };
                const Icon = fileIcon.icon;
                return (
                  <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${fileIcon.color}`} />
                        <span className="font-medium text-[var(--foreground)]">{item.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] uppercase text-xs">{item.fileType}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatSize(item.fileSize)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] truncate max-w-[200px]">{item.description || '—'}</td>
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
            <h3 className="text-lg font-semibold mb-4">{editItem ? 'Редактировать' : 'Добавить'} файл</h3>
            {error && <div className="mb-3 p-2 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Имя файла *</label>
                <input type="text" value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Тип</label>
                <select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })} className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                  <option value="dwg">DWG</option>
                  <option value="dxf">DXF</option>
                  <option value="pdf">PDF</option>
                  <option value="ipt">IPT (Inventor)</option>
                  <option value="iam">IAM (Inventor)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">URL</label>
                <input type="text" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Описание</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
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

      <ConfirmDialog open={!!deleteTarget} title="Удалить файл?" message="Это действие нельзя отменить." confirmLabel="Удалить" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
