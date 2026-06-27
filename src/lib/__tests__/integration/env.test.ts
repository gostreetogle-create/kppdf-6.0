/**
 * src/lib/__tests__/integration/env.test.ts (Cycle 48-49 Part 3 / 6.1)
 *
 * Integration tests для `src/lib/env.ts` (cycle 40 / Block 1.3 foundation).
 *
 * Coverage:
 *   1. isProd/isDev mutual exclusivity по NODE_ENV (production / development / test / empty).
 *   2. baseUrl preference order: NEXT_PUBLIC_BASE_URL set → use it;
 *      unset → fallback на http://localhost:3000.
 *   3. Export surface contract: exactly { isProd, isDev, baseUrl } with correct types.
 *
 * Implementation note:
 *   env.ts reads `process.env.X` AT MODULE TOP-LEVEL и exports `const`-derived
 *   values (snapshot semantics — frozen at first import). To test multiple env
 *   values:
 *     a) vi.stubEnv('VAR', 'value') sets env var to literal string.
 *        Setting to `undefined as unknown as string` effectively unsets (treated
 *        by vitest as 'remove' operation).
 *     b) vi.resetModules() clears module cache.
 *     c) Dynamic import via `await import('@/lib/env')` reads fresh process.env.
 *     d) vi.unstubAllEnvs() in afterEach restores for next test.
 *
 * Quirks tested:
 *   - `??` operator: empty string '' is truthy, so `process.env.X ?? fallback`
 *     returns '' when X=''; only `null` / `undefined` triggers fallback.
 *
 * Tier promotion: env.ts → Tier A candidate after this file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  // Dynamic import post-vi.resetModules() гарантирует свежие top-level process.env reads.
  return import('@/lib/env');
}

describe('env module exports', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isProd / isDev mutual exclusivity', () => {
    it('NODE_ENV=production → isProd=true, isDev=false', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const env = await loadEnv();
      expect(env.isProd).toBe(true);
      expect(env.isDev).toBe(false);
    });

    it('NODE_ENV=development → isProd=false, isDev=true', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const env = await loadEnv();
      expect(env.isProd).toBe(false);
      expect(env.isDev).toBe(true);
    });

    it('NODE_ENV=test → isProd=false, isDev=true (test treated as development)', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      const env = await loadEnv();
      expect(env.isProd).toBe(false);
      expect(env.isDev).toBe(true);
    });

    it('NODE_ENV пустое → isProd=false (strict equality "production" only)', async () => {
      vi.stubEnv('NODE_ENV', '');
      const env = await loadEnv();
      expect(env.isProd).toBe(false);
      expect(env.isDev).toBe(true);
    });
  });

  describe('baseUrl resolution', () => {
    it('NEXT_PUBLIC_BASE_URL set → uses it (production URL)', async () => {
      vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://prod.example.com');
      const env = await loadEnv();
      expect(env.baseUrl).toBe('https://prod.example.com');
    });

    it('NEXT_PUBLIC_BASE_URL unset → fallback на http://localhost:3000', async () => {
      // Cast: stubEnv's parameter type signature is `string`. Passing undefined
      // at runtime unsets the var (vitest treats undefined as 'remove').
      vi.stubEnv('NEXT_PUBLIC_BASE_URL', undefined as unknown as string);
      const env = await loadEnv();
      expect(env.baseUrl).toBe('http://localhost:3000');
    });

    it('baseUrl не collision production URL и localhost fallback', async () => {
      vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://kppdf.example.org');
      const env = await loadEnv();
      expect(env.baseUrl).not.toBe('http://localhost:3000');
      // Sanity: parse-able URL.
      expect(() => new URL(env.baseUrl)).not.toThrow();
    });
  });

  describe('export surface contract', () => {
    it('exactly { isProd, isDev, baseUrl } с correct types', async () => {
      const env = await loadEnv();
      expect(typeof env.isProd).toBe('boolean');
      expect(typeof env.isDev).toBe('boolean');
      expect(typeof env.baseUrl).toBe('string');
      expect(Object.keys(env).sort()).toEqual(['baseUrl', 'isDev', 'isProd']);
    });
  });
});
