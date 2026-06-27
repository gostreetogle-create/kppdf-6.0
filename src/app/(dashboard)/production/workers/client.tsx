'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';
import { StatusBadge, IS_ACTIVE_STATUS } from '@/lib/constants/statuses';

interface Worker {
  [key: string]: unknown;
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

function WorkerForm({ item, onClose }: { item: Worker | null; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: item?.firstName ?? '',
    lastName: item?.lastName ?? '',
    phone: item?.phone ?? '',
    role: item?.role ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/workers/${item.id}` : '/api/workers';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {item?.id ? 'Редактировать сотрудника' : 'Новый сотрудник'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Имя</label>
          <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Фамилия</label>
          <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Телефон</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Должность</label>
          <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}

export function WorkersClient({ initialData, initialTotal }: { initialData: Worker[]; initialTotal: number }) {
  return (
    <CrudPage<Worker>
      title="Сотрудники"
      apiPath="/api/workers"
      searchId="search-sotrudniki"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        {
          key: 'lastName',
          label: 'ФИО',
          render: (item) => `${item.lastName} ${item.firstName}`.trim(),
        },
        { key: 'phone', label: 'Телефон' },
        { key: 'role', label: 'Должность' },
        {
          key: 'isActive',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} map={IS_ACTIVE_STATUS} />,
        },
      ]}
      renderForm={(item, onClose) => <WorkerForm item={item} onClose={onClose} />}
    />
  );
}
