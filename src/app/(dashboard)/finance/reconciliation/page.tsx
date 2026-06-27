'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';
function generateReconciliationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `АС-${year}-${rand}`;
}

interface ReconciliationAct {
  [key: string]: unknown;
  id: string;
  number: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  createdAt: string;
}

function ReconciliationForm({ item, onClose }: { item: ReconciliationAct | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    organizationId: item?.organizationId ?? '',
    periodStart: item?.periodStart ? item.periodStart.slice(0, 10) : '',
    periodEnd: item?.periodEnd ? item.periodEnd.slice(0, 10) : '',
    totalDebit: item?.totalDebit ?? 0,
    totalCredit: item?.totalCredit ?? 0,
    status: item?.status ?? 'draft',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && !form.number) {
      const number = generateReconciliationNumber();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(f => f.number ? f : { ...f, number });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/reconciliation-acts/${item.id}` : '/api/reconciliation-acts';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">{item?.id ? 'Редактировать' : 'Новый'} акт</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Номер</label>
          <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID организации</label>
          <input type="text" value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Начало периода</label>
          <input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Конец периода</label>
          <input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Дебет</label>
          <input type="number" value={form.totalDebit} onChange={(e) => setForm({ ...form, totalDebit: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Кредит</label>
          <input type="number" value={form.totalCredit} onChange={(e) => setForm({ ...form, totalCredit: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
            <option value="draft">Черновик</option>
            <option value="signed">Подписан</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </form>
  );
}

export default function ReconciliationPage() {
  return (
    <CrudPage<ReconciliationAct>
      title="Акты сверки"
      apiPath="/api/reconciliation-acts"
      searchId="search-akty-sverki"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'periodStart', label: 'Начало периода', render: (item) => new Date(item.periodStart).toLocaleDateString('ru-RU') },
        { key: 'periodEnd', label: 'Конец периода', render: (item) => new Date(item.periodEnd).toLocaleDateString('ru-RU') },
        { key: 'totalDebit', label: 'Дебет', render: (item) => `${(item.totalDebit || 0).toLocaleString('ru-RU')} ₽` },
        { key: 'totalCredit', label: 'Кредит', render: (item) => `${(item.totalCredit || 0).toLocaleString('ru-RU')} ₽` },
        { key: 'status', label: 'Статус' },
        { key: 'createdAt', label: 'Дата', render: (item) => new Date(item.createdAt).toLocaleDateString('ru-RU') },
      ]}
      renderForm={(item, onClose) => <ReconciliationForm item={item} onClose={onClose} />}
    />
  );
}
