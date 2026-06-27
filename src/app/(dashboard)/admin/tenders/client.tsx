'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';
import { TENDER_STATUS, StatusBadge } from '@/lib/constants/statuses';

function generateTenderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `Т-${year}-${rand}`;
}

interface Tender {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  customerName: string | null;
  totalAmount: number;
  deadline: Date | null;
  notes: string | null;
}

function TenderForm({ item, onClose }: { item: Tender | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    customerName: item?.customerName ?? '',
    totalAmount: item?.totalAmount ?? 0,
    deadline: item?.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && !form.number) {
      const number = generateTenderNumber();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(f => f.number ? f : { ...f, number });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/tenders/${item.id}` : '/api/tenders';
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
        {item?.id ? 'Редактировать тендер' : 'Новый тендер'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Номер</label>
          <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Заказчик</label>
          <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Сумма</label>
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} step={0.01} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Дедлайн</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Примечания</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" />
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

export function TendersClient({ initialData, initialTotal }: { initialData: Tender[]; initialTotal: number }) {
  return (
    <CrudPage<Tender>
      title="Тендеры"
      apiPath="/api/tenders"
      searchId="search-tendery"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',            render: (item) => <StatusBadge status={item.status} map={TENDER_STATUS} />,
        },
        { key: 'customerName', label: 'Заказчик' },
        {
          key: 'totalAmount',
          label: 'Сумма',
          render: (item) => `${(item.totalAmount ?? 0).toLocaleString('ru-RU')} ₽`,
        },
      ]}
      renderForm={(item, onClose) => <TenderForm item={item} onClose={onClose} />}
    />
  );
}
