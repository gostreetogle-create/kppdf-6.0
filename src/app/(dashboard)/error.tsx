'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <AlertTriangle className="h-12 w-12 text-[var(--destructive)] mb-4" />
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        Произошла ошибка
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4 text-center max-w-md">
        Не удалось загрузить данные. Попробуйте обновить страницу.
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Попробовать снова
      </Button>
    </div>
  );
}
