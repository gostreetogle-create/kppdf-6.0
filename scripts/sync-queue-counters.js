#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * scripts/sync-queue-counters.js
 *
 * Repeatable one-shot: recomputes agent counters from actual queue state.
 * Counters touched: agents.mimo.{tasks_pending, tasks_in_progress} and
 *                    agents.buffy.{tasks_pending, tasks_in_progress}.
 *
 * Algorithm:
 *   1. Load agent-queue.json.
 *   2. Defensively ensure both `agents.{name}` objects exist with numeric
 *      tasks_pending / tasks_in_progress fields (default 0).
 *   3. Count tasks by { status, assignee } across pending / in_progress.
 *   4. Compare computed values against the current header values.
 *   5. If NO drift: exit 0 with diagnostic stdout.
 *   6. If drift: apply recomputed values, bump last_updated, atomic write
 *      (tmp + rename), exit 0.
 *
 * Idempotent: re-running after a successful sync prints "No-op".
 *
 * Why this script exists:
 *   The various append-cycle-N-queue.js helpers historically bumped the
 *   mimo counter via inline +toAdd.length arithmetic, but drift creeps in
 *   when messages are replayed, manual edits land, or buffy picks up work.
 *   This script is the canonical recovery path: it computes from ground truth.
 *
 * Run: node scripts/sync-queue-counters.js
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.resolve(__dirname, '..', 'agent-queue.json');

const AGENTS = [
  {
    key: 'mimo',
    defaultName: 'MiMo Code Agent',
    defaultDescription:
      'Исполнительный агент — UI компоненты, страницы, интеграции, установка пакетов',
  },
  {
    key: 'buffy',
    defaultName: 'Buffy (Codebuff)',
    defaultDescription:
      'Стратегический ассистент — архитектура, API, сложные компоненты, code review',
  },
];

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function ensureAgent(q, def) {
  let mutated = false;
  if (!q.agents) {
    q.agents = {};
    mutated = true;
  }
  if (!q.agents[def.key]) {
    q.agents[def.key] = {
      name: def.defaultName,
      description: def.defaultDescription,
      tasks_pending: 0,
      tasks_in_progress: 0,
    };
    mutated = true;
  } else {
    if (typeof q.agents[def.key].tasks_pending !== 'number') {
      q.agents[def.key].tasks_pending = 0;
      mutated = true;
    }
    if (typeof q.agents[def.key].tasks_in_progress !== 'number') {
      q.agents[def.key].tasks_in_progress = 0;
      mutated = true;
    }
  }
  return mutated;
}

function countByAssignee(q, status, assignee) {
  return q.tasks.filter(
    (t) => t.status === status && (t.assignee || '') === assignee
  ).length;
}

function main() {
  const q = loadQueue();

  if (!Array.isArray(q.tasks)) {
    throw new Error(
      'agent-queue.json structurally corrupt: missing tasks array (cannot recompute counters).'
    );
  }

  let structuralRepairs = false;
  for (const def of AGENTS) {
    if (ensureAgent(q, def)) structuralRepairs = true;
  }

  const before = {};
  const after = {};
  for (const def of AGENTS) {
    before[def.key] = {
      pending: q.agents[def.key].tasks_pending,
      in_progress: q.agents[def.key].tasks_in_progress,
    };
    after[def.key] = {
      pending: countByAssignee(q, 'pending', def.key),
      in_progress: countByAssignee(q, 'in_progress', def.key),
    };
  }

  const drifts = [];
  for (const def of AGENTS) {
    if (before[def.key].pending !== after[def.key].pending) {
      drifts.push({
        agent: def.key,
        field: 'tasks_pending',
        old_value: before[def.key].pending,
        new_value: after[def.key].pending,
      });
    }
    if (before[def.key].in_progress !== after[def.key].in_progress) {
      drifts.push({
        agent: def.key,
        field: 'tasks_in_progress',
        old_value: before[def.key].in_progress,
        new_value: after[def.key].in_progress,
      });
    }
  }

  if (drifts.length === 0 && !structuralRepairs) {
    console.log('No-op: all counters already match actual queue state.');
    for (const def of AGENTS) {
      console.log(
        '  ' +
          def.key +
          '.tasks_pending=' +
          after[def.key].pending +
          ', ' +
          def.key +
          '.tasks_in_progress=' +
          after[def.key].in_progress
      );
    }
    process.exit(0);
  }

  for (const def of AGENTS) {
    q.agents[def.key].tasks_pending = after[def.key].pending;
    q.agents[def.key].tasks_in_progress = after[def.key].in_progress;
  }
  q.last_updated = new Date().toISOString();

  const tmp = QUEUE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(q, null, 2) + '\n');
  fs.renameSync(tmp, QUEUE_PATH);

  if (drifts.length > 0) {
    console.log('Drift detected in ' + drifts.length + ' counter(s):');
    for (const d of drifts) {
      console.log(
        '  agents.' +
          d.agent +
          '.' +
          d.field +
          ': ' +
          d.old_value +
          ' \u2192 ' +
          d.new_value
      );
    }
  } else {
    console.log('Structural repairs persisted (no counter drift).');
  }
  console.log('Atomic write complete. last_updated: ' + q.last_updated);
}

main();
