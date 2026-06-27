/* eslint-disable react-hooks/set-state-in-effect -- data-fetching effect: setLoading/setError resets before each fetch is canonical React pattern (see admin/users/page.tsx) */

'use client';

/**
 * src/components/activity-log.tsx (Cycle 57 / B.7 — UserActivity UI)
 *
 * Timeline-style component displaying activity events for entity+entityId.
 * Fetches from `/api/activity-log` with pagination (25 events/page).
 *
 * Component shape:
 *   - Header с общим count.
 *   - List of events: user badge + action name + createdAt + JSON details preview.
 *   - Pagination controls (← → buttons).
 *
 * Drop-in: <ActivityLog entity="proposal" entityId={proposal.id} />.
 */

import { useEffect, useState } from 'react';
import { Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityEvent {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

interface ActivityLogProps {
  entity: string;
  entityId: string;
  pageSize?: number;
}

export function ActivityLog({ entity, entityId, pageSize = 25 }: ActivityLogProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/activity-log?entity=${encodeURIComponent(entity)}&entityId=${encodeURIComponent(entityId)}&page=${page}&limit=${pageSize}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) {
          setError(data.message || 'Ошибка загрузки');
          return;
        }
        setEvents(data.data.items);
        setTotal(data.data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entity, entityId, page, pageSize]);

  const parseDetails = (json: string | null): Record<string, unknown> | null => {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        История ({total})
      </h2>

      {loading ? (
        <div className="text-sm text-[var(--muted-foreground)] py-2">Загрузка...</div>
      ) : error ? (
        <div className="text-sm text-[var(--destructive)] py-2">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-[var(--muted-foreground)] py-2">Нет событий для этой сущности.</div>
      ) : (
        <>
          <div className="space-y-3">
            {events.map((event) => {
              const details = parseDetails(event.details);
              return (
                <div
                  key={event.id}
                  className="flex gap-3 pb-3 border-b border-[var(--border)] last:border-0"
                >
                  <div className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {event.userName || event.userId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {event.action}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                        {new Date(event.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    {details && Object.keys(details).length > 0 && (
                      <pre className="text-[10px] text-[var(--muted-foreground)] mt-1 overflow-x-auto p-2 rounded bg-[var(--muted)]/40">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-sm">
              <button
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Назад
              </button>
              <span className="text-[var(--muted-foreground)]">
                {page} / {totalPages}
              </span>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-40 flex items-center gap-1"
              >
                Вперёд
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
