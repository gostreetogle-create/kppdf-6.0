'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className, ...props }, ref) => {
    const toggleId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

    return (
      <label
        htmlFor={toggleId}
        className={cn('inline-flex items-center gap-2 cursor-pointer', className)}
      >
        <div className="relative">
          <input
            ref={ref}
            id={toggleId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div className="h-6 w-10 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
        {label && (
          <span className="text-sm font-medium text-foreground">{label}</span>
        )}
      </label>
    );
  },
);
Toggle.displayName = 'Toggle';
