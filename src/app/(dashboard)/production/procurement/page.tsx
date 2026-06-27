'use client';

import { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, ShoppingCart, Warehouse } from 'lucide-react';

interface MaterialNeed {
  name: string;
  unit: string;
  totalQuantity: number;
  inStock: number;
  deficit: number;
  orders: { orderNumber: string; quantity: number; source: string }[];
}

interface MaterialRow {
  name: string;
  quantity: number;
  unit: string;
  source: string;
  inStock: number;
  deficit: number;
}

interface OrderNeed {
  orderId: string;
  orderNumber: string;
  orderTitle: string;
  materials: MaterialRow[];
}

interface ProcurementData {
  items: MaterialNeed[];
  byOrder: OrderNeed[];
  totalOrders: number;
  ordersWithNeeds: number;
  totalStockItems: number;
}

export default function ProcurementPage() {
  const [data, setData] = useState<ProcurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'aggregated' | 'byOrder'>('aggregated');
  const [creating, setCreating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/procurement-needs');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Ошибка загрузки');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const createPurchaseRequest = async (order: OrderNeed) => {
    setCreating(order.orderId);
    try {
      const res = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Закупка для ${order.orderNumber}`,
          items: order.materials
            .filter(m => m.deficit > 0)
            .map(m => ({
              name: `${m.name} (${m.source})`,
              quantity: m.deficit,
              unit: m.unit,
              unitPrice: 0,
              total: 0,
            })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Заявка ${json.data.number} создана! Учтён только дефицит (${order.materials.filter(m => m.deficit > 0).length} поз.)`);
      } else {
        alert('Ошибка: ' + (json.message || 'неизвестно'));
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setCreating(null);
    }
  };

  const deficitClass = (deficit: number) =>
    deficit > 0 ? 'text-destructive font-semibold' : 'text-success';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[var(--primary)]" />
            Снабжение
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Потребности в закупках с учётом складских остатков
          </p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* View toggle */}
      {data && (
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--muted)] w-fit">
          <button onClick={() => setView('aggregated')} className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${view === 'aggregated' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}>
            Сводка
          </button>
          <button onClick={() => setView('byOrder')} className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${view === 'byOrder' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'}`}>
            По заказам
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)]">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Empty */}
      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
          <CheckCircle className="h-12 w-12 mb-3 text-success" />
          <p className="text-lg font-medium">Нет потребностей в закупках</p>
          <p className="text-sm mt-1">Все материалы активных заказов либо не требуют закупки, либо модули не настроены</p>
        </div>
      )}

      {/* Aggregated view */}
      {data && view === 'aggregated' && data.items.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {data.items.length} позиций к закупке
            </span>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><Warehouse className="h-3 w-3" /> {data.totalStockItems} на складе</span>
              <span>{data.ordersWithNeeds} из {data.totalOrders} заказов</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Материал</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Нужно</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">На складе</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Дефицит</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Заказы</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-[var(--muted)]/20 transition-colors ${item.deficit > 0 ? 'bg-[var(--status-danger-bg)]/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.name} <span className="text-[var(--muted-foreground)] text-xs">({item.unit})</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">{item.totalQuantity.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">{item.inStock.toLocaleString('ru-RU')}</td>
                    <td className={`px-4 py-3 text-right ${deficitClass(item.deficit)}`}>
                      {item.deficit > 0 ? item.deficit.toLocaleString('ru-RU') : '✓'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.orders.map((o, oi) => (
                          <span key={oi} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--primary)]/10 text-[var(--primary)]" title={o.source}>
                            {o.orderNumber} <ArrowRight className="h-3 w-3" /> {o.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Order view */}
      {data && view === 'byOrder' && data.byOrder.length > 0 && (
        <div className="space-y-4">
          {data.byOrder.map((order) => (
            <div key={order.orderId} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20 flex items-center gap-3">
                <Package className="h-4 w-4 text-[var(--primary)]" />
                <div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{order.orderNumber}</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-2">{order.orderTitle}</span>
                </div>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">{order.materials.length} поз.</span>
                <button
                  onClick={() => createPurchaseRequest(order)}
                  disabled={creating === order.orderId}
                  className="ml-2 px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {creating === order.orderId ? '...' : '+ Заявка'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Материал</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Нужно</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Склад</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Дефицит</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">Источник</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {order.materials.map((m, mi) => (
                      <tr key={mi} className={`hover:bg-[var(--muted)]/10 transition-colors ${m.deficit > 0 ? 'bg-[var(--status-danger-bg)]/40' : ''}`}>
                        <td className="px-4 py-2 text-[var(--foreground)]">{m.name} <span className="text-[var(--muted-foreground)] text-[10px]">({m.unit})</span></td>
                        <td className="px-4 py-2 text-right font-medium text-[var(--foreground)]">{m.quantity.toLocaleString('ru-RU')}</td>
                        <td className="px-4 py-2 text-right text-[var(--muted-foreground)]">{m.inStock.toLocaleString('ru-RU')}</td>
                        <td className={`px-4 py-2 text-right ${deficitClass(m.deficit)}`}>
                          {m.deficit > 0 ? m.deficit.toLocaleString('ru-RU') : '✓'}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--muted-foreground)] max-w-[180px] truncate">{m.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      {data && data.items.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)]">
            <span className="mr-1">📋</span>
            Потребности формируются из модулей товаров, сверяются с остатками на складе.
            <span className="text-destructive"> Красным</span> — позиции с дефицитом.
            Кнопка <strong>+ Заявка</strong> создаёт заявку только на дефицитные позиции.
          </p>
        </div>
      )}
    </div>
  );
}
