'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { CrudPage } from '@/components/crud-page';
import { FormField, FormSelect, FormTextarea, Button } from '@/components/ui';
import { PROPOSAL_STATUS, StatusBadge } from '@/lib/constants/statuses';

interface Proposal {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  customer: { name: string } | null;
  createdAt: Date;
  customerId: string | null;
  organizationId: string | null;
  markupPercent: number;
  notes: string | null;
  validUntil: Date | null;
}

function ProposalForm({ item, onClose }: { item: Proposal | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    customerId: item?.customerId ?? '',
    organizationId: item?.organizationId ?? '',
    markupPercent: item?.markupPercent ?? 0,
    notes: item?.notes ?? '',
    validUntil: item?.validUntil ? new Date(item.validUntil).toISOString().slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);

  // Лёгкий fetch для select-опций
  useEffect(() => {
    fetch('/api/organizations?role=client&limit=100').then(r => r.json()).then(d => {
      if (d.success) setCustomers(d.data.items.map((o: Record<string, unknown>) => ({ id: o.id as string, name: (o.name as string) || (o.id as string) })));
    }).catch(() => {});
    fetch('/api/organizations?limit=100').then(r => r.json()).then(d => {
      if (d.success) setOrganizations(d.data.items.map((o: Record<string, unknown>) => ({ id: o.id as string, name: (o.name as string) || (o.id as string) })));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/proposals/${item.id}` : '/api/proposals';
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
        {item?.id ? 'Редактировать предложение' : 'Новое предложение'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Номер" name="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required readOnly={!!item} placeholder={item ? undefined : 'КП-XXXX (авто)'} />
        <FormField label="Название" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <FormSelect
          label="Клиент"
          name="customerId"
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          options={[{ value: '', label: '— Не выбран —' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <FormSelect
          label="Организация"
          name="organizationId"
          value={form.organizationId}
          onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
          options={[{ value: '', label: '— Не выбрана —' }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]}
        />
        <FormField label="Наценка, %" name="markupPercent" type="number" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: Number(e.target.value) })} min={0} />
        <FormField label="Действует до" name="validUntil" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
        <div className="sm:col-span-2">
          <FormTextarea label="Примечания" name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
        <Button type="submit" loading={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}

export function ProposalsClient({ initialData, initialTotal }: { initialData: Proposal[]; initialTotal: number }) {
  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          Оформить КП
        </Link>
      </div>
      <CrudPage<Proposal>
        title="Предложения"
        apiPath="/api/proposals"
        searchId="search-predlozheniya"
        initialData={initialData}
        initialTotal={initialTotal}
        columns={[
          { key: 'number', label: 'Номер' },
          { key: 'title', label: 'Название' },
          {
            key: 'status',
            label: 'Статус',
            render: (item) => <StatusBadge status={item.status} map={PROPOSAL_STATUS} />,
          },
          {
          key: 'customer',
          label: 'Клиент',
          render: (item) => item.customer?.name ?? '—',
          },
          {
            key: 'total',
            label: 'Сумма',
            render: (item) => {
              const items = (item as { items?: { total?: number }[] }).items;
              const total = items?.reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
              return `${total.toLocaleString('ru-RU')} ₽`;
            },
          },
          {
            key: 'createdAt',
            label: 'Дата',
            render: (item) => new Date(item.createdAt).toLocaleDateString('ru-RU'),
          },
        ]}
        renderForm={(item, onClose) => <ProposalForm item={item} onClose={onClose} />}
      />
    </div>
  );
}
