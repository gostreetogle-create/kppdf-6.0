'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';
import { FormField, FormSelect, FormTextarea, Button } from '@/components/ui';
import { ORDER_STATUS, StatusBadge } from '@/lib/constants/statuses';

interface ProductionOrder {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  workType: { name: string } | null;
  plannedStart: Date | null;
  plannedEnd: Date | null;
  workTypeId: string | null;
  workCenterId: string | null;
  priority: number;
  notes: string | null;
}

function ProductionOrderForm({ item, onClose }: { item: ProductionOrder | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    workTypeId: item?.workTypeId ?? '',
    workCenterId: item?.workCenterId ?? '',
    priority: item?.priority ?? 0,
    plannedStart: item?.plannedStart ? new Date(item.plannedStart).toISOString().slice(0, 16) : '',
    plannedEnd: item?.plannedEnd ? new Date(item.plannedEnd).toISOString().slice(0, 16) : '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [workTypes, setWorkTypes] = useState<{ id: string; name: string }[]>([]);
  const [workCenters, setWorkCenters] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/work-types?limit=100').then(r => r.json()).then(d => {
      if (d.success) setWorkTypes(d.data.items);
    }).catch(() => {});
    fetch('/api/work-centers?limit=100').then(r => r.json()).then(d => {
      if (d.success) setWorkCenters(d.data.items);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/production-orders/${item.id}` : '/api/production-orders';
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
        {item?.id ? 'Редактировать заказ' : 'Новый заказ'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Номер" name="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
        <FormField label="Название" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <FormSelect
          label="Тип работы"
          name="workTypeId"
          value={form.workTypeId}
          onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
          options={[{ value: '', label: '— Не выбран —' }, ...workTypes.map((wt) => ({ value: wt.id, label: wt.name }))]}
        />
        <FormSelect
          label="Рабочий центр"
          name="workCenterId"
          value={form.workCenterId}
          onChange={(e) => setForm({ ...form, workCenterId: e.target.value })}
          options={[{ value: '', label: '— Не выбран —' }, ...workCenters.map((wc) => ({ value: wc.id, label: wc.name }))]}
        />
        <FormField label="Приоритет" name="priority" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} min={0} />
        <FormField label="План. начало" name="plannedStart" type="datetime-local" value={form.plannedStart} onChange={(e) => setForm({ ...form, plannedStart: e.target.value })} />
        <FormField label="План. окончание" name="plannedEnd" type="datetime-local" value={form.plannedEnd} onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })} />
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

export function ProductionClient({ initialData, initialTotal }: { initialData: ProductionOrder[]; initialTotal: number }) {
  return (
    <CrudPage<ProductionOrder>
      title="Производственные заказы"
      apiPath="/api/production-orders"
      searchId="search-proizvodstvennye-zakazy"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',            render: (item) => <StatusBadge status={item.status} map={ORDER_STATUS} />,
        },
        {
          key: 'workType',
          label: 'Тип работы',
          render: (item) => item.workType?.name ?? '—',
        },
        {
          key: 'plannedStart',
          label: 'План. начало',
          render: (item) => item.plannedStart ? new Date(item.plannedStart).toLocaleDateString('ru-RU') : '—',
        },
        {
          key: 'plannedEnd',
          label: 'План. окончание',
          render: (item) => item.plannedEnd ? new Date(item.plannedEnd).toLocaleDateString('ru-RU') : '—',
        },
      ]}
      renderForm={(item, onClose) => <ProductionOrderForm item={item} onClose={onClose} />}
      detailHref={(item) => `/production/${item.id}`}
    />
  );
}
