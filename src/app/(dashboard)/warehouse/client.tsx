'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';
import { StatusBadge, IS_ACTIVE_STATUS } from '@/lib/constants/statuses';

interface Warehouse {
  [key: string]: unknown;
  id: string;
  name: string;
  address: string | null;   // Prisma Warehouse.address — nullable в БД; form/через ?? '' уже конвертирует
  isActive: boolean;
}

function WarehouseForm({ item, onClose }: { item: Warehouse | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    address: item?.address ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/warehouses/${item.id}` : '/api/warehouses';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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
        {item?.id ? 'Редактировать склад' : 'Новый склад'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Адрес</label>
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
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

export function WarehouseClient({ initialData, initialTotal }: { initialData: Warehouse[]; initialTotal: number }) {
  return (
    <CrudPage<Warehouse>
      title="Склады"
      apiPath="/api/warehouses"
      searchId="search-sklady"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'name', label: 'Название' },
        { key: 'address', label: 'Адрес' },
        {
          key: 'isActive',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} map={IS_ACTIVE_STATUS} />,
        },
      ]}
      renderForm={(item, onClose) => <WarehouseForm item={item} onClose={onClose} />}
    />
  );
}
