import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Container ───────────────────────────────────────────────
const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-screen-2xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

interface ContainerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {
  as?: 'div' | 'section' | 'main' | 'article';
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, className, as: Comp = 'div', ...props }, ref) => (
    <Comp ref={ref as never} className={cn(containerVariants({ size }), 'px-4 sm:px-6 lg:px-8', className)} {...props} />
  ),
);
Container.displayName = 'Container';

// ─── Flex ────────────────────────────────────────────────────
const flexVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    },
  },
  defaultVariants: {
    direction: 'row',
    align: 'center',
    gap: 'md',
  },
});

interface FlexProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof flexVariants> {}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ direction, align, justify, wrap, gap, className, ...props }, ref) => (
    <div ref={ref} className={cn(flexVariants({ direction, align, justify, wrap, gap }), className)} {...props} />
  ),
);
Flex.displayName = 'Flex';

// ─── Grid ────────────────────────────────────────────────────
const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      'auto-sm': 'grid-cols-1 sm:grid-cols-2',
      'auto-md': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      'auto-lg': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    cols: 1,
    gap: 'md',
  },
});

interface GridProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols, gap, className, ...props }, ref) => (
    <div ref={ref} className={cn(gridVariants({ cols, gap }), className)} {...props} />
  ),
);
Grid.displayName = 'Grid';

// ─── Stack ───────────────────────────────────────────────────
const stackVariants = cva('flex flex-col', {
  variants: {
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
});

interface StackProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof stackVariants> {}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ gap, className, ...props }, ref) => (
    <div ref={ref} className={cn(stackVariants({ gap }), className)} {...props} />
  ),
);
Stack.displayName = 'Stack';
