'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, USER_STATUS, USER_ROLE } from '@/lib/constants/statuses';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Роли берутся из общей карты USER_ROLE (см. src/lib/constants/statuses.tsx)

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '', phone: '', role: 'viewer' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (data.success) setUsers(data.data.items || []);
    } catch (e) {
      console.error('Load users error:', e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, [search]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', password: '', displayName: '', email: '', phone: '', role: 'viewer' });
    setError('');
    setShowDialog(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ username: user.username, password: '', displayName: user.displayName, email: user.email || '', phone: user.phone || '', role: user.role });
    setError('');
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        const body: Record<string, string> = {};
        if (form.displayName) body.displayName = form.displayName;
        if (form.email) body.email = form.email;
        if (form.phone) body.phone = form.phone;
        if (form.role) body.role = form.role;
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) { setError(data.message); return; }
      } else {
        if (!form.username || !form.password) { setError('Логин и пароль обязательны'); return; }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) { setError(data.message); return; }
      }
      setShowDialog(false);
      loadUsers();
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/users/${deleteTarget}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadUsers();
    } catch (e) {
      console.error('Delete user error:', e);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      loadUsers();
    } catch (e) {
      console.error('Toggle active error:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Пользователи</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Управление учётными записями</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="text"
          id="search-polzovateli"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по логину, имени или email..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="ml-auto flex gap-1"><Skeleton className="h-7 w-7 rounded-lg" /><Skeleton className="h-7 w-7 rounded-lg" /></div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Нет пользователей"
            description="Добавьте первого пользователя для начала работы"
            actionLabel="Добавить"
            onAction={openCreate}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Логин</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Email</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Роль</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--muted-foreground)]">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{user.username}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{user.displayName}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{user.email || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.role} map={USER_ROLE} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={user.isActive ? 'active' : 'blocked'} map={USER_STATUS} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(user)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                        title={user.isActive ? 'Заблокировать' : 'Активировать'}
                      >
                        {user.isActive ? <UserX className="h-4 w-4 text-[var(--muted-foreground)]" /> : <UserCheck className="h-4 w-4 text-[var(--success)]" />}
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--destructive)]/10 transition-colors"
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
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay" onClick={() => setShowDialog(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editUser ? 'Редактировать' : 'Добавить'} пользователя</h3>
            {error && <div className="mb-3 p-2 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Логин *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editUser}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">{editUser ? 'Новый пароль' : 'Пароль *'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editUser ? 'Оставьте пустым, чтобы не менять' : ''}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Отображаемое имя</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Телефон</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Роль</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-9 px-3 mt-1 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm appearance-none"
                >
                  {Object.entries(USER_ROLE).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить пользователя?"
        message="Это действие нельзя отменить. Пользователь будет удалён навсегда."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
