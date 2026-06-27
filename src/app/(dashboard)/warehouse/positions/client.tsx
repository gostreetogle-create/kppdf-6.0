'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface StoragePosition {
  [key: string]: unknown;
  id: string;
  warehouse?: { name: string } | null;
  product?: { name: string } | null;
  warehouseId: string;
  productId: string | null;
  quantity: number;
  reservedQty: number;
  minQuantity: number;
}

function PositionForm({ item, onClose }: { item: StoragePosition | null; onClose: () => void }) {
  const [form, setForm] = useState({
    warehouseId: item?.warehouseId ?? '',
    productId: item?.productId ?? '',
    quantity: item?.quantity ?? 0,
    reservedQty: item?.reservedQty ?? 0,
    minQuantity: item?.minQuantity ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/storage-items/${item.id}` : '/api/storage-items';
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
        {item?.id ? 'Редактировать позицию' : 'Новая позиция'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ID склада</label>
          <input type="text" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ID товара</label>
          <input type="text" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Количество</label>
          <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Зарезервировано</label>
          <input type="number" value={form.reservedQty} onChange={(e) => setForm({ ...form, reservedQty: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Мин. количество</label>
          <input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} />
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

export function PositionsClient({ initialData, initialTotal }: { initialData: StoragePosition[]; initialTotal: number }) {
  return (
    <CrudPage<StoragePosition>
      title="Остатки на складе"
      apiPath="/api/storage-items"
      searchId="search-ostatki-na-sklade"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'warehouse', label: 'Склад', render: (item) => item.warehouse?.name ?? '—' },
        { key: 'product', label: 'Товар', render: (item) => item.product?.name ?? '—' },
        { key: 'quantity', label: 'Кол-во' },
        { key: 'reservedQty', label: 'Зарезерв.' },
        { key: 'minQuantity', label: 'Мин.' },
      ]}
      renderForm={(item, onClose) => <PositionForm item={item} onClose={onClose} />}
    />
  );
}
