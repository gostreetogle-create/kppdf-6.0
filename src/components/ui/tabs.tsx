'use client';

import { forwardRef, createContext, useContext, useState, useCallback, type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs.Root>');
  return ctx;
};

// ─── Tabs.Root ──────────────────────────────────────────────
interface TabsRootProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function TabsRoot({ defaultValue = '', value: controlledValue, onValueChange, children, className }: TabsRootProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const handleValueChange = useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── Tabs.List ──────────────────────────────────────────────
const tabsListVariants = cva('inline-flex items-center text-muted-foreground', {
  variants: {
    variant: {
      tabs: 'h-10 rounded-md bg-muted p-1 gap-1',
      underline: 'h-10 border-b border-border gap-0',
      pills: 'gap-1',
    },
  },
  defaultVariants: {
    variant: 'tabs',
  },
});

interface TabsListProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof tabsListVariants> {}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ variant, className, ...props }, ref) => (
    <div ref={ref} role="tablist" className={cn(tabsListVariants({ variant }), className)} {...props} />
  ),
);
TabsList.displayName = 'TabsList';

// ─── Tabs.Trigger ───────────────────────────────────────────
const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        tabs: 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        underline: 'border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none',
        pills: 'rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'tabs',
    },
  },
);

interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tabsTriggerVariants> {
  value: string;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ variant = 'tabs', value, className, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => onValueChange(value)}
        className={cn(tabsTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

// ─── Tabs.Content ───────────────────────────────────────────
interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, forceMount = false, className, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    if (!forceMount && selectedValue !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={selectedValue === value ? 'active' : 'inactive'}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          selectedValue !== value && 'hidden',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TabsContent.displayName = 'TabsContent';

// ─── Compound export ───────────────────────────────────────
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
