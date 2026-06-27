#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/lib/atomic-queue-append.js
 *
 * Idempotent atomic append helper for agent-queue.json. Used by per-cycle
 * append-cycleNN-queue.js scripts (cycle-23, cycle-24, ...). Centralizes
 * the duplicated logic in one place so the append-flow is auditable.
 *
 * Behavior contract:
 *   1. Load agent-queue.json (path resolves relative to this lib/.
 *      scripts/lib/ lives at <repo>/scripts/lib/, so QUEUE_PATH resolves
 *      upward two levels to <repo>/agent-queue.json).
 *   2. Filter incoming TASKS: skip any whose id already exists in q.tasks.
 *   3. If filtered list is empty: print "No-op", return { added: 0, total }.
 *   4. Otherwise:
 *      - Stamp created_at = single ISO timestamp shared across all added
 *        tasks within this batch.
 *      - Append to q.tasks.
 *      - Increment q.agents.mimo.tasks_pending by count of MiMo-assigned
 *        tasks in this batch. Mirrors the proven cycle-23 / cycle-24
 *        appender behavior. (Buffy counters still recomputed from scratch
 *        via scripts/sync-queue-counters.js \u2014 same auditor pattern.)
 *      - Set q.last_updated = now.
 *      - Set q.cycle = Math.max(cycleNumber, q.cycle || 0). Never lowers
 *        a higher pre-existing cycle counter.
 *      - Atomic write via tmp + renameSync.
 *      - Print summary.
 *   5. Return { added, total }.
 *
 * Idempotency proven: filtered-list empty path returns early; re-running
 * the same appender N times never duplicates tasks or drifts counters.
 *
 * NOT exported: structural repairs. Use scripts/sync-queue-counters.js
 * for that. The two scripts compose: appender adds tasks + bumps counters;
 * sync-queue-counters reads ground truth + repairs any drift .
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.resolve(__dirname, '..', '..', 'agent-queue.json');

function appendTasksToQueue(cycleNumber, tasks) {
  const q = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));

  const existingIds = new Set(q.tasks.map((t) => t.id));
  const toAdd = tasks.filter((t) => !existingIds.has(t.id));

  if (toAdd.length === 0) {
    console.log(
      'No-op: all ' +
        tasks.length +
        ' task ids already in queue. Nothing appended.'
    );
    return { added: 0, total: q.tasks.length };
  }

  const now = new Date().toISOString();
  for (const t of toAdd) {
    t.created_at = now;
    q.tasks.push(t);
  }

  const mimoAdded = toAdd.filter((t) => t.assignee === 'mimo').length;
  if (mimoAdded > 0) {
    if (!q.agents.mimo) {
      q.agents.mimo = { tasks_pending: 0, tasks_in_progress: 0 };
    }
    q.agents.mimo.tasks_pending =
      (q.agents.mimo.tasks_pending || 0) + mimoAdded;
  }

  q.last_updated = now;
  q.cycle = Math.max(cycleNumber, q.cycle || 0);

  const tmp = QUEUE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(q, null, 2) + '\n');
  fs.renameSync(tmp, QUEUE_PATH);

  const mimoMsg = mimoAdded > 0
    ? '; mimo.tasks_pending = ' + q.agents.mimo.tasks_pending
    : '';
  console.log(
    'Appended ' +
      toAdd.length +
      ' task(s) for cycle ' +
      cycleNumber +
      mimoMsg +
      '. Total tasks: ' +
      q.tasks.length
  );
  return { added: toAdd.length, total: q.tasks.length };
}

module.exports = { appendTasksToQueue, QUEUE_PATH };
