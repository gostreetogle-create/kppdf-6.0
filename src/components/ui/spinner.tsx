'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-current',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface SpinnerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size, variant, className, ...props }, ref) => (
    <div ref={ref} role="status" className={cn(spinnerVariants({ size, variant }), className)} {...props}>
      <Loader2 className="h-full w-full" />
      <span className="sr-only">Загрузка...</span>
    </div>
  ),
);
Spinner.displayName = 'Spinner';
