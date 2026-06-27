/**
 * src/stores/auth-refresh.ts — Cycle 50 (7.1)
 *
 * Helper для silent preemptive refresh access token:
 *   - `parseJwtExpiry(token)` — извлекает `exp` claim из JWT (sec → ms).
 *   - `createRefreshScheduler(onExpire)` — debounceable setTimeout-обёртка:
 *       schedule(expiryMs, beforeMs=5min) → refresh за 5 мин до expiry.
 *       clear() — отменяет pending timer (на logout).
 *       onExpire может быть async; rejection проглатывается (no unhandled).
 *
 * Проект стратегия:
 *   - access token: 24h (jwt.ts ACCESS_TOKEN_EXPIRY)
 *   - refresh token: 7d (jwt.ts REFRESH_TOKEN_EXPIRY)
 *   - silent refresh = hit POST /api/auth/refresh за 5 мин до expiry access.
 *   - failure → logout (не retry — refresh token повторно use не нужен).
 *
 * НЕ зависит от next/headers или React — pure client-side helper.
 * Используется из `src/stores/auth-store.ts` для prepend в auth-flow.
 *
 * Tier classification: Tier C CANDIDATE (требует vitest покрытия в cycles 48-49).
 */

/**
 * Парсит JWT без верификации подписи — читает только `exp` claim.
 * Signature verification делает server-side (`/api/auth/refresh`).
 *
 * @param token JWT формата `<base64url header>.<base64url payload>.<signature>`.
 * @returns expiry timestamp в миллисекундах, или null если не удаётся распарсить.
 */
export function parseJwtExpiry(token: string): number | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    // base64url → base64: replace -_ → +/ и add padding.
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const payloadStr = atob(padded + padding);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = JSON.parse(payloadStr) as any;
    if (typeof payload?.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export interface RefreshScheduler {
  schedule: (expiryMs: number, beforeMs?: number) => void;
  clear: () => void;
}

/**
 * Создаёт scheduler с internal timer ref. Возвращает методы schedule/clear.
 *
 * @param onExpire функция (может быть async), вызывается когда timer fires.
 *                 Ошибки onExpire проглатываются (logged в console).
 * @returns scheduler instance.
 */
export function createRefreshScheduler(
  onExpire: () => void | Promise<void>,
): RefreshScheduler {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule(expiryMs: number, beforeMs = 5 * 60 * 1000) {
      // Всегда очищаем предыдущий timer перед (re)scheduling — избегаем duplicate refresh.
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }

      const target = expiryMs - beforeMs - Date.now();

      if (target <= 0) {
        // Уже истёкший или близко к expiry — refresh immediately (async fire-and-forget).
        Promise.resolve()
          .then(() => onExpire())
          .catch((err) => console.warn('[auth-refresh] onExpire failed:', err));
        return;
      }

      timerId = setTimeout(() => {
        timerId = null;
        Promise.resolve()
          .then(() => onExpire())
          .catch((err) => console.warn('[auth-refresh] onExpire failed:', err));
      }, target);
    },

    clear() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    },
  };
}

/**
 * Default refresh lead time = 5 минут до expiry access token.
 * Подобрано как compromise: даёт достаточно времени для refresh в случае
 * temporary network failure (1-2 retry attempts).
 */
export const DEFAULT_REFRESH_LEAD_MS = 5 * 60 * 1000;
