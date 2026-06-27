import { forwardRef, type ComponentType, type SVGProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
      '2xl': 'h-10 w-10',
    },
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export interface IconProps extends SVGProps<SVGSVGElement>, VariantProps<typeof iconVariants> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, size, variant, className, ...props }, ref) => (
    <LucideIcon
      ref={ref}
      className={cn(iconVariants({ size, variant }), className)}
      {...props}
    />
  ),
);
Icon.displayName = 'Icon';
