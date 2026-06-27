'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight, Factory, FileText, Package, Clock, DollarSign } from 'lucide-react';
import { CrudPage } from '@/components/crud-page';

function generateOrderClosingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ЗР-${year}-${rand}`;
}

interface OrderClosing {
  [key: string]: unknown;
  id: string;
  number: string;
  orderId: string;
  closingType: string;
  totalAmount: number;
  status: string;
  notes: string;
  createdAt: string;
}

interface ProductionOrderInfo {
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  tasks: { status: string }[];
}

function OrderClosingForm({ item, onClose }: { item: OrderClosing | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    orderId: item?.orderId ?? '',
    closingType: item?.closingType ?? 'full',
    totalAmount: item?.totalAmount ?? 0,
    status: item?.status ?? 'draft',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [orders, setOrders] = useState<ProductionOrderInfo[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderInfo | null>(null);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const loadOrderInfo = async (orderId: string) => {
    setAutoFillLoading(true);
    try {
      const res = await fetch(`/api/production-orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(json.data);
      }
    } catch { /* ignore */ }
    finally { setAutoFillLoading(false); }
  };

  useEffect(() => {
    if (!item && !form.number) {
      const number = generateOrderClosingNumber();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(f => f.number ? f : { ...f, number });
    }
    if (item?.orderId) {
      loadOrderInfo(item.orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const openOrderPicker = async () => {
    setShowOrderPicker(true);
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/production-orders?limit=50&sortField=createdAt&sortOrder=desc');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.items || json.data || []);
      }
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  };

  const selectOrder = (order: ProductionOrderInfo) => {
    setSelectedOrder(order);
    setForm(prev => ({
      ...prev,
      orderId: order.id,
      totalAmount: order.totalAmount || 0,
      notes: `Закрытие заказа №${order.number}`,
    }));
    setShowOrderPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/order-closings/${item.id}` : '/api/order-closings';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredOrders = orders.filter(o =>
    o.number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.title?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{item?.id ? 'Редактировать закрытие' : 'Новое закрытие заказа'}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Номер</label>
            <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Тип закрытия</label>
            <select value={form.closingType} onChange={(e) => setForm({ ...form, closingType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
              <option value="full">Полное</option>
              <option value="partial">Частичное</option>
            </select>
          </div>
        </div>

        {/* Выбор заказа */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Производственный заказ</label>
          {selectedOrder ? (
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-[var(--primary)]" />
                  <span className="font-semibold text-sm text-[var(--foreground)]">{selectedOrder.number}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{selectedOrder.title}</span>
                </div>
                <button type="button" onClick={() => { setSelectedOrder(null); setForm(f => ({ ...f, orderId: '', totalAmount: 0, notes: '' })); }}
                  className="text-xs text-[var(--muted-foreground)] hover:text-destructive transition-colors">
                  Убрать
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {selectedOrder.totalAmount?.toLocaleString('ru-RU') || 0} ₽</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(selectedOrder.plannedStart)} — {formatDate(selectedOrder.plannedEnd)}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {selectedOrder.tasks?.length || 0} задач</span>
              </div>
            </div>
          ) : (
            <button type="button" onClick={openOrderPicker}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
              <Search className="h-4 w-4" />
              Выбрать производственный заказ
            </button>
          )}
          {autoFillLoading && <div className="text-xs text-[var(--muted-foreground)] mt-1">Загрузка данных заказа...</div>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Сумма</label>
            <div className="relative">
              <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">₽</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Статус</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
              <option value="draft">Черновик</option>
              <option value="approved">Согласовано</option>
              <option value="completed">Завершено</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Примечания</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">Отмена</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>

      {/* Order picker dialog */}
      {showOrderPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowOrderPicker(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[600px] max-w-[90vw] max-h-[70vh] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Выбор производственного заказа</h3>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input type="text" id="search-zakaz-dlya-zakrytiya" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
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
                  {orderSearch ? 'Ничего не найдено' : 'Нет завершённых заказов'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filteredOrders.map((order) => (
                    <button key={order.id} type="button" onClick={() => selectOrder(order)}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--muted)]/30 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[var(--foreground)]">{order.number}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{order.title}</div>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
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
    </>
  );
}

export default function OrderClosingsPage() {
  return (
    <CrudPage<OrderClosing>
      title="Закрытия заказов"
      apiPath="/api/order-closings"
      searchId="search-zakrytiya-zakazov"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'orderId', label: 'Заказ', render: (item) => item.orderId ? item.orderId.substring(0, 8) + '...' : '—' },
        { key: 'closingType', label: 'Тип', render: (item) => item.closingType === 'full' ? 'Полное' : 'Частичное' },
        { key: 'totalAmount', label: 'Сумма', render: (item) => `${(item.totalAmount || 0).toLocaleString('ru-RU')} ₽` },
        { key: 'status', label: 'Статус' },
        { key: 'createdAt', label: 'Дата', render: (item) => new Date(item.createdAt).toLocaleDateString('ru-RU') },
      ]}
      renderForm={(item, onClose) => <OrderClosingForm item={item} onClose={onClose} />}
    />
  );
}
