'use client';

import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      required: {
        true: "after:content-['_*'] after:text-destructive after:ml-0.5",
        false: '',
      },
    },
    defaultVariants: {
      required: false,
    },
  },
);

export interface LabelProps
  extends LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ required }), className)}
      {...props}
    >
      {children}
    </label>
  ),
);
Label.displayName = 'Label';
