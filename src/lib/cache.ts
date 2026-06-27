/**
 * src/lib/cache.ts — Server-side in-memory LRU cache for reference data.
 *
 * Uses lru-cache (lightweight, zero external deps beyond Node built-ins).
 * Caches GET responses for reference-data API routes (clients, organizations,
 * work-types, categories, etc.) that change infrequently.
 *
 * TTL: 5 minutes by default (configurable per call).
 * Max entries: 500.
 *
 * Cycle v3.4.1 — performance optimization.
 */

import { LRUCache } from 'lru-cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 min default
});

/** Get from cache or compute via factory. */
export async function getCached<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;
  const value = await factory();
  cache.set(key, value, { ttl: ttlMs });
  return value;
}

/** Invalidate specific cache keys. */
export function invalidateCache(...keys: string[]) {
  for (const key of keys) cache.delete(key);
}

/** Invalidate all keys starting with prefix. */
export function invalidateByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Clear entire cache. */
export function clearCache() {
  cache.clear();
}

/** Cache stats for monitoring. */
export function getCacheStats() {
  return { size: cache.size, max: cache.max };
}
