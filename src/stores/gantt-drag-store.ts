import { create } from 'zustand';

/**
 * Cycle 14+ — Гантт DnD с @dnd-kit + Zustand (D-A3).
 *
 * Snapshot последнего committed drag — используется на page.tsx
 * для показа toast «Перемещено на N дн. [Отменить]» с 5-секундным окном.
 *
 * Сам timer живёт в page-level (useEffect), НЕ в store —
 * store чисто синхронный state, без side-effects.
 */
export interface GanttDragSnapshot {
  /** Unique per-drag instance (timestamp-based) — позволяет identify overrides. */
  id: string;
  itemId: string;
  type: 'order' | 'task';
  /** Dates до drag — чтобы восстановить при undo. */
  previousStartDate: string;
  previousEndDate: string;
  /** Dates после drag — уже применены в API + optimistic state. */
  newStartDate: string;
  newEndDate: string;
  /** Human-readable label, e.g. "Заказ #PO-0042: +5 дн.". */
  description: string;
  /** Timestamp when drag завершён (мс epoch) — для auto-dismiss на UI. */
  appliedAt: number;
}

interface GanttDragState {
  /** null = no undo pending. */
  lastSnapshot: GanttDragSnapshot | null;
  setSnapshot: (snap: GanttDragSnapshot | null) => void;
  /** Convenience: clear snapshot без явного null. */
  clear: () => void;
}

export const useGanttDragStore = create<GanttDragState>((set) => ({
  lastSnapshot: null,
  setSnapshot: (snap) => set({ lastSnapshot: snap }),
  clear: () => set({ lastSnapshot: null }),
}));
