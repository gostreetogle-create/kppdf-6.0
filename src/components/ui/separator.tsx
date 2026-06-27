'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
    variant: {
      default: '',
      dashed: 'border-dashed',
      muted: 'bg-muted',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'default',
  },
});

export interface SeparatorProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation, variant, decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      {...(decorative ? { 'aria-hidden': true as const } : { role: 'separator' as const, 'aria-orientation': orientation ?? undefined as 'horizontal' | 'vertical' | undefined })}
      className={cn(separatorVariants({ orientation, variant }), className)}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';
