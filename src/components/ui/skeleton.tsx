import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva('animate-pulse rounded-md bg-muted', {
  variants: {
    shape: {
      rectangle: '',
      circle: 'rounded-full',
      text: 'h-4 w-full rounded-md',
      'text-sm': 'h-3 w-full rounded-md',
      'text-lg': 'h-5 w-full rounded-md',
      button: 'h-10 rounded-md',
      card: 'h-32 rounded-lg',
    },
  },
  defaultVariants: {
    shape: 'rectangle',
  },
});

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  count?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape, count = 1, className, ...props }, ref) => {
    const elements = Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        ref={i === 0 ? ref : undefined}
        className={cn(skeletonVariants({ shape }), count > 1 && 'mb-2 last:mb-0', className)}
        aria-hidden="true"
        {...props}
      />
    ));

    return <>{elements}</>;
  },
);
Skeleton.displayName = 'Skeleton';
