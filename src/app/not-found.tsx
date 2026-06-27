// Server Component — нет client-side hooks/state. SSR-рендер обеспечивает
// корректный HTTP 404 status (Next.js ставит его автоматически только когда
// not-found.tsx рендерится server-side, не гидратируется на клиенте).
// Раньше был лишний 'use client' (Next.js Link работает в обоих режимах, но
// client-рендер ломает HTTP-status code в некоторых edge-cases кеша).

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold text-[var(--muted-foreground)]/30">404</div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Страница не найдена</h1>
        <p className="text-[var(--muted-foreground)]">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          href="/"
          className="inline-block py-3 px-6 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          style={{ background: 'var(--gradient-primary)' }}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
