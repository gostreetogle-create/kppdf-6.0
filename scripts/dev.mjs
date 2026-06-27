#!/usr/bin/env node
// scripts/dev.mjs — safety wrapper for `npm run dev`. Pure Node, no bash.
//
// Why this exists:
//   Replaces scripts/dev.sh (cycle 29 + 31) with pure Node ESM, eliminating
//   the bash dependency. Required when the user's PATH resolves `bash` to a
//   WSL bash shim that fails with:
//     <3>WSL (27234 - Relay) ERROR: CreateProcessCommon:818:
//         execvpe(/bin/bash) failed: No such file or directory
//
//   `node` is always in PATH on systems that can run `npm run dev`, so
//   switching from bash to node eliminates the WSL-bash-bridge failure mode.
//
//   Preserves the same behavior as the bash wrapper:
//   - Step 0: detect + kill any orphan process holding TCP port 3000
//             (the default `next dev` port) from a prior crashed session.
//             Auto-recovers from the "Another next dev server is already
//             running" blocking handshake.
//   - Step 1: clear stale `.next/dev/lock` + `.next/dev/dev.json` while
//             preserving `.next/dev/logs/` for post-mortem inspection.
//   - Step 2: spawn `next dev --webpack <user-args>` with stdio:inherit
//             so the operator sees the dev server's I/O directly.
//
// Usage:
//   npm run dev                       # default args (no extras)
//   npm run dev -- -p 4000            # forwarded to `next dev` via argv[2:]
//   node scripts/dev.mjs -p 4000      # same, direct invocation
//
// Opt-out: NEXT_DEV_KILL=0 → skip the auto-kill step. Useful when running
//   parallel dev sessions on different ports or when manual process
//   lifecycle management is required.

import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { argv, env, execPath } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { killPort } from './kill-port.mjs';

// 0. Smart process-kill — detect + reclaim any orphan dev-server still
//    holding TCP port 3000 (the default Next.js dev port) from a prior
//    crashed/killed session. This is the primary defense against:
//      (a) "Another next dev server is already running. PID: X. Run
//           taskkill /PID X /F" (previously hit with PID 10784)
//      (b) "Persisting failed" lock collision in `.next/dev/`
//    Opt-out: NEXT_DEV_KILL=0 (e.g. running intentional parallel devs).
//    Empty port → silent no-op (~20ms overhead).
const nextDevKill = env.NEXT_DEV_KILL ?? '1';
if (nextDevKill !== '0') {
  killPort(3000);
}

// 1. Clear stale `.next/dev/` lock state — but ONLY the lock files, not the
//    whole directory. This preserves `.next/dev/logs/` so an operator can
//    still `tail` post-mortem compilation / HMR errors after a crash.
//    Idempotent: silent no-op on a healthy machine (first boot / already-clean).
//
//    matches bash version (`[ -d .next/dev ]` guard + `rm -f` + echo on hit).
if (existsSync('.next/dev')) {
  try {
    rmSync('.next/dev/lock', { force: true });
    rmSync('.next/dev/dev.json', { force: true });
    console.log('🧹 cleared stale .next/dev lock');
  } catch (_e) {
    // Silent — failure to remove lock files is non-fatal.
  }
}

// 2. Spawn Next.js dev server. Same flags as the previous bash wrapper:
//    `--webpack` opts out of Turbopack for stability in long dev sessions
//    (audit-log Cycle 28). userArgs (every argv entry after the script path)
//    is forwarded verbatim, e.g. `node scripts/dev.mjs -p 4000` produces
//    `next dev --webpack -p 4000`.
//    stdio: 'inherit' pipes the dev server's stdin/stdout/stderr to the
//    parent shell so Ctrl-C / SIGINT forward correctly.
const userArgs = argv.slice(2);

// Запускаем `next` напрямую через Node.js (минуя .cmd/.sh обёртки).
// На Windows spawn с shell:false не может запустить next.cmd (batch-скрипт).
// На Unix next — shell-скрипт с shebang, spawn открывает его через ядро.
// Используем process.execPath для прямого запуска entry-точки Next.js CLI.
// Это работает на всех платформах без shell.
const __dirname = dirname(fileURLToPath(import.meta.url));
const nextEntry = join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const devServer = spawn(execPath, [nextEntry, 'dev', '--webpack', ...userArgs], {
  stdio: 'inherit',
});

devServer.on('error', (err) => {
  console.error(`Failed to start Next.js dev process: ${err.message}`);
  process.exit(1);
});

// Forward exit code: when the dev server exits (Ctrl-C, error, etc.), the
// parent process should mirror its exit code so npm/IDE sees a clean
// stop. Without this, npm dev leaves a hanging process tree.
devServer.on('exit', (code) => {
  process.exit(code ?? 0);
});
