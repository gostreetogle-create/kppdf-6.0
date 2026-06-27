#!/usr/bin/env node
// scripts/reset-dev.mjs — full `.next/` wipe + dev-server boot (with smart
// orphan-process kill for comprehensive recovery from prior-cycle crashes).
//
// Pure Node ESM replacement for scripts/reset-dev.sh (cycle 30). Mirrors the
// architecture of scripts/dev.mjs (cycle 32): imports scripts/kill-port.mjs
// helper, uses pure-Node `fs.rmSync` (no `du` shell-out for cross-platform),
// spawns `next dev --webpack` with stdio:inherit.
//
// Why this exists:
//   Cycle 30 introduced scripts/reset-dev.sh for cases where the surgical
//   dev.sh cleanup wasn't enough (cache corruption wider than `.next/dev/`).
//   Cycle 32 migrated both dev.sh + kill-port.sh to Node ESM; reset-dev.sh
//   was deferred to maintain "out-of-user-scope" discipline on the WSL-bash
//   failure.
//
//   Now mirroring: full coverage across both npm scripts. The orphan
//   process on port 3000 (which dev.mjs handles in step 0) ALSO needs to be
//   reclaimed before `npm run dev:reset` boots — same dual-failure-mode
//   (orphan + lock) as dev.mjs.
//
// Usage:
//   npm run dev:reset                       # default args (no extras)
//   npm run dev:reset -- -p 4000            # forwarded to `next dev`
//   node scripts/reset-dev.mjs -p 4000      # same, direct invocation
//
// Opt-out: NEXT_DEV_KILL=0 → skip step 0 (kill-port). Does NOT skip the .next/
//   wipe — `dev:reset` is the explicit wipe command; the wipe is the user's
//   intent regardless of kill-opt-out.
//
// Cross-platform:
//   - BEFORE-size uses pure-Node recursive walk (`fs.readdirSync` +
//     `fs.statSync`) instead of `du -sh`, so this works on Windows-bare
//     environments where `du` is absent (the bash's `${BEFORE:-?}` fallback
//     no longer needed; the Node version's `formatBytes(null)` returns `'?'`).

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { argv, env, execPath } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { killPort } from './kill-port.mjs';

// Helper: Calculate recursive directory size in bytes (no `du` shell-out).
// Returns null if dir is absent. Silently skips locked/unreadable entries.
function dirSize(dir) {
  if (!existsSync(dir)) return null;
  let total = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      try {
        if (entry.isFile()) {
          total += statSync(full).size;
        } else if (entry.isDirectory()) {
          const sub = dirSize(full);
          if (sub !== null) total += sub;
        }
      } catch (_e) {
        // Silently skip locked/unreadable entries (e.g. .next/cache/webpack
        // may have files in use on Windows). Don't crash the size calc.
      }
    }
  } catch (_e) {
    // Top-level readdir failed (rare). Return what we have so far.
  }
  return total;
}

// Helper: Format bytes to human-readable string (B / KB / MB / GB).
// Returns '?' if bytes is null (size-calc failed / dir absent initially).
function formatBytes(bytes) {
  if (bytes === null) return '?';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 0. Smart process-kill — detect + reclaim any orphan dev-server still
//    holding TCP port 3000 (the default `next dev` port) from a prior
//    crashed session. Same semantics as dev.mjs. Opt-out via NEXT_DEV_KILL=0
//    (e.g. running intentional parallel devs on different ports).
//    Note: opt-out does NOT affect step 1's wipe — `dev:reset` is the
//    explicit wipe command; the wipe is the user's intent.
const nextDevKill = env.NEXT_DEV_KILL ?? '1';
if (nextDevKill !== '0') {
  killPort(3000);
}

// 1. Wipe the entire `.next/` build cache. Verbose on every run: this is a
//    manual recovery tool, not silent. Regeneratable — Next.js + webpack
//    rebuild on first compile (~30–90s slowdown accepted because dev server
//    is otherwise non-functional with corrupt cache).
//    BEFORE-size is logged so operator can verify the wipe reclaimed real
//    bytes (vs. an already-empty cache). On absent dir: silent no-op.
if (existsSync('.next')) {
  const sizeBytes = dirSize('.next');
  try {
    rmSync('.next', { recursive: true, force: true });
    console.log(`🧨 wiped .next/ (was ${formatBytes(sizeBytes)})`);
  } catch (e) {
    console.error(`  ⚠ failed to wipe .next/: ${e.message}`);
    // Continue to spawn — dev server may still boot if some files cleared.
  }
} else {
  console.log('🧹 .next/ already absent — nothing to wipe');
}

// 2. Spawn Next.js dev server. Same flags as dev.mjs:
//    `--webpack` opts out of Turbopack for stability (audit-log C28).
//    userArgs (everything after argv[1]) is forwarded verbatim.
//    stdio: 'inherit' so operator sees dev-server I/O + Ctrl-C works.
const userArgs = argv.slice(2);

// Запускаем `next` напрямую через Node.js — работает на всех платформах
// без shell, без .cmd/.sh обёрток. См. dev.mjs для деталей.
const __dirname = dirname(fileURLToPath(import.meta.url));
const nextEntry = join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const devServer = spawn(execPath, [nextEntry, 'dev', '--webpack', ...userArgs], {
  stdio: 'inherit',
});

devServer.on('error', (err) => {
  console.error(`Failed to start Next.js dev process: ${err.message}`);
  process.exit(1);
});

// Forward exit code so npm/IDE handles clean stops correctly.
devServer.on('exit', (code) => {
  process.exit(code ?? 0);
});
