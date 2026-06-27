'use client';

import { forwardRef, useState, useCallback, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputType = 'text' | 'number' | 'password' | 'email' | 'tel' | 'url' | 'search';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix'> {
  type?: InputType;
  error?: string;
  clearable?: boolean;
  onClear?: () => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      error,
      clearable = false,
      onClear,
      prefix,
      suffix,
      className,
      id,
      disabled,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = type === 'password' && showPassword ? 'text' : type;

    const handleClear = useCallback(() => {
      onClear?.();
    }, [onClear]);

    const hasValue = typeof value === 'string' ? value.length > 0 : value != null;

    return (
      <div className="relative w-full">
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-[var(--border-hover)] focus-visible:border-[var(--border-focus)]',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-input',
            prefix && 'pl-10',
            (suffix || clearable || type === 'password') && 'pr-10',
            className,
          )}
          {...props}
        />
        {suffix && !clearable && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            {suffix}
          </div>
        )}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {clearable && hasValue && type !== 'password' && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
