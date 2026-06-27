'use client';

import React, { useState, createContext, useContext, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  openValues: Set<string>;
  toggleValue: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordion = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion.Item must be used within <Accordion>');
  return ctx;
};

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: ReactNode;
  className?: string;
}

export function Accordion({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const initialValues = () => {
    const vals = controlledValue ?? defaultValue;
    if (!vals) return new Set<string>();
    if (Array.isArray(vals)) return new Set(vals);
    return new Set([vals]);
  };

  const isControlled = controlledValue !== undefined;
  const [internalValues, setInternalValues] = useState(initialValues);

  const openValues = isControlled
    ? new Set(Array.isArray(controlledValue) ? controlledValue : [controlledValue!])
    : internalValues;

  const toggleValue = (value: string) => {
    const next = new Set(openValues);

    if (type === 'single') {
      if (next.has(value)) next.clear();
      else { next.clear(); next.add(value); }
    } else {
      if (next.has(value)) next.delete(value);
      else next.add(value);
    }

    const result = type === 'single' ? [...next][0] || '' : [...next];

    if (!isControlled) {
      if (type === 'single') setInternalValues(next);
      else setInternalValues(next);
    }
    onValueChange?.(type === 'single' ? result : result);
  };

  return (
    <AccordionContext.Provider value={{ openValues, toggleValue, type }}>
      <div className={cn('rounded-md border border-border', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

function AccordionItem({ value, trigger, children, disabled = false }: AccordionItemProps) {
  const { openValues, toggleValue } = useAccordion();
  const open = openValues.has(value);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => !disabled && toggleValue(value)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between py-4 px-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        data-state={open ? 'open' : 'closed'}
        aria-expanded={open}
      >
        {trigger}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
      <div
        className={cn(
          'overflow-hidden text-sm transition-all',
          open ? 'animate-accordion-down' : 'animate-accordion-up',
        )}
      >
        <div className="pb-4 pt-0 px-4">{children}</div>
      </div>
    </div>
  );
}

Accordion.Item = AccordionItem;
