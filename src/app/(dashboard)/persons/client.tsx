'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Person {
  [key: string]: unknown;
  id: string;
  lastName: string;
  firstName: string;
  patronymic?: string | null;
  phone: string;
  email?: string | null;
  position?: string | null;
  notes?: string | null;
}

function PersonForm({ item, onClose }: { item: Person | null; onClose: () => void }) {
  const [form, setForm] = useState({
    lastName: item?.lastName ?? '',
    firstName: item?.firstName ?? '',
    patronymic: item?.patronymic ?? '',
    phone: item?.phone ?? '',
    email: item?.email ?? '',
    position: item?.position ?? '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/persons/${item.id}` : '/api/persons';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const inp = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <input type={type} value={form[key as keyof typeof form] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {item?.id ? 'Редактировать контактное лицо' : 'Новое контактное лицо'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Фамилия *', 'lastName')}
        {inp('Имя *', 'firstName')}
        {inp('Отчество', 'patronymic')}
        {inp('Должность', 'position')}
        {inp('Телефон', 'phone', 'tel')}
        {inp('Email', 'email', 'email')}
        <div className="sm:col-span-2">{inp('Примечания', 'notes')}</div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Отмена</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-medium transition-all duration-200 hover:brightness-110 active:brightness-90 disabled:opacity-50">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}

export function PersonsClient({ initialData, initialTotal }: { initialData: Person[]; initialTotal: number }) {
  return (
    <CrudPage<Person>
      title="Контактные лица"
      apiPath="/api/persons"
      searchId="search-kontaktnye-lica"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'lastName', label: 'Фамилия' },
        { key: 'firstName', label: 'Имя' },
        { key: 'patronymic', label: 'Отчество', render: (item) => item.patronymic || '—' },
        { key: 'position', label: 'Должность', render: (item) => item.position || '—' },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email', render: (item) => item.email || '—' },
      ]}
      renderForm={(item, onClose) => <PersonForm item={item} onClose={onClose} />}
    />
  );
}
