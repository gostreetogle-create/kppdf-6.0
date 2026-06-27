'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Factory,
  FileText,
  Calendar,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Layers,
  Clock,
  User as UserIcon,
  Wrench,
  Palette as PaletteIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GanttChart, type GanttItem } from '@/components/ui/gantt-chart';
import { ORDER_STATUS, TASK_STATUS, StatusBadge } from '@/lib/constants/statuses';
import { RalBadge } from '@/components/ui/ral-selector';

// ========================================
// Types
// ========================================

interface ProductionOrder {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: number;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  ralCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  workType?: { id: string; name: string } | null;
  workCenter?: { id: string; name: string } | null;
  contract?: { id: string; number: string; title: string } | null;
  proposal?: { id: string; number: string; title: string } | null;
  tasks: OrderTask[];
}

interface OrderTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  estimatedHours?: number | null;
  actualHours?: number | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  sortOrder: number;
  workType?: { id: string; name: string } | null;
  workCenter?: { id: string; name: string } | null;
  worker?: { id: string; firstName: string; lastName: string } | null;
}

// ========================================
// Status maps — must match API PATCH /status VALID_TRANSITIONS
// ========================================



// MUST mirror API src/app/api/production-orders/[id]/status/route.ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['manufacturing', 'painting', 'completed', 'cancelled'],
  manufacturing: ['painting', 'completed', 'cancelled'],
  painting: ['shipping', 'completed', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['planned'],
};

// ========================================
// Helpers
// ========================================

const MS_IN_DAY = 86400000;

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU');
}

function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtHours(h?: number | null): string {
  if (h == null) return '—';
  return `${h} ч`;
}



function PriorityBadge({ p }: { p: number }) {
  if (p <= 0) return <span className="text-xs text-[var(--muted-foreground)]">обычный</span>;
  const colors = [
    'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
    'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
    'bg-[var(--status-orange-bg)] text-[var(--status-orange-text)]',
    'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
  ];
  const cls = colors[Math.min(p - 1, colors.length - 1)] ?? colors[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      приоритет {p}
    </span>
  );
}

