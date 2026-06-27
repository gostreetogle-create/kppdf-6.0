#!/usr/bin/env node
// scripts/kill-port.mjs — cross-platform helper: kill every process listening
// on a given TCP port. Designed to be imported by sibling scripts (NOT
// invoked directly).
//
// Pure Node ESM (mjs), zero external dependencies. Mirrors the behavior of
// scripts/kill-port.sh (cycle 31) but eliminates the bash dependency — the
// user's PATH can resolve `bash` to a WSL shim that fails with
// "CreateProcessCommon:818 execvpe(/bin/bash) failed", and `node` is always
// in PATH on any system that can run `npm run dev`.
//
// Exports one function:
//
//   killPort(port)
//
// Behavior:
//   - Windows (works with native cmd, Git Bash, MSYS, Cygwin, WSL bash shim):
//     uses `netstat -ano` for detection and `taskkill /PID <pid> /T /F` for
//     termination. Note: when invoked via Node `child_process.spawnSync`
//     (not through a shell), Git Bash's POSIX-to-Windows path mangling
//     does NOT apply — we can pass `/F` directly to taskkill without the
//     `//F` double-slash escape needed when calling through Git Bash.
//   - Unix / Linux / macOS: uses `lsof -ti:<port>` for detection and
//     `kill -9 <pid>` for termination.
//
// Edge cases handled:
//   - Empty port (no listener): silent no-op, return immediately.
//   - Multiple PIDs (IPv4 + IPv6 dual-listeners): kills each in iteration.
//   - Permission-denied or SYSTEM-owned PID: kill may fail but the loop
//     continues. Non-blocking.

import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

// Detect PIDs listening on a TCP port. Returns a Set of numeric PID strings.
// Returns empty set on: command-not-found, command failure, or no listeners.
function detectPids(port) {
  const isWin = platform() === 'win32';
  const pids = new Set();

  if (isWin) {
    // netstat -ano rows look like:
    //   "  TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    10784"
    // We need exact :PORT match (avoid 3000 matching 30000) AND LISTENING
    // state. PID is the last whitespace-separated token.
    const result = spawnSync('netstat', ['-ano'], { encoding: 'utf-8' });
    if (result.error || !result.stdout) return pids;
    // The whitespace before PORT is required so :3000 in IPv6 brackets
    // ([::]:3000 vs [::]:30000) doesn't false-match. Pattern: `:PORT + `.
    const portRegex = new RegExp(':' + port + '\\s+');
    for (const line of result.stdout.split(/\r?\n/)) {
      if (portRegex.test(line) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
    }
  } else {
    // Unix: `lsof -ti:PORT` emits one PID per line.
    const result = spawnSync('lsof', ['-ti:' + port], { encoding: 'utf-8' });
    if (result.error || !result.stdout) return pids;
    for (const line of result.stdout.split(/\r?\n/)) {
      const pid = line.trim();
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
  }

  return pids;
}

// Terminate a single PID. Cross-platform. Failures are non-fatal: a system
// "⚠ taskkill did not terminate" warning is emitted but the loop continues.
function terminatePid(pid) {
  const isWin = platform() === 'win32';
  if (isWin) {
    const r = spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { encoding: 'utf-8' });
    if (r.error || r.status !== 0) {
      console.log(`  ⚠ taskkill did not terminate PID ${pid} (may be owned by another user)`);
    }
  } else {
    const r = spawnSync('kill', ['-9', pid], { encoding: 'utf-8' });
    if (r.error || r.status !== 0) {
      console.log(`  ⚠ kill -9 did not terminate PID ${pid} (may be owned by another user)`);
    }
  }
}

// Public API: kill every PID listening on the given TCP port.
// Always returns 0 (kill failures are non-fatal — port may be freed via
// OS TIME_WAIT or process-tree collapse regardless).
export function killPort(port) {
  const pids = detectPids(port);

  // Empty set = nothing holding the port, silent no-op.
  if (pids.size === 0) return;

  // Kill each PID. Failures are non-fatal (loop continues; a freed port
  // via OS-level release or process-tree collapse still satisfies our goal).
  for (const pid of pids) {
    console.log(`🔪 killing orphan process holding port ${port} (PID ${pid})`);
    terminatePid(pid);
  }
}
