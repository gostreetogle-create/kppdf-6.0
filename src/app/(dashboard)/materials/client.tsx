'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Material {
  [key: string]: unknown;
  id: string;
  name: string;
  article?: string;
  unit: string;
  description?: string;
  price?: number;
  image?: string;
  supplierId?: string;
  categoryId?: string;
  supplier?: { name: string } | null;
  category?: { name: string } | null;
}

function MaterialForm({ item, onClose }: { item: Material | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    article: item?.article ?? undefined,
    unit: item?.unit ?? 'шт',
    description: item?.description ?? '',
    price: item?.price ?? '',
    image: item?.image ?? '',
    supplierId: item?.supplierId ?? '',
    categoryId: item?.categoryId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/organizations?role=supplier&limit=500').then(r => r.json()).then(d => {
      if (d.success) setSuppliers(d.data.items);
    }).catch(() => {});
    fetch('/api/materials/categories').then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/materials/${item.id}` : '/api/materials';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price !== '' ? Number(form.price) : null,
        }),
      });
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
        {item?.id ? 'Редактировать материал' : 'Новый материал'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Название *', 'name')}
        {inp('Артикул', 'article')}
        {inp('Единица измерения', 'unit')}
        {inp('Цена', 'price', 'number')}
        <div className="sm:col-span-2">{inp('Описание', 'description')}</div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Поставщик</label>
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
            <option value="">— Не выбран —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Категория</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
            <option value="">— Не выбрана —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          {inp('Изображение (URL)', 'image')}
        </div>
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

export function MaterialsClient({ initialData, initialTotal }: { initialData: Material[]; initialTotal: number }) {
  return (
    <CrudPage<Material>
      title="Материалы"
      apiPath="/api/materials"
      searchId="search-materialy"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'name', label: 'Название' },
        { key: 'article', label: 'Артикул', render: (item) => item.article || '—' },
        { key: 'unit', label: 'Ед.' },
        { key: 'price', label: 'Цена', render: (item) => item.price ? `${item.price.toLocaleString('ru-RU')} ₽` : '—' },
        { key: 'supplier', label: 'Поставщик', render: (item) => item.supplier?.name ?? '—' },
        { key: 'category', label: 'Категория', render: (item) => item.category?.name ?? '—' },
      ]}
      renderForm={(item, onClose) => <MaterialForm item={item} onClose={onClose} />}
    />
  );
}
