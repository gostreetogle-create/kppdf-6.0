'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';
import { FormField, FormSelect, FormTextarea, Button } from '@/components/ui';
import { StatusBadge, IS_ACTIVE_STATUS } from '@/lib/constants/statuses';

interface Product {
  [key: string]: unknown;
  id: string;
  sku: string;
  name: string;
  category: { name: string } | null;
  productType: string;
  basePrice: number;
  unit: string;
  description: string | null;
  defaultMarkupPercent: number;
  weightKg: number | null;
  material: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

function ProductForm({ item, onClose, categories }: { item: Product | null; onClose: () => void; categories: Category[] }) {
  const [form, setForm] = useState({
    sku: item?.sku ?? '',
    name: item?.name ?? '',
    categoryId: (item as unknown as { categoryId?: string })?.categoryId ?? '',
    productType: item?.productType ?? 'purchased',
    description: item?.description ?? '',
    basePrice: item?.basePrice ?? 0,
    defaultMarkupPercent: item?.defaultMarkupPercent ?? 0,
    unit: item?.unit ?? 'шт',
    weightKg: item?.weightKg ?? 0,
    material: item?.material ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/products/${item.id}` : '/api/products';
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
        {item?.id ? 'Редактировать товар' : 'Новый товар'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Артикул" name="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
        <FormField label="Название" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <FormSelect
          label="Категория"
          name="categoryId"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          options={[{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <FormSelect
          label="Тип"
          name="productType"
          value={form.productType}
          onChange={(e) => setForm({ ...form, productType: e.target.value })}
          options={[
            { value: 'purchased', label: 'Закупаемый' },
            { value: 'manufactured', label: 'Производимый' },
          ]}
        />
        <FormField label="Базовая цена" name="basePrice" type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} min={0} step={0.01} />
        <FormField label="Наценка, %" name="defaultMarkupPercent" type="number" value={form.defaultMarkupPercent} onChange={(e) => setForm({ ...form, defaultMarkupPercent: Number(e.target.value) })} min={0} />
        <FormField label="Ед. изм." name="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <FormField label="Вес, кг" name="weightKg" type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })} min={0} step={0.01} />
        <FormField label="Материал" name="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
        <div className="sm:col-span-2">
          <FormTextarea label="Описание" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
        <Button type="submit" loading={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>
    </form>
  );
}

export function ProductsClient({ initialData, initialTotal, categories }: { initialData: Product[]; initialTotal: number; categories: Category[] }) {
  return (
    <CrudPage<Product>
      title="Товары"
      apiPath="/api/products"
      searchId="search-tovary"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'sku', label: 'Артикул' },
        { key: 'name', label: 'Название' },
        {
          key: 'category',
          label: 'Категория',
          render: (item) => item.category?.name ?? '—',
        },
        {
          key: 'productType',
          label: 'Тип',
          render: (item) => (
            <span className="text-sm">
              {item.productType === 'purchased' ? 'Закупаемый' : 'Производимый'}
            </span>
          ),
        },
        {
          key: 'basePrice',
          label: 'Цена',
          render: (item) => `${item.basePrice?.toLocaleString('ru-RU')} ₽`,
        },
        { key: 'unit', label: 'Ед.' },
        {
          key: 'isActive',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} map={IS_ACTIVE_STATUS} />,
        },
      ]}
      detailHref={(item) => `/products/${item.id}`}
      renderForm={(item, onClose) => <ProductForm item={item} onClose={onClose} categories={categories} />}
    />
  );
}
