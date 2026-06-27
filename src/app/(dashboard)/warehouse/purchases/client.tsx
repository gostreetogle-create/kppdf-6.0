'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';
import { FormField, FormTextarea, Button } from '@/components/ui';
import { PURCHASE_STATUS, StatusBadge } from '@/lib/constants/statuses';

interface PurchaseRequest {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: number;
  notes: string | null;
}

function PurchaseRequestForm({ item, onClose }: { item: PurchaseRequest | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/purchase-requests/${item.id}` : '/api/purchase-requests';
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
        {item?.id ? 'Редактировать заявку' : 'Новая заявка на закупку'}
      </h2>
      <div className="space-y-4">
        <FormField label="Номер" name="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
        <FormField label="Название" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <FormTextarea label="Примечания" name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
        <Button type="submit" loading={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}

export function PurchasesClient({ initialData, initialTotal }: { initialData: PurchaseRequest[]; initialTotal: number }) {
  return (
    <CrudPage<PurchaseRequest>
      title="Заявки на закупку"
      apiPath="/api/purchase-requests"
      searchId="search-zayavki-na-zakupku"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        { key: 'status', label: 'Статус', render: (item) => <StatusBadge status={item.status} map={PURCHASE_STATUS} /> },
        { key: 'totalAmount', label: 'Сумма', render: (item) => `${(item.totalAmount ?? 0).toLocaleString('ru-RU')} ₽` },
      ]}
      renderForm={(item, onClose) => <PurchaseRequestForm item={item} onClose={onClose} />}
    />
  );
}
