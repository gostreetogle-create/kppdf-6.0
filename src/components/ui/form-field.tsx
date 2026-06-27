'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

// ─── FormField ──────────────────────────────────────────────
interface FormFieldBaseProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
}

export interface FormFieldProps extends FormFieldBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  type?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, name, type = 'text', error, required, className, id, ...props }, ref) => {
    const inputId = id || name;
    return (
      <div className={cn('space-y-1.5', className)}>
        <Label htmlFor={inputId} required={required}>{label}</Label>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormField.displayName = 'FormField';

// ─── FormSelect ─────────────────────────────────────────────
export interface FormSelectProps extends FormFieldBaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, name, options, placeholder, error, required, className, id, ...props }, ref) => {
    const inputId = id || name;
    return (
      <div className={cn('space-y-1.5', className)}>
        <Label htmlFor={inputId} required={required}>{label}</Label>
        <select
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormSelect.displayName = 'FormSelect';

// ─── FormTextarea ───────────────────────────────────────────
export interface FormTextareaProps extends FormFieldBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, name, error, required, className, id, ...props }, ref) => {
    const inputId = id || name;
    return (
      <div className={cn('space-y-1.5', className)}>
        <Label htmlFor={inputId} required={required}>{label}</Label>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error ? 'border-destructive focus-visible:ring-destructive' : 'border-input',
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
FormTextarea.displayName = 'FormTextarea';