// ========================================
// Page component
// ========================================

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/production-orders/${params.id}`);
        if (!cancelled && res.ok) {
          const json = await res.json();
          setOrder(json.data ?? json);
        }
      } catch (err) {
        console.error('Fetch production order error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (params.id) load();
    return () => { cancelled = true; };
  }, [params.id]);

  const validNextStatuses = useMemo(() => {
    if (!order) return [];
    return VALID_TRANSITIONS[order.status] ?? [];
  }, [order]);

  const ganttItems: GanttItem[] = useMemo(() => {
    if (!order) return [];
    const orderStart = order.plannedStart ?? order.createdAt;
    const orderEnd = order.plannedEnd ?? new Date(new Date(order.createdAt).getTime() + 7 * MS_IN_DAY).toISOString();
    const orderTitle = `${order.number} · ${order.title}`;

    const items: GanttItem[] = [
      {
        id: order.id,
        type: 'order',
        title: orderTitle,
        startDate: orderStart,
        endDate: orderEnd,
        actualStart: order.actualStart ?? undefined,
        actualEnd: order.actualEnd ?? undefined,
        status: order.status,
        priority: order.priority,
        workType: order.workType?.name,
        workCenter: order.workCenter?.name,
      },
    ];

    for (const task of order.tasks) {
      items.push({
        id: task.id,
        type: 'task',
        title: task.title,
        startDate: task.plannedStart ?? orderStart,
        endDate: task.plannedEnd ?? orderEnd,
        actualStart: task.actualStart ?? undefined,
        actualEnd: task.actualEnd ?? undefined,
        status: task.status,
        group: `${order.number} — задачи`,
        assignee: task.worker ? `${task.worker.lastName} ${task.worker.firstName}` : undefined,
        workType: task.workType?.name,
        workCenter: task.workCenter?.name,
      });
    }
    return items;
  }, [order]);

  const taskStats = useMemo(() => {
    if (!order || order.tasks.length === 0) return null;
    const total = order.tasks.length;
    const done = order.tasks.filter((t) => t.status === 'completed').length;
    const inProgress = order.tasks.filter((t) => t.status === 'in_progress').length;
    const blocked = order.tasks.filter((t) => t.status === 'blocked').length;
    const estHours = order.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
    const actHours = order.tasks.reduce((sum, t) => sum + (t.actualHours ?? 0), 0);
    return { total, done, inProgress, blocked, estHours, actHours, percent: Math.round((done / total) * 100) };
  }, [order]);

  async function changeStatus(next: string) {
    if (!order) return;
    setStatusUpdating(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/production-orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMessage({ type: 'error', text: json.message ?? json.error ?? 'Ошибка смены статуса' });
      } else {
        // Обновляем локально (без полного refetch)
        setOrder((prev) => prev ? { ...prev, status: next } : prev);
        setStatusMessage({ type: 'success', text: json.message ?? `Статус изменён на «${ORDER_STATUS[next]?.label ?? next}»` });
        setShowStatusModal(false);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-[var(--muted-foreground)]">Производственный заказ не найден</p>
        <Button variant="outline" onClick={() => router.push('/production')}>
          <ArrowLeft className="h-4 w-4" /> К списку заказов
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/production')} title="К списку">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">{order.title}</h1>
              <PriorityBadge p={order.priority} />
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              № <span className="font-mono">{order.number}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={order.status} map={ORDER_STATUS} />
          <Button
            variant="outline"
            size="sm"
            disabled={validNextStatuses.length === 0}
            onClick={() => setShowStatusModal(true)}
            title={validNextStatuses.length === 0 ? 'Нет доступных переходов' : 'Изменить статус'}
          >
            Изменить статус
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/production?edit=${order.id}`)} title="Редактировать">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status toast */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-[var(--status-success-bg)] border-[var(--status-success-text)] text-[var(--status-success-text)]'
              : 'bg-[var(--status-danger-bg)] border-[var(--status-danger-text)] text-[var(--status-danger-text)]'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="flex-1">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Source banner */}
      {(order.contract || order.proposal) && (() => {
        const contract = order.contract ?? null;
        const proposal = order.proposal ?? null;
        const sourceHref = contract ? `/contracts/${contract.id}` : proposal ? `/proposals/${proposal.id}` : null;
        return (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]">
            {contract ? (
              <>
                <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span className="text-sm">Создан из договора</span>
                <button
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                  className="font-mono text-sm text-[var(--primary)] hover:underline"
                >
                  №{contract.number}
                </button>
                <span className="text-sm text-[var(--muted-foreground)] truncate">{contract.title}</span>
              </>
            ) : (
              proposal && (
                <>
                  <Factory className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <span className="text-sm">Создан из КП</span>
                  <button
                    onClick={() => router.push(`/proposals/${proposal.id}`)}
                    className="font-mono text-sm text-[var(--primary)] hover:underline"
                  >
                    №{proposal.number}
                  </button>
                  <span className="text-sm text-[var(--muted-foreground)] truncate">{proposal.title}</span>
                </>
              )
            )}
            {sourceHref && (
              <button
                onClick={() => router.push(sourceHref)}
                className="ml-auto text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                title="Открыть"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })()}

      {/* Info card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Информация</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
          <InfoField icon={<Wrench className="h-3.5 w-3.5" />} label="Тип работы" value={order.workType?.name ?? '—'} />
          <InfoField icon={<Layers className="h-3.5 w-3.5" />} label="Рабочий центр" value={order.workCenter?.name ?? '—'} />
          <InfoField icon={<Calendar className="h-3.5 w-3.5" />} label="План. начало" value={fmtDateTime(order.plannedStart)} />
          <InfoField icon={<Calendar className="h-3.5 w-3.5" />} label="План. окончание" value={fmtDateTime(order.plannedEnd)} />
          <InfoField icon={<Clock className="h-3.5 w-3.5" />} label="Факт. начало" value={fmtDateTime(order.actualStart)} />
          <InfoField icon={<Clock className="h-3.5 w-3.5" />} label="Факт. окончание" value={fmtDateTime(order.actualEnd)} />
          {order.ralCode && (
            <InfoField icon={<PaletteIcon className="h-3.5 w-3.5" />} label="RAL покраска" value={<RalBadge code={order.ralCode} />} />
          )}
          <InfoField icon={<Calendar className="h-3.5 w-3.5" />} label="Создан" value={fmtDateTime(order.createdAt)} />
          <InfoField icon={<Calendar className="h-3.5 w-3.5" />} label="Обновлён" value={fmtDateTime(order.updatedAt)} />
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Примечания</p>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Tasks stats + Gantt-mini */}
      {taskStats && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[var(--muted-foreground)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Задачи и сроки</h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {taskStats.done} / {taskStats.total} ({taskStats.percent}%)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {taskStats.inProgress > 0 && (
                <span className="px-2 py-0.5 rounded bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] font-semibold">{taskStats.inProgress} в работе</span>
              )}
              {taskStats.blocked > 0 && (
                <span className="px-2 py-0.5 rounded bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] font-semibold">{taskStats.blocked} блок</span>
              )}
              <span className="text-[var(--muted-foreground)]">План: {fmtHours(taskStats.estHours)} · Факт: {fmtHours(taskStats.actHours)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pt-4">
            <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--status-success-solid)] transition-all"
                style={{ width: `${taskStats.percent}%` }}
              />
            </div>
          </div>

          {/* Gantt mini (view-only) */}
          <div className="p-5">
            <GanttChart items={ganttItems} onItemUpdate={undefined} />
          </div>
        </div>
      )}

      {/* No tasks warning */}
      {order.tasks.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 text-sm text-[var(--muted-foreground)] flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          У заказа пока нет задач. Задачи создаются автоматически при конвертации из КП/договора с модульной структурой.
        </div>
      )}

      {/* Tasks table */}
      {order.tasks.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Задачи ({order.tasks.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">№</th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">Название</th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">Статус</th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">Тип</th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">Исполнитель</th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">План</th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">План ч.</th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase font-semibold text-[var(--muted-foreground)] tracking-wider">Факт ч.</th>
                </tr>
              </thead>
              <tbody>
                {order.tasks.map((task, i) => (
                  <tr key={task.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-4 py-2.5 text-[var(--muted-foreground)] font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{task.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={task.status} map={TASK_STATUS} /></td>
                    <td className="px-4 py-2.5 text-xs text-[var(--muted-foreground)]">{task.workType?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {task.worker ? (
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3 text-[var(--muted-foreground)]" />
                          {task.worker.lastName} {task.worker.firstName}
                        </span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">не назначен</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                      <div>{fmtDate(task.plannedStart)}</div>
                      <div className="text-[var(--muted-foreground)]">{fmtDate(task.plannedEnd)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{fmtHours(task.estimatedHours)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{fmtHours(task.actualHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {showStatusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center glass-overlay"
          onClick={() => !statusUpdating && setShowStatusModal(false)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-md mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-1">Изменить статус заказа</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Текущий: <StatusBadge status={order.status} map={ORDER_STATUS} />
            </p>
            {validNextStatuses.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4">
                Из этого статуса нет доступных переходов. Заказ завершён.
              </p>
            ) : (
              <div className="space-y-2">
                {validNextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={statusUpdating}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-all disabled:opacity-50 text-left"
                  >
                    <StatusBadge status={s} map={ORDER_STATUS} />
                    {statusUpdating && <span className="text-xs text-[var(--muted-foreground)]">обновление...</span>}
                  </button>
                ))}
              </div>
            )}
            {statusUpdating && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                Отправка запроса...
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setShowStatusModal(false)} disabled={statusUpdating}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// Small UI bits
// ========================================

function InfoField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-[var(--foreground)] truncate">{value}</p>
    </div>
  );
}
