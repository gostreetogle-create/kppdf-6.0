'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-gradient-primary text-white shadow-sm hover:brightness-110 active:brightness-90 transition-all duration-200',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80',
        outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        link: 'gradient-text underline-offset-4 hover:underline font-medium',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-sm gap-1',
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-md gap-2',
        lg: 'h-11 px-6 text-base rounded-md gap-2.5',
        xl: 'h-12 px-8 text-base rounded-lg gap-3',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-xs': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    // По умолчанию ставим type="button" — иначе внутри <form> кнопка
    // случайно submit-ит (HTML-spec: <button> без type = "submit").
    // При asChild мы прокидываем type через ...props как раньше — Slot
    // не имеет смысла без явного указания, и нельзя насильно ставить
    // type="button" на дочернем <a>/<Link>.
    const resolvedType = asChild ? type : (type ?? 'button');

    return (
      <Comp
        ref={ref as never}
        type={resolvedType}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <Spinner
            size={size === 'xs' || size === 'sm' || size === 'icon-xs' || size === 'icon-sm' ? 'sm' : 'md'}
            variant="default"
          />
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
