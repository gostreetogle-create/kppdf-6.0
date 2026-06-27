// Next.js 16 renamed the `middleware` file convention to `proxy` (better
// reflects its purpose: a network boundary in front of the app, not
// Express-style middleware). This file migrated from `src/middleware.ts` in
// Cycle 34 — only the export name changed; behavior, imports, matcher, and
// security headers all preserved verbatim. See:
//   node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
//   node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
//
// Cycle 36: surgical CSP tightening (no nonce migration).
//   - Prod drops 'unsafe-eval' (Next.js 16 docs: required in dev for React error
//     stack reconstruction; not needed in prod).
//   - Added hardening directives: object-src 'none', base-uri 'self',
//     form-action 'self', frame-ancestors 'none', upgrade-insecure-requests.
//   - Kept 'unsafe-inline' in script+style — RSC inline scripts/styles need it
//     without a nonce; full nonce migration would force ALL pages to dynamic
//     rendering (Next.js docs: slower initial load + no CDN caching), which
//     is too costly for this internal Synology deployment.
// Ref: node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProd } from '@/lib/env';

// Публичные маршруты — не требуют аутентификации
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',
  '/api/seed',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth check — редирект на /login если нет токена (для страниц)
  // Позволяет bfcache работать и устраняет спиннер в layout
  //
  // ВАЖНО: проверяется только НАЛИЧИЕ cookie, а не валидность JWT-подписи.
  // Любое произвольное значение в accessToken пропускает проверку.
  // Это сделано намеренно: для bfcache оптимизации достаточно быстрой фильтрации.
  // Полная верификация JWT происходит в API-роутах (src/lib/auth.ts requireAuth).
  // Не рассматривать этот блок как полноценную security-границу.
  if (!publicRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) {
      // API запросы без токена → 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Страницы → редирект на login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('backUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (only in production)
  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // CSP — surgical tightening (Cycle 36).
  const scriptSrc = isProd
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
