'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ArrowLeft, Package, Ruler, Wrench, Boxes } from 'lucide-react';
import Link from 'next/link';

interface ProductModule {
  id?: string;
  name: string;
  article?: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  image?: string;
  sortOrder: number;
  workTypes: ModuleWorkType[];
  materials: ModuleMaterial[];
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

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  basePrice: number;
  defaultMarkupPercent: number;
  unit: string;
  weightKg: number;
  material: string;
  productType: string;
  isActive: boolean;
  ralCode?: string | null;
  category?: { id: string; name: string };
  modules: ProductModule[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ProductModule[]>([]);
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [workTypesList, setWorkTypesList] = useState<{ id: string; name: string }[]>([]);

  const loadProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        setModules(data.data.modules || []);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProduct();
    fetch('/api/work-types?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWorkTypesList(d.data.items);
      })
      .catch(() => {});
  }, [loadProduct]);

  const handleModuleChange = (index: number, field: string, value: unknown) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addModule = () => {
    setModules([...modules, {
      name: '',
      article: '',
      width: undefined,
      height: undefined,
      depth: undefined,
      weight: undefined,
      image: '',
      sortOrder: modules.length,
      workTypes: [],
      materials: [],
    }]);
    setEditingModule(modules.length);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
    if (editingModule === index) setEditingModule(null);
  };

  const handleWorkTypeChange = (moduleIndex: number, wtIndex: number, field: string, value: unknown) => {
    const updated = [...modules];
    const wt = { ...updated[moduleIndex].workTypes[wtIndex], [field]: value };
    updated[moduleIndex].workTypes[wtIndex] = wt;
    setModules(updated);
  };

  const addWorkType = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].workTypes.push({ workTypeId: '', estimatedHours: 1, sortOrder: 0 });
    setModules(updated);
  };

  const removeWorkType = (moduleIndex: number, wtIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].workTypes = updated[moduleIndex].workTypes.filter((_, i) => i !== wtIndex);
    setModules(updated);
  };

  const handleMaterialChange = (moduleIndex: number, matIndex: number, field: string, value: unknown) => {
    const updated = [...modules];
    const mat = { ...updated[moduleIndex].materials[matIndex], [field]: value };
    updated[moduleIndex].materials[matIndex] = mat;
    setModules(updated);
  };

  const addMaterial = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].materials.push({ name: '', quantity: 1, unit: 'шт', isPurchased: true });
    setModules(updated);
  };

  const removeMaterial = (moduleIndex: number, matIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].materials = updated[moduleIndex].materials.filter((_, i) => i !== matIndex);
    setModules(updated);
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      });
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        setModules(data.data.modules || []);
      }
    } catch (err) {
      console.error('Failed to save modules:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">Товар не найден</p>
        <Link href="/products">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{product.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{product.sku} · {product.category?.name || 'Без категории'}</p>
        </div>
      </div>

      <Tabs.Root defaultValue="info">
        <Tabs.List variant="underline">
          <Tabs.Trigger value="info">
            <Package className="h-4 w-4 mr-2" />
            Информация
          </Tabs.Trigger>
          <Tabs.Trigger value="modules">
            <Boxes className="h-4 w-4 mr-2" />
            Модули ({modules.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="info">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <InfoField label="Артикул" value={product.sku} />
            <InfoField label="Тип" value={product.productType === 'manufactured' ? 'Изготавливаемый' : 'Закупаемый'} />
            <InfoField label="Ед. измерения" value={product.unit} />
            <InfoField label="Базовая цена" value={`${product.basePrice.toLocaleString('ru-RU')} ₽`} />
            <InfoField label="Наценка по умолчанию" value={`${product.defaultMarkupPercent}%`} />
            <InfoField label="Вес" value={product.weightKg ? `${product.weightKg} кг` : '—'} />
            <InfoField label="Материал" value={product.material || '—'} />
            <InfoField label="RAL / Цвет" value={product.ralCode ? product.ralCode : '—'} />
            <InfoField label="Статус" value={product.isActive ? 'Активен' : 'Неактивен'} />
            {product.description && (
              <div className="sm:col-span-2 lg:col-span-3">
                <InfoField label="Описание" value={product.description} />
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="modules">
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Модули/изделия товара. Определяют состав, виды работ и материалы.
              </p>
              <Button onClick={addModule} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Добавить модуль
              </Button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
                <Boxes className="h-12 w-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                <p className="text-[var(--muted-foreground)]">Нет модулей</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Добавьте модуль для определения состава товара</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((mod, mIdx) => (
                  <div key={mIdx} className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-[var(--muted)]/50 cursor-pointer hover:bg-[var(--muted)]"
                      onClick={() => setEditingModule(editingModule === mIdx ? null : mIdx)}
                    >
                      <div className="flex items-center gap-3">
                        <Ruler className="h-4 w-4 text-[var(--muted-foreground)]" />
                        <span className="font-medium text-[var(--foreground)]">
                          {mod.name || `Модуль ${mIdx + 1}`}
                        </span>
                        {mod.article && (
                          <span className="text-xs text-[var(--muted-foreground)]">({mod.article})</span>
                        )}
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {mod.workTypes.length} работ · {mod.materials.length} материалов
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); removeModule(mIdx); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {editingModule === mIdx && (
                      <div className="p-4 border-t border-[var(--border)] space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Название *</label>
                            <input
                              type="text"
                              value={mod.name}
                              onChange={(e) => handleModuleChange(mIdx, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              placeholder="Столешница"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Артикул</label>
                            <input
                              type="text"
                              value={mod.article || ''}
                              onChange={(e) => handleModuleChange(mIdx, 'article', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Ширина (мм)</label>
                            <input
                              type="number"
                              value={mod.width ?? ''}
                              onChange={(e) => handleModuleChange(mIdx, 'width', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Высота (мм)</label>
                            <input
                              type="number"
                              value={mod.height ?? ''}
                              onChange={(e) => handleModuleChange(mIdx, 'height', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Глубина (мм)</label>
                            <input
                              type="number"
                              value={mod.depth ?? ''}
                              onChange={(e) => handleModuleChange(mIdx, 'depth', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Вес (кг)</label>
                            <input
                              type="number"
                              value={mod.weight ?? ''}
                              onChange={(e) => handleModuleChange(mIdx, 'weight', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Work Types */}
                        <div className="border-t border-[var(--border)] pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-[var(--muted-foreground)]" />
                              <span className="text-sm font-medium text-[var(--foreground)]">Виды работ</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => addWorkType(mIdx)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {mod.workTypes.length === 0 ? (
                            <p className="text-xs text-[var(--muted-foreground)]">Нет видов работ</p>
                          ) : (
                            <div className="space-y-2">
                              {mod.workTypes.map((wt, wtIdx) => (
                                <div key={wtIdx} className="grid grid-cols-[1fr,100px,40px] gap-2 items-end">
                                  <select
                                    value={wt.workTypeId}
                                    onChange={(e) => handleWorkTypeChange(mIdx, wtIdx, 'workTypeId', e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                  >
                                    <option value="">— Выберите —</option>
                                    {workTypesList.map((wt) => (
                                      <option key={wt.id} value={wt.id}>{wt.name}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    value={wt.estimatedHours}
                                    onChange={(e) => handleWorkTypeChange(mIdx, wtIdx, 'estimatedHours', Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    min="0.5"
                                    step="0.5"
                                    title="Часы"
                                  />
                                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeWorkType(mIdx, wtIdx)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Materials */}
                        <div className="border-t border-[var(--border)] pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">Материалы</span>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => addMaterial(mIdx)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {mod.materials.length === 0 ? (
                            <p className="text-xs text-[var(--muted-foreground)]">Нет материалов</p>
                          ) : (
                            <div className="space-y-2">
                              {mod.materials.map((mat, matIdx) => (
                                <div key={matIdx} className="grid grid-cols-[1fr,80px,60px,100px,40px] gap-2 items-end">
                                  <input
                                    type="text"
                                    value={mat.name}
                                    onChange={(e) => handleMaterialChange(mIdx, matIdx, 'name', e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    placeholder="Название материала"
                                  />
                                  <input
                                    type="number"
                                    value={mat.quantity}
                                    onChange={(e) => handleMaterialChange(mIdx, matIdx, 'quantity', Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    min="0"
                                    step="0.1"
                                  />
                                  <input
                                    type="text"
                                    value={mat.unit}
                                    onChange={(e) => handleMaterialChange(mIdx, matIdx, 'unit', e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    placeholder="шт"
                                  />
                                  <select
                                    value={mat.isPurchased ? 'true' : 'false'}
                                    onChange={(e) => handleMaterialChange(mIdx, matIdx, 'isPurchased', e.target.value === 'true')}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                  >
                                    <option value="true">Закупается</option>
                                    <option value="false">На складе</option>
                                  </select>
                                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeMaterial(mIdx, matIdx)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {modules.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <Button onClick={saveModules} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить модули'}
                </Button>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-[var(--muted-foreground)]">{label}</dt>
      <dd className="text-sm text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
