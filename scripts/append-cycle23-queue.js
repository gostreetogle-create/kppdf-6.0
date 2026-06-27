#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/append-cycle23-queue.js
 *
 * Idempotent appender for cycle-23 prod-hardening tasks. Logic delegated to
 * scripts/lib/atomic-queue-append.js so cycle-23 / cycle-24 / future cycles
 * share idempotency + atomic-write + counter-sync + cycle-Math.max behavior.
 *
 * Run: node scripts/append-cycle23-queue.js
 */

const { appendTasksToQueue } = require('./lib/atomic-queue-append');

const TASKS = [
  {
    id: 'cycle-23-p0-rate-limit-storage',
    title: 'Persist rate-limit between restarts (P0 critical)',
    description:
      'Cycle 18 implemented login rate-limit (5/5min in-memory Map). For prod: in-memory Map loses state on deploy/restart, allowing attacker to wait out the window. Persist through Postgres (or Redis) \u2014 append-only RateLimitEntry table with (key, expiresAt, count). Cleanup job (cron-like) deletes expired entries every 5 min. Files: prisma/schema.prisma (new RateLimitEntry model), src/lib/rate-limit.ts (replace Map with DB write), scripts/cleanup-rate-limit.sh or background endpoint.',
    priority: 0,
    status: 'pending',
    assignee: 'mimo',
    dependencies: ['cycle-22-p0-sqlite-to-postgres'],
    acceptance: [
      'RateLimitEntry model + migration applied',
      'rate-limit.ts reads/writes durable store',
      '5th failed attempt returns 429 persists across dev-server restart',
      'tsc clean / vitest 64+/64+',
    ],
  },
  {
    id: 'cycle-23-p1-https-only-security-headers',
    title: 'Production security headers (helmet / HSTS / CSP)',
    description:
      'Production deploys need security headers: Strict-Transport-Security (HSTS), X-Content-Type-Options nosniff, X-Frame-Options DENY, Content-Security-Policy (CSP nonce-based or self+inline), Referrer-Policy strict-origin. Implement through Next.js middleware.ts (first request per page) or next.config.ts headers(). Files: middleware.ts (new), src/app/api/auth/login/route.ts (rate-limit 429 + Retry-After already present \u2014 verify).',
    priority: 1,
    status: 'pending',
    assignee: 'mimo',
    dependencies: ['cycle-22-p0-sqlite-to-postgres'],
    acceptance: [
      'middleware.ts applied to all routes EXCEPT /_next/* and /api/health',
      'HSTS max-age 63072000, includeSubDomains, preload',
      'CSP default-src self',
      'X-Frame-Options DENY',
      'tsc clean',
    ],
  },
  {
    id: 'cycle-23-p1-monitoring-health-check',
    title: 'GET /api/health endpoint + uptime monitoring',
    description:
      'Production deployment needs a health endpoint for uptime monitoring (UptimeRobot / BetterStack / Cronitor / New Relic Synthetics). GET /api/health returns JSON with status, db reachability, uptime seconds, version, timestamp. 200 if DB reachable, 503 if DB fail. Light endpoint \u2014 no business logic, only SELECT 1 query. Bypasses auth so public uptime monitor probes are permitted. Files: src/app/api/health/route.ts (new), README.md monitoring section.',
    priority: 1,
    status: 'pending',
    assignee: 'mimo',
    dependencies: ['cycle-22-p0-sqlite-to-postgres'],
    acceptance: [
      'GET /api/health returns 200 plus JSON when DB is reachable',
      'GET /api/health returns 503 plus JSON when DATABASE_URL is invalid',
      '/api/health bypasses requireAuth (public uptime monitor)',
      'endpoint latency under 100ms (single SELECT 1)',
      'tsc clean / vitest 64+/64+',
    ],
  },
];

appendTasksToQueue(23, TASKS);
