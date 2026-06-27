#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/append-cycle24-queue.js
 *
 * Idempotent appender for cycle-24 E2E Playwright + vitest-axe task.
 * Logic delegated to scripts/lib/atomic-queue-append.js.
 *
 * Run: node scripts/append-cycle24-queue.js
 */

const { appendTasksToQueue } = require('./lib/atomic-queue-append');

const TASKS = [
  {
    id: 'cycle-24-p2-e2e-playwright',
    title: 'E2E browser tests (Playwright + Vitest) \u2014 prod-deploy critical paths',
    description: [
      'PROD-DEPLOY GATE: cycle-23 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u0442 security+monitoring layer (\u0440\u0430\u0442\u0435-\u043b\u0438\u043c\u0438\u0442 \u043f\u0435\u0440\u0441\u0438\u0441\u0442,',
      'CSP/HSTS, /api/health). cycle-24 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0435\u0442 functional regression layer \u0447\u0435\u0440\u0435\u0437 e2e.',
      '',
      'Scope expansion (2026-06-19): bundle axe-core a11y checks.',
      '\u0417\u0430\u043c\u0435\u043d\u0438\u043b\u0438 2 health-check scenarios (\u0443\u0436\u0435 \u043f\u043e\u043a\u0440\u044b\u0442\u044b cycle-23-p1-monitoring-health-check) \u043d\u0430 axe-core',
      '\u0441\u0446\u0435\u043d\u0430\u0440\u0438\u0438 /login + /dashboard. \u0418\u0442\u043e\u0433\u043e 15 \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u0435\u0432 (12 \u043e\u0440\u0438\u0433\u0438\u043d\u0430\u043b\u043e\u0432 + 1 CSP + 2 axe).',
      '',
      'Tools: @playwright/test + vitest (browser-context mode) + vitest-axe.',
      '',
      'Critical user paths (15 scenarios):',
      '  1. login page renders 200 + form fields visible + no console errors',
      '  2. login submit wrong credentials \u2192 show error banner (no 500)',
      '  3. login submit good credentials \u2192 redirect /dashboard + nav shows username',
      '  4. /dashboard loads with KPI tiles + activity stream',
      '  5. /proposals list renders rows + filter input works',
      '  6. /proposals/new \u2014 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0442\u043e\u0432\u0430\u0440\u0430 \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430 -> cart updates -> save \u2192 201',
      '  7. /contracts list + status badge colors match STATUS_MAP',
      '  8. /production/gantt loads columns + tasks visible + status colors match',
      '  9. /production/gantt drag-resize task \u2192 PUT 200, payload sent to /api/order-tasks/:id',
      ' 10. /warehouse page \u2014 storage items list + click row \u2192 detail panel',
      ' 11. /finance/order-closings \u2014 create new closing with status=draft \u2192 row appears',
      ' 12. /admin/users \u2014 create user (admin only) + role=editor; sign-out + log in as new user',
      ' 13. CSP enforcement: inline script without nonce \u2192 browser blocks \u2192 console.error',
      ' 14. (DROPPED \u2014 /api/health 200 path; covered by cycle-23-p1-monitoring-health-check)',
      ' 15. (DROPPED \u2014 /api/health 503 path; covered by cycle-23-p1-monitoring-health-check)',
      ' 16. axe-core /login: zero critical/serious a11y violations (color-contrast,',
      '     aria-labels, form structure, navigation landmarks). Threshold: 0 violations OR',
      '     documented exceptions in audit-log.md.',
      ' 17. axe-core /dashboard: zero critical/serious a11y violations on dashboard',
      '     post-login (KPI tiles, charts, activity stream). Threshold: same as #16.',
      '',
      'axe-core config (vitest-axe):',
      '  import { AxeBuilder } from \'@axe-core/playwright\';',
      '  Thresholds: wcag2a + wcag2aa tags, severity critical + serious.',
      '',
      'File layout:',
      '  tests/e2e/ \u2014 *.spec.ts (Playwright)',
      '  vitest.config.ts \u2014 add projects: [{ extends: ..., test.include: "tests/e2e/**/*.spec.ts" }]',
      '  playwright.config.ts \u2014 baseURL=http://localhost:3000, headless:true, webServer: npm run dev',
      '',
      'Helpers to install:',
      '  pnpm add -D @playwright/test vitest-axe @axe-core/playwright',
      '  pnpm exec playwright install --with-deps chromium',
      '',
      'CI integration:',
      '  .github/workflows/e2e.yml (or gitlab-ci.yml / Jenkinsfile) \u2014 run Playwright on PR/push to main.',
      '  Run AFTER tsc+lint+vitest unit (gate). Upload Playwright report + screenshots on failure.',
      '',
      'Acceptance:',
      '  All 15 scenarios PASS (12 originals + 1 CSP + 2 axe-core)',
      '  0 console errors / page errors on any happy path',
      '  0 critical/serious axe-core violations on /login and /dashboard',
      '  Total runtime under 5 minutes (test execution parallelized via Playwright workers: 4)',
      '  vitest 64/64 + e2e 15/15 both green in CI',
      '  Fail-fast on any 500/console-error (test counts as FAIL even if assertion passed)',
      '',
      'Out-of-scope (deferred):',
      '  Load testing (k6 / artillery) \u2014 separate cycle after deploy to staging',
      '  Visual regression (chromatic / percy) \u2014 nice-to-have but not blocking deploy',
      '  /api/health scenarios \u2014 already covered by cycle-23-p1-monitoring-health-check (separate gate)',
      '',
      'Files to create:',
      '  tests/e2e/ (15 .spec.ts files, one per scenario)',
      '  playwright.config.ts',
      '  tests/e2e/helpers/ (loginAs, waitForRoute, expectNoConsoleErrors, runAxeScan shared helpers)',
      '  .github/workflows/e2e.yml',
      '',
      'After: node agent-cli.js mimo done cycle-24-p2-e2e-playwright',
    ].join('\n'),
    priority: 2,
    status: 'pending',
    assignee: 'mimo',
    dependencies: ['cycle-23-p1-monitoring-health-check'],
    acceptance: [
      'All 15 e2e scenarios pass (12 originals + 1 CSP + 2 axe-core)',
      '0 console errors / page errors on happy paths',
      '0 critical/serious axe-core violations on /login and /dashboard',
      '<5min total runtime (4 Playwright workers)',
      'vitest 64/64 + e2e 15/15 in CI',
      'CSP/HSTS middleware verified by scenario 13',
    ],
  },
];

appendTasksToQueue(24, TASKS);
