'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Factory,
  Camera,
  X,
  Check,
  AlertCircle,
  Upload,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { StatusBadge, SHIPPING_STATUS } from '@/lib/constants/statuses';

// ========================================
// Types
// ========================================

interface ShipmentItem {
  name: string;
  quantity: number;
  unit: string;
  shipped: number;
}

interface ShipmentPhoto {
  url: string;
  caption?: string;
}

interface Shipment {
  id: string;
  number: string;
  orderId: string | null;
  status: string;
  items: ShipmentItem[];
  photos: ShipmentPhoto[];
  notes: string | null;
  createdAt: string;
}

interface ProductionOrder {
  id: string;
  number: string;
  title: string;
  status: string;
  tasks: { id: string; title: string; status: string }[];
}

// ========================================
// Helpers
// ========================================

function generateNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ОТГ-${year}-${rand}`;
}

// ========================================
// Main Page Component
// ========================================

export default function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formNumber, setFormNumber] = useState('');
  const [formOrderId, setFormOrderId] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [formItems, setFormItems] = useState<ShipmentItem[]>([]);
  const [formPhotos, setFormPhotos] = useState<ShipmentPhoto[]>([]);
  const [formNotes, setFormNotes] = useState('');

  // Order picker
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Upload
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/shipments?${params}`);
      const json = await res.json();
      if (json.success) setShipments(json.data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormNumber(generateNumber());
    setFormOrderId('');
    setFormStatus('draft');
    setFormItems([]);
    setFormPhotos([]);
    setFormNotes('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (s: Shipment) => {
    setEditing(s);
    setFormNumber(s.number);
    setFormOrderId(s.orderId || '');
    setFormStatus(s.status);
    setFormItems(s.items || []);
    setFormPhotos(s.photos || []);
    setFormNotes(s.notes || '');
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/shipments/${editing.id}` : '/api/shipments';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formNumber,
          orderId: formOrderId || undefined,
          status: formStatus,
          items: formItems,
          photos: formPhotos,
          notes: formNotes || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.message); return; }
      setShowForm(false);
      load();
    } catch {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  // Order picker
  const openOrderPicker = async () => {
    setShowOrderPicker(true);
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/production-orders?limit=50');
      const json = await res.json();
      if (json.success) setOrders(json.data.items || []);
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  };

  const selectOrder = async (order: ProductionOrder) => {
    setFormOrderId(order.id);
    setShowOrderPicker(false);

    // Собираем товары из заказа для создания списка отгрузки
    // Используем название заказа как товар по умолчанию
    const defaultItems: ShipmentItem[] = [
      { name: order.title || order.number, quantity: 1, unit: 'шт', shipped: 0 },
    ];

    // Если есть задачи — добавляем их как позиции
    if (order.tasks?.length > 0) {
      order.tasks.forEach((t) => {
        if (!defaultItems.find((i) => i.name === t.title)) {
          defaultItems.push({ name: t.title, quantity: 1, unit: 'шт', shipped: 0 });
        }
      });
    }

    setFormItems(defaultItems);
    setFormStatus('draft');
    setFormNotes(`Отгрузка по заказу №${order.number}`);
  };

  const updateItemShipment = (idx: number, shipped: number) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], shipped: Math.max(0, Math.min(shipped, updated[idx].quantity)) };
    setFormItems(updated);

    // Авто-определение статуса
    const totalShipped = updated.reduce((s, i) => s + i.shipped, 0);
    const totalQty = updated.reduce((s, i) => s + i.quantity, 0);
    if (totalShipped === 0) setFormStatus('draft');
    else if (totalShipped >= totalQty) setFormStatus('shipped');
    else setFormStatus('partially');
  };

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setFormPhotos([...formPhotos, { url: json.data.url, caption: '' }]);
      }
    } catch { /* ignore */ }
    finally { setUploading(false); }
  };

  const removePhoto = (idx: number) => {
    setFormPhotos(formPhotos.filter((_, i) => i !== idx));
  };

  const filteredOrders = orders.filter((o) =>
    !orderSearch || o.number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.title?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Truck className="h-6 w-6 text-[var(--primary)]" />
            Отгрузка товаров
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Акт приёма-передачи · частичная отгрузка · фотофиксация
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all shadow-sm">
          <Plus className="h-4 w-4" />
          Новая отгрузка
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <input type="text" id="search-otgruzki" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру или примечаниям..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
          <Truck className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">Нет отгрузок</p>
          <p className="text-sm mt-1">Создайте первую отгрузку из производственного заказа</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div key={s.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={s.status} map={SHIPPING_STATUS} />
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">{s.number}</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {s.notes || `Отгрузка №${s.number}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                    <span>{formatDate(s.createdAt)}</span>
                    <span>{s.items?.length || 0} позиций</span>
                    {s.photos?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" /> {s.photos.length}
                      </span>
                    )}
                    {s.items && (
                      <span className="font-medium">
                        Отгружено: {s.items.reduce((sum, i) => sum + (i.shipped || 0), 0)} / {s.items.reduce((sum, i) => sum + (i.quantity || 0), 0)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => openEdit(s)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)] transition-all shrink-0">
                  Открыть
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shipment Form Dialog */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => !saving && setShowForm(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px] max-w-[90vw] bg-[var(--card)] border-l border-[var(--border)] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {editing ? 'Редактировать отгрузку' : 'Новая отгрузка'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
                <X size={18} className="text-[var(--muted-foreground)]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)] text-sm text-[var(--status-danger-text)]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Номер</label>
                  <input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    readOnly={!!editing} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Статус</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
                    <option value="draft">Черновик</option>
                    <option value="partially">Частично</option>
                    <option value="shipped">Отгружено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>
              </div>

              {/* Order Selection */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Производственный заказ</label>
                {formOrderId ? (
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 flex items-center gap-2">
                    <Factory className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">
                      Заказ #{formOrderId.substring(0, 8)}...
                    </span>
                    <button type="button" onClick={() => { setFormOrderId(''); setFormItems([]); }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-destructive transition-colors shrink-0">
                      Убрать
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={openOrderPicker}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    <FileText className="h-4 w-4" />
                    Выбрать заказ для отгрузки
                  </button>
                )}
              </div>

              {/* Items table */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-2">Позиции к отгрузке</label>
                {formItems.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] py-2">
                    Выберите заказ — позиции заполнятся автоматически
                  </p>
                ) : (
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                          <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">Наименование</th>
                          <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">Всего</th>
                          <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">Ед.</th>
                          <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase">Отгружено</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {formItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--muted)]/20 transition-colors">
                            <td className="px-3 py-2 text-[var(--foreground)] font-medium text-xs">{item.name}</td>
                            <td className="px-3 py-2 text-right text-[var(--foreground)] text-xs">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-[var(--muted-foreground)] text-xs">{item.unit}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={item.shipped}
                                onChange={(e) => updateItemShipment(idx, Number(e.target.value))}
                                min={0}
                                max={item.quantity}
                                className="w-16 px-2 py-1 rounded border border-[var(--input)] bg-[var(--background)] text-xs text-right focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-2">
                  Фото отгружаемого товара
                </label>
                {formPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formPhotos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt={photo.caption || 'Фото'}
                          className="w-20 h-20 object-contain rounded-lg border border-[var(--border)] bg-[var(--muted)]/20" />
                        <button type="button" onClick={() => removePhoto(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--status-danger-solid)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all cursor-pointer">
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Загрузка...' : 'Добавить фото'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">Примечания</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                  placeholder="Информация об отгрузке..." />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Check className="h-4 w-4" />}
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Order picker dialog */}
      {showOrderPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowOrderPicker(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[500px] max-w-[90vw] max-h-[70vh] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Выбор заказа для отгрузки</h3>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input type="text" id="search-zakaz-dlya-otgruzki" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Поиск по номеру или названию..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted-foreground)] text-sm">
                  {orderSearch ? 'Ничего не найдено' : 'Нет доступных заказов'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filteredOrders.map((order) => (
                    <button key={order.id} type="button" onClick={() => selectOrder(order)}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--muted)]/30 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <Factory className="h-4 w-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[var(--foreground)]">{order.number}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{order.title}</div>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] shrink-0">
                        {order.tasks?.length || 0} задач
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
