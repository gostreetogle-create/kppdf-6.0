'use client';

import { useState, useCallback, createContext, useContext, useEffect, type ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, opts?: { description?: string; action?: { label: string; onClick: () => void }; duration?: number }) => string;
  dismiss: (id: string) => void;
  promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* v3.1 glass: removed `bg-X/10` from each variant — `glass-surface-soft` provides
   unified translucent bg; only border + text remain tinted per variant. Avoids
   CSS source-order collision where Tailwind v4 utilities (bg-X/10) emitted
   AFTER custom .glass-surface-soft and overrode the glass effect. */
const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; styles: string }> = {
  success: { icon: CheckCircle2, styles: 'border-success/50 text-success' },
  error: { icon: AlertCircle, styles: 'border-destructive/50 text-destructive' },
  info: { icon: Info, styles: 'border-info/50 text-info' },
  warning: { icon: AlertTriangle, styles: 'border-warning/50 text-warning' },
  loading: { icon: Loader2, styles: 'border-border text-foreground' },
};

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    // role="status" + aria-live="polite" — screen readers (NVDA / VoiceOver)
    // announce new toasts without stealing focus (WCAG §8 toast-accessibility).
    // role="status" preferred over role="alert" для success/info/warning, чтобы
    // не прерывать текущую озвучку. Для error toasts — отдельный alert-channel.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[--z-toast] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => {
        const config = variantConfig[t.variant];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : undefined}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border glass-surface-soft px-4 py-3 shadow-lg animate-slide-in-right',
              config.styles,
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', t.variant === 'loading' && 'animate-spin')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="text-sm opacity-80 mt-0.5">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={t.action.onClick}
                  className="mt-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Закрыть уведомление"
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant: ToastVariant, title: string, opts?: { description?: string; action?: { label: string; onClick: () => void }; duration?: number }) => {
      const id = crypto.randomUUID();
      const duration = opts?.duration ?? (variant === 'loading' ? 0 : 5000);
      setToasts((prev) => [...prev, { id, variant, title, description: opts?.description, action: opts?.action, duration }]);
      if (duration > 0) setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast],
  );

  const dismiss = useCallback(
    (id: string) => removeToast(id),
    [removeToast],
  );

  const promise = useCallback(
    async <T,>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }): Promise<T> => {
      const id = toast('loading', msgs.loading);
      try {
        const result = await promise;
        removeToast(id);
        toast('success', msgs.success);
        return result;
      } catch {
        removeToast(id);
        toast('error', msgs.error);
        throw new Error(msgs.error);
      }
    },
    [toast, removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, promise }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
