/* eslint-disable react-hooks/set-state-in-effect -- mounted-gate pattern (setMounted inside useEffect) is the canonical SSR-safe hydration idiom; aria-hidden placeholder prevents CLS during the 1-frame swap to <Group>. Matches activity-log.tsx convention. */

'use client';

/**
 * src/components/proposal-editor/resizable-editor-layout.tsx
 *
 * Cycles 46+47 (B.4 — ProposalEditor 3-panel UX).
 *
 * 3 horizontal resizable panels split via `react-resizable-panels@4.x`:
 *   - Panel 1 (left, default 30%)    — <ProductsPanel>     (ProductSelector + EditorCart)
 *   - Panel 2 (middle, default 45%)  — <PreviewPanel>    (PreviewArea / A4 canvas)
 *   - Panel 3 (right, default 25%)   — <ConfigPanelWrap>  (ConfigPanel: org/client/template/discount/RAL)
 *
 * Features:
 *   - useDefaultLayout hook — layouts persist automatically to localStorage under
 *     `kppdf-editor-v1` key. Each panel has stable `id` so saves survive component
 *     re-renders + reloads.
 *   - matchMedia breakpoint: width < 768 px → vertical orientation (mobile fallback).
 *     EditorCart pinned at bottom of stacked column for thumb-friendly cart access.
 *   - minSize/maxSize constraints enforce usable ranges (prevent collapse).
 *   - Custom Separator styling: 1px → 4px on hover/active, accent color.
 *   - Tier D mutation: free to evolve further without ADR.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';

const HORIZONTAL_BREAKPOINT = 768; // md breakpoint; vertical below

function useViewportNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${HORIZONTAL_BREAKPOINT - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    setNarrow(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);
  return narrow;
}

interface ResizableEditorLayoutProps {
  productsPanel: ReactNode;
  previewPanel: ReactNode;
  configPanel: ReactNode;
}

export function ResizableEditorLayout({
  productsPanel,
  previewPanel,
  configPanel,
}: ResizableEditorLayoutProps) {
  const narrow = useViewportNarrow();

  // Cycle 47 (round-2 fix): SSR hydration flash mitigation.
  // useDefaultLayout reads localStorage on mount → its `defaultLayout` returns
  // undefined initially (SSR + 1st render), then changes after mount. Rendering
  // `<Group>` only after a `mounted` gate ensures the server output matches the
  // first client render, eliminating hydration mismatch warnings + visible resize
  // flicker. Trade-off: 1-frame render delay after mount (acceptable for editor UX).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persistence IDs are stable across orientation change. When orientation flips
  // horizontal↔vertical, layouts differ in shape — but localStorage cache is
  // overwritten on first user resize in the new orientation.
  const horizontal = useDefaultLayout({
    id: 'kppdf-editor-horizontal-v1',
    panelIds: ['products', 'preview', 'config'],
  });
  const vertical = useDefaultLayout({
    id: 'kppdf-editor-vertical-v1',
    panelIds: ['products', 'preview', 'config'],
  });

  const orientation = narrow ? 'vertical' : 'horizontal';
  const persisted = narrow ? vertical : horizontal;
  const sepAxis = narrow ? 'horizontal' : 'vertical';

  // Pre-mount placeholder keeps layout height stable to avoid CLS while Group
  // is hydrating from localStorage.
  if (!mounted) {
    return (
      <div
        className="flex-1 flex overflow-hidden"
        aria-hidden="true"
        data-placeholder="kppdf-editor"
      />
    );
  }

  return (
    <Group
      orientation={orientation}
      className="flex-1 flex overflow-hidden"
      defaultLayout={persisted.defaultLayout}
      onLayoutChanged={persisted.onLayoutChanged}
    >
      <ProductsSlot orientation={sepAxis}>{productsPanel}</ProductsSlot>
      <ResizeSeparator orientation={sepAxis} id="sep:products-preview" />
      <PreviewSlot>{previewPanel}</PreviewSlot>
      <ResizeSeparator orientation={sepAxis} id="sep:preview-config" />
      <ConfigSlot orientation={sepAxis}>{configPanel}</ConfigSlot>
    </Group>
  );
}

// =========================================
// Slot wrappers — apply Panel constraints per orientation
// =========================================

interface SlotProps {
  children: ReactNode;
  /** 'vertical' means the separator axis is vertical, i.e. panels are horizontal.
   *  'horizontal' means the separator axis is horizontal, i.e. panels are vertical (mobile). */
  orientation: 'horizontal' | 'vertical';
}

