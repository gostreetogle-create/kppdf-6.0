'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const sheetVariants = cva(
  'fixed z-[--z-modal] gap-4 glass-surface p-6 shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=closed]:translate-x-full data-[state=open]:translate-x-0',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

const overlayStyles = 'fixed inset-0 z-[--z-modal] glass-overlay';

interface SheetProps extends VariantProps<typeof sheetVariants> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Sheet({ open, onClose, children, side = 'right', className, closeOnBackdrop = true }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
      }, 300);
      document.body.style.overflow = '';
      return () => clearTimeout(t);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={cn(overlayStyles, 'transition-opacity duration-300', visible ? 'opacity-100' : 'opacity-0')}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        data-state={visible ? 'open' : 'closed'}
        className={cn(sheetVariants({ side }), className)}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}
