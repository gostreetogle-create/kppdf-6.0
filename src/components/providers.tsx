'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Справочные данные редко меняются — 5 минут кеша
        staleTime: 5 * 60 * 1000,
        // Автоматический retry при сетевых ошибках
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Не рефетчить при потере фокуса окна (для SPA-приложения неактуально)
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // SSR: всегда новый QueryClient
    return makeQueryClient();
  }
  // Браузер: единый экземпляр на всё время жизни приложения
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