function ProductsSlot({ children, orientation }: SlotProps) {
  // Cycle 47 (round-3 fix): border-r only meaningful in horizontal layout
  // (panels stacked left-to-right → right edge of products touches separator).
  // In vertical (mobile fallback) → products is TOP panel → border-r would show
  // as right-side wall, not as inner separator. Drop border in vertical mode.
  // orientation='vertical' = desktop (panels horizontal layout) → keep border.
  // orientation='horizontal' = mobile stacked → drop border.
  const borderClass = orientation === 'vertical' ? 'border-r border-[var(--border)]' : '';
  return (
    <Panel
      id="products"
      defaultSize={30}
      minSize={22}
      maxSize={55}
      className={`flex flex-col overflow-hidden ${borderClass} bg-[var(--card)]`}
    >
      {children}
    </Panel>
  );
}

function PreviewSlot({ children }: { children: ReactNode }) {
  return (
    <Panel
      id="preview"
      defaultSize={45}
      minSize={30}
      maxSize={70}
      className="flex flex-col overflow-hidden bg-[var(--muted)]/30"
    >
      {children}
    </Panel>
  );
}

function ConfigSlot({ children, orientation }: SlotProps) {
  // Cycle 47 (round-3 fix): border-l only meaningful in horizontal layout.
  // orientation='vertical' = desktop → keep border (inner edge touches separator).
  // orientation='horizontal' = mobile stacked → drop border.
  // Cycle 47 polish: minSize raised 18 → 22 — at 18% on a 1680px viewport
  // the 2-col grid (org/client + template/discount + RAL row) read cramped.
  const borderClass = orientation === 'vertical' ? 'border-l border-[var(--border)]' : '';
  return (
    <Panel
      id="config"
      defaultSize={25}
      minSize={22}
      maxSize={40}
      className={`flex flex-col overflow-hidden ${borderClass} bg-[var(--card)]`}
    >
      {children}
    </Panel>
  );
}

// =========================================
// Resize separator (cross-orientation aware)
// =========================================

interface ResizeSeparatorProps {
  orientation: 'horizontal' | 'vertical';
  id: string;
}

function ResizeSeparator({ orientation, id }: ResizeSeparatorProps) {
  // Cycle 47 (round-2 fix): v4.11.2 of `react-resizable-panels` does NOT
  // expose drag-state data attributes to the DOM (only `data-disabled`).
  // Confirmed by grep of node_modules lib source — drag state is an internal
  // state machine ("inactive" | "hover" | "active") that does NOT bleed to DOM.
  // Drop `data-[resize-handle-state=drag]` and `group-data-[...]` variants;
  // rely on CSS `:hover` only (Tailwind `group-hover:`). drag visual feedback
  // comes from the pointer cursor change + active separator color via Tailwind
  // hover selectors on the Separator itself.
  const isHorizontalPanel = orientation === 'horizontal'; // separator axis = vertical → panels horizontal layout
  return (
    <Separator
      id={id}
      className={
        isHorizontalPanel
          ? 'group relative w-px bg-[var(--border)] hover:w-0.5 hover:bg-[var(--primary)] ' +
            'transition-all duration-150 ease-out'
          : 'group relative h-px bg-[var(--border)] hover:h-0.5 hover:bg-[var(--primary)] ' +
            'transition-all duration-150 ease-out'
      }
    >
      <div
        className={
          isHorizontalPanel
            ? 'absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 ' +
              'group-hover:opacity-100 transition-opacity'
            : 'absolute inset-x-0 -top-1 -bottom-1 flex items-center justify-center opacity-0 ' +
              'group-hover:opacity-100 transition-opacity'
        }
      >
        <div
          className={
            isHorizontalPanel
              ? 'h-6 w-3 rounded-full bg-[var(--primary)]/20 flex items-center justify-center'
              : 'w-6 h-3 rounded-full bg-[var(--primary)]/20 flex items-center justify-center'
          }
        >
          <GripVertical
            className={
              isHorizontalPanel
                ? 'h-3 w-1.5 text-[var(--primary)]'
                : 'h-1.5 w-3 text-[var(--primary)] rotate-90'
            }
          />
        </div>
      </div>
    </Separator>
  );
}
