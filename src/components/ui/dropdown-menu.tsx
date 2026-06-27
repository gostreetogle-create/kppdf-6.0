'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  isGroupLabel?: boolean;
  shortcut?: string;
}

interface DropdownMenuGroup {
  label?: string;
  items: DropdownMenuItem[];
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items?: DropdownMenuItem[];
  groups?: DropdownMenuGroup[];
  align?: 'start' | 'center' | 'end';
  side?: 'bottom' | 'top';
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  groups,
  align = 'end',
  side = 'bottom',
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allItems: DropdownMenuItem[] = groups
    ? groups.flatMap((g) => [
        ...(g.label ? [{ label: g.label, divider: false as const, isGroupLabel: true as const }] : []),
        ...g.items,
      ])
    : items || [];

  const flatItems = allItems.filter((item) => !item.divider && !item.isGroupLabel);

  const handleClose = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        flatItems[activeIndex]?.onClick?.();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, activeIndex, flatItems, handleClose]);

  const alignStyles = { start: 'left-0', center: 'left-1/2 -translate-x-1/2', end: 'right-0' };
  const sideStyles = { bottom: 'top-full mt-1', top: 'bottom-full mb-1' };

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-[--z-dropdown] min-w-[12rem] overflow-hidden rounded-md border glass-surface-soft py-1 shadow-md animate-scale-in',
            alignStyles[align],
            sideStyles[side],
            className,
          )}
        >
          {groups
            ? groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.label}</div>
                  )}
                  {group.items.map((item, ii) => {
                    const globalIndex = allItems.indexOf(item);
                    if ('divider' in item && item.divider) {
                      return <div key={ii} className="my-1 h-px bg-border" />;
                    }
                    return (
                      <button
                        key={ii}
                        onClick={() => { item.onClick?.(); handleClose(); }}
                        disabled={item.disabled}
                        className={cn(
                          'relative flex w-full cursor-default select-none items-center gap-2 px-3 py-2 text-sm outline-none transition-colors',
                          'hover:bg-muted focus:bg-muted',
                          'disabled:pointer-events-none disabled:opacity-50',
                          item.destructive ? 'text-destructive' : 'text-foreground',
                          activeIndex === globalIndex && 'bg-muted',
                        )}
                      >
                        {item.icon && <span className="shrink-0">{item.icon}</span>}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <span className="ml-auto text-xs tracking-widest text-muted-foreground">{item.shortcut}</span>
                        )}
                      </button>
                    );
                  })}
                  {gi < groups.length - 1 && <div className="my-1 h-px bg-border" />}
                </div>
              ))
            : (items || []).map((item, i) => {
                if (item.divider) return <div key={i} className="my-1 h-px bg-border" />;
                return (
                  <button
                    key={i}
                    onClick={() => { item.onClick?.(); handleClose(); }}
                    disabled={item.disabled}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center gap-2 px-3 py-2 text-sm outline-none transition-colors',
                      'hover:bg-muted focus:bg-muted',
                      'disabled:pointer-events-none disabled:opacity-50',
                      item.destructive ? 'text-destructive' : 'text-foreground',
                      activeIndex === i && 'bg-muted',
                    )}
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <span className="ml-auto text-xs tracking-widest text-muted-foreground">{item.shortcut}</span>
                    )}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}
