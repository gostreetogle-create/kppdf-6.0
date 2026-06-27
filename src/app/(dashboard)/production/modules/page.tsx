'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';

interface ProductModule {
  [key: string]: unknown;
  id: string;
  name: string;
  article?: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  sortOrder: number;
  productId: string;    image?: string;
    product?: { id: string; name: string; sku: string };
  workTypes?: ModuleWorkType[];
  materials?: ModuleMaterial[];
}

interface ModuleWorkType {
  id?: string;
  workTypeId: string;
  estimatedHours: number;
  sortOrder?: number;
  workType?: { id: string; name: string };
}

interface ModuleMaterial {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
}

function ModuleForm({ item, onClose }: { item: ProductModule | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    article: item?.article ?? '',
    productId: item?.productId ?? '',
    image: item?.image ?? '',
    width: item?.width ?? '',
    height: item?.height ?? '',
    depth: item?.depth ?? '',
    weight: item?.weight ?? '',
    sortOrder: item?.sortOrder ?? 0,
  });
  const [workTypes, _setWorkTypes] = useState<ModuleWorkType[]>(
    item?.workTypes?.map((wt) => ({
      workTypeId: wt.workTypeId,
      estimatedHours: wt.estimatedHours,
      sortOrder: wt.sortOrder ?? 0,
    })) ?? [],
  );
  const [materials, _setMaterials] = useState<ModuleMaterial[]>(
    item?.materials?.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      isPurchased: m.isPurchased,
    })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=500').then((r) => r.json()).then((d) => {
      if (d.success) setProducts(d.data.items);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/product-modules/${item.id}` : '/api/product-modules';
      const payload = {
        ...form,
        productId: form.productId || undefined,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        depth: form.depth ? Number(form.depth) : null,
        weight: form.weight ? Number(form.weight) : null,
        workTypes: workTypes.filter((wt) => wt.workTypeId),
        materials: materials.filter((m) => m.name.trim()),
      };
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{label}</label>
      <input type={type} value={form[key as keyof typeof form] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {item?.id ? 'Редактировать модуль' : 'Новый модуль'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Название *', 'name')}
        {inp('Артикул', 'article')}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Продукт</label>
          <select value={form.productId as string} onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
            <option value="">— Не привязан —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>
        {inp('Ширина (мм)', 'width', 'number')}
        {inp('Высота (мм)', 'height', 'number')}
        {inp('Глубина (мм)', 'depth', 'number')}
        {inp('Вес (кг)', 'weight', 'number')}
        {inp('Порядок сортировки', 'sortOrder', 'number')}
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

export default function ModulesPage() {
  return (
    <CrudPage<ProductModule>
      title="Модули продуктов"
      apiPath="/api/product-modules"
      searchId="search-moduli-produktov"
      columns={[
        { key: 'name', label: 'Название' },
        { key: 'article', label: 'Артикул', render: (item) => item.article || '—' },
        {
          key: 'product',
          label: 'Продукт',
          render: (item) => item.product?.name ?? '—',
        },
        {
          key: 'workTypes',
          label: 'Видов работ',
          render: (item) => String(item.workTypes?.length ?? 0),
        },
        {
          key: 'materials',
          label: 'Материалов',
          render: (item) => String(item.materials?.length ?? 0),
        },
        {
          key: 'dimensions',
          label: 'Габариты',
          render: (item) => {
            const parts = [];
            if (item.width) parts.push(`${item.width}мм`);
            if (item.height) parts.push(`${item.height}мм`);
            if (item.depth) parts.push(`${item.depth}мм`);
            return parts.length > 0 ? parts.join('×') : '—';
          },
        },
      ]}
      renderForm={(item, onClose) => <ModuleForm item={item} onClose={onClose} />}
    />
  );
}
