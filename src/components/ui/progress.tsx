'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Linear Progress ───────────────────────────────────────
const progressVariants = cva('relative w-full overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
      xl: 'h-4',
    },
    variant: {
      default: '',
      indeterminate: '',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

const indicatorVariants = cva('h-full flex-1 transition-all duration-300 bg-primary', {
  variants: {
    variant: {
      default: '',
      indeterminate: 'animate-indeterminate w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ProgressProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const colorStyles: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ size, variant = 'default', value = 0, max = 100, showValue, color = 'primary', className, ...props }, ref) => {
    const percentage = variant === 'indeterminate' ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div className="w-full space-y-1">
        <div ref={ref} className={cn(progressVariants({ size, variant }), className)} {...props} role="progressbar" aria-valuenow={variant === 'indeterminate' ? undefined : value} aria-valuemin={0} aria-valuemax={max}>
          <div
            className={cn(indicatorVariants({ variant }), colorStyles[color])}
            style={variant === 'default' ? { width: `${percentage}%` } : undefined}
          />
        </div>
        {showValue && variant !== 'indeterminate' && (
          <p className="text-xs text-muted-foreground text-right">{Math.round(percentage)}%</p>
        )}
      </div>
    );
  },
);
Progress.displayName = 'Progress';

// ─── Circular Progress ─────────────────────────────────────
const circularSizes = {
  sm: { size: 36, strokeWidth: 3, className: 'h-9 w-9' },
  md: { size: 48, strokeWidth: 4, className: 'h-12 w-12' },
  lg: { size: 64, strokeWidth: 5, className: 'h-16 w-16' },
  xl: { size: 96, strokeWidth: 6, className: 'h-24 w-24' },
};

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: keyof typeof circularSizes;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  showValue?: boolean;
  strokeWidth?: number;
  indeterminate?: boolean;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ value = 0, max = 100, size = 'md', color = 'primary', showValue, strokeWidth, indeterminate, className, ...props }, ref) => {
    const config = circularSizes[size];
    const sw = strokeWidth || config.strokeWidth;
    const radius = (config.size - sw) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const offset = circumference - (percentage / 100) * circumference;
    const colorClass = colorStyles[color];

    return (
      <div ref={ref} className={cn('relative inline-flex items-center justify-center', config.className, className)} {...props} role="progressbar" aria-valuenow={indeterminate ? undefined : value} aria-valuemin={0} aria-valuemax={max}>
        <svg className={cn(indeterminate && 'animate-spin')} width={config.size} height={config.size} viewBox={`0 0 ${config.size} ${config.size}`}>
          {/* Background */}
          <circle cx={config.size / 2} cy={config.size / 2} r={radius} strokeWidth={sw} className="fill-none stroke-muted" />
          {/* Progress */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            strokeWidth={sw}
            className={cn('fill-none transition-all duration-300', colorClass)}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? circumference * 0.25 : offset}
            style={indeterminate ? undefined : { transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        {showValue && !indeterminate && (
          <span className="absolute text-sm font-medium text-foreground">{Math.round(percentage)}%</span>
        )}
      </div>
    );
  },
);
CircularProgress.displayName = 'CircularProgress';
