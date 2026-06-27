'use client';

import { forwardRef, useEffect, useCallback, useState, type ReactNode, type HTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dialogContentVariants = cva(
  'relative z-50 w-full rounded-lg border glass-surface p-6 shadow-xl animate-scale-in max-h-[85vh] overflow-y-auto',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[calc(100vw-2rem)]',
      },
    },
    defaultVariants: {
      size: 'lg',
    },
  },
);

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: VariantProps<typeof dialogContentVariants>['size'];
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

export function Dialog({
  open,
  onClose,
  children,
  className,
  size,
  closeOnEscape = true,
  closeOnBackdrop = true,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const t = setTimeout(() => setMounted(false), 200);
      document.body.style.overflow = '';
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose();
    },
    [onClose, closeOnEscape],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  if (!mounted) return null;

  return (
    <div
      data-open={open}
      className={cn(
        'fixed inset-0 z-[--z-modal]',
        open ? 'animate-fade-in' : 'animate-fade-out',
      )}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 glass-overlay animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className={cn(dialogContentVariants({ size }), className)}
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
      </div>
    </div>
  );
}

// ─── Dialog Sub-components ──────────────────────────────────

export const DialogHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4 space-y-1.5', className)} {...props} />
  ),
);
DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
DialogDescription.displayName = 'DialogDescription';

export const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)} {...props} />
  ),
);
DialogFooter.displayName = 'DialogFooter';
