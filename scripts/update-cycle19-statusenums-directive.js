#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Idempotent agent-queue updater. Augments cycle-19-status-enums.description
 * with divergence findings (Proposal paid | ProductionOrder manufacturing/painting/shipping
 * | rpp-entry loose z.string()) and appends a pre-flight DISTINCT-check gate task.
 *
 * Pattern mirrors scripts/append-cycle23-queue.js v1.0.1:
 *  - Idempotency: Set-based filter, no-op when task already present.
 *  - Atomic write: tmp file + rename.
 *  - Cycle counter: Math.max(current, 19).
 *
 * Run: node scripts/update-cycle19-statusenums-directive.js
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.resolve(__dirname, '..', 'agent-queue.json');

const NEAR_DIRECTIVE = [
  'Prisma enums for statuses (P1 data integrity) — DIVERGENCE-AWARE DIRECTIVE',
  '',
  'Pre-flight first (cycle-19-pre-flight-distinct-check MUST be done before prisma migrate dev):',
  '  - 11 affected tables: Proposal, Contract, ProductionOrder, OrderTask, PurchaseRequest,',
  '    SupplierOrder, IncomingInvoice, Shipment, OrderClosing, ReconciliationAct,',
  '    FinancialReport, Tender, RppEntry, Certificate, InventoryMovement (type field).',
  '  - SELECT DISTINCT <field> FROM <table> — manual verify all values are in target enum.',
  '  - For InventoryMovement.type specifically: in/out/transfer (3 values).',
  '  - If any rogue value emerges → backfill BEFORE enum migration (UPDATE column SET status=new WHERE status=old).',
  '',
  'Schema is SOURCE OF TRUTH (Zod is subservient):',
  '  - Proposal.status must include "paid" (Zod already has it via ProposalStatusSchema;',
  '    add to schema enum so PUT /api/proposals/:id accepts paid).',
  '  - ProductionOrder.status must include manufacturing | painting | shipping (Zod has these,',
  '    schema currently only planned/in_progress/completed/cancelled — EXPAND schema enum).',
  '  - RppEntry.status: current z.string().max(50) is loose. UPGRADE both schema enum AND Zod simultaneously',
  '    (or DB will reject Zod-accepted values). Use rpp-entry enum values: draft | sent | accepted | rejected | archived.',
  '',
  'Enums to create in prisma/schema.prisma (15+):',
  '  enum ProposalStatus { draft sent accepted rejected paid converted }',
  '  enum ContractStatus { draft active completed cancelled }',
  '  enum ProductionStatus { planned in_progress manufacturing painting shipping completed cancelled }',
  '  enum OrderTaskStatus { pending in_progress completed blocked }',
  '  enum PurchaseRequestStatus { draft approved ordered received cancelled }',
  '  enum SupplierOrderStatus { draft confirmed shipped delivered cancelled }',
  '  enum IncomingInvoiceStatus { draft paid overdue }',
  '  enum ShipmentStatus { draft partially shipped cancelled }',
  '  enum OrderClosingStatus { draft approved completed }',
  '  enum ReconciliationActStatus { draft signed }',
  '  enum FinancialReportStatus { draft published }',
  '  enum TenderStatus { draft submitted won lost cancelled }',
  '  enum RppEntryStatus { draft sent accepted rejected archived }',
  '  enum CertificateStatus { active expired revoked }',
  '  enum MovementType { in out transfer }',
  '',
  'Secondary enums (have free-form fields today, low risk to hoist to enum):',
  '  enum UserRole { admin manager production storekeeper accountant viewer }',
  '  enum WorkerRole { worker senior_lead master }  // value-by-value choice based on existing data',
  '  enum HistoryAction { created status_changed task_completed task_assigned note_added converted }',
  '  enum ClosingType { full partial }',
  '  enum ReportType { monthly quarterly yearly }',
  '  enum ProductType { purchased manufactured }',
  '  enum InventoryFileType { dwg dxf pdf }   // shared by ProductComponent + InventorFile',
  '',
  'Fields NOT to migrate (keep free-form String):',
  '  StatusWorkflow.fromStatus/toStatus — explicit by design (workflow over entity status,',
  '    future-proofing if entity enums change). RAL codes (ralCode), addresses (`String?`),',
  '    notes, dimensions, filenames.',
  '',
  'Migration order (one Prisma migrate dev call):',
  '  1. Add enum declarations to schema.prisma.',
  '  2. Replace `status String @default(...)` with `status EnumType @default(MEMBER)` on affected fields.',
  '  3. Run prisma migrate dev --name add-status-enums (NOT --create-only).',
  '  4. SQLite stores enums as TEXT + CHECK constraint — verify in generated migration SQL.',
  '  5. Regenerate client (npx prisma generate). src/generated/prisma/* rewrites automatically.',
  '  6. UPDATE existing rows to remap old names → enum members if needed (light manual migration',
  '     in same migrate file using Prisma SQL tags, validated by pre-flight).',
  '',
  'Validation gate (must all pass):',
  '  tsc 0 errors, eslint 0 errors + 0 warnings, vitest 64/64,',
  '  curl smoke: PUT /api/proposals/:id with status=paid returns 200 (was 500 before fix),',
  '  curl smoke: PUT /api/production-orders/:id with status=manufacturing returns 200.',
  '',
  'Out-of-scope (DEFER to circle-22 SQLite→Postgres migration):',
  '  Converting CHECK constraints to native Postgres enum types (still TEXT + CHECK on SQLite).',
  '  cycle-22 picks up provider-level concerns.',
  '',
  'Files to touch (single transaction in MiMo editor):',
  '  prisma/schema.prisma, src/lib/validations/proposal.ts (validate enum vs new schema),',
  '  src/lib/validations/contract.ts (validate), src/lib/validations/production-order.ts (validate),',
  '  src/lib/validations/order-closing.ts (validate), src/lib/validations/certificate.ts (validate),',
  '  src/lib/validations/purchase-request.ts, src/lib/validations/supplier-order.ts,',
  '  src/lib/validations/incoming-invoice.ts, src/lib/validations/reconciliation-act.ts,',
  '  src/lib/validations/tender.ts, src/lib/validations/rpp-entry.ts (also tighten schema),',
  '  src/lib/constants/statuses.tsx (key Record<EnumType, StatusConfig> — already supports maps,',
  '    just need tighter types post-regen).',
  '',
  'After: node agent-cli.js mimo done cycle-19-status-enums',
].join('\n');

const GATE_TASK = {
  id: 'cycle-19-pre-flight-distinct-check',
  title: 'Pre-flight SELECT DISTINCT check (gate before schema enum migration)',
  description: [
    'CRITICAL gate for cycle-19-status-enums. Run BEFORE any prisma migrate dev call.',
    'Пред-миграционная валидация всех 11 affected таблиц — без неё ALTER TABLE может провалитьcя.',
    '',
    'Per-table queries (run against dev.db, expecting zero rogue rows):',
    '  SELECT DISTINCT status FROM Proposal;',
    '  SELECT DISTINCT status FROM Contract;',
    '  SELECT DISTINCT status FROM ProductionOrder;',
    '  SELECT DISTINCT status FROM OrderTask;',
    '  SELECT DISTINCT status FROM PurchaseRequest;',
    '  SELECT DISTINCT status FROM SupplierOrder;',
    '  SELECT DISTINCT status FROM IncomingInvoice;',
    '  SELECT DISTINCT status FROM Shipment;',
    '  SELECT DISTINCT status FROM OrderClosing;',
    '  SELECT DISTINCT status FROM ReconciliationAct;',
    '  SELECT DISTINCT status FROM FinancialReport;',
    '  SELECT DISTINCT status FROM Tender;',
    '  SELECT DISTINCT status FROM RppEntry;',
    '  SELECT DISTINCT status FROM Certificate;',
    '  SELECT DISTINCT type FROM InventoryMovement;',
    '',
    'Cross-check against target enum sets:',
    '  Proposal       → { draft, sent, accepted, rejected, paid, converted }',
    '  Contract       → { draft, active, completed, cancelled }',
    '  ProductionOrder → { planned, in_progress, manufacturing, painting, shipping, completed, cancelled }',
    '  OrderTask      → { pending, in_progress, completed, blocked }',
    '  PurchaseRequest → { draft, approved, ordered, received, cancelled }',
    '  SupplierOrder   → { draft, confirmed, shipped, delivered, cancelled }',
    '  IncomingInvoice → { draft, paid, overdue }',
    '  Shipment        → { draft, partially, shipped, cancelled }',
    '  OrderClosing    → { draft, approved, completed }',
    '  ReconciliationAct → { draft, signed }',
    '  FinancialReport → { draft, published }',
    '  Tender          → { draft, submitted, won, lost, cancelled }',
    '  RppEntry        → { draft, sent, accepted, rejected, archived }',
    '  Certificate     → { active, expired, revoked }',
    '  InventoryMovement.type → { in, out, transfer }',
    '',
    'Rogue detection script (recommended): scripts/check-status-enum-coverage.sh',
    'Iterates all 15 SELECT DISTINCT queries, compares against expected enum member set,',
    'fails (exit 1) if any rogue value detected. Outputs diff.',
    '',
    'Files to create:',
    '  scripts/check-status-enum-coverage.sh (gate script, exit code 1 on rogue).',
    '',
    'Acceptance:',
    'All 15 SELECT DISTINCT queries return only enum-compatible values.',
    'Stage output preserved in audit-log.md (paste query rows OR script invocation result).',
    'If rogue values: STOP cycle-19-status-enums. Backfill UPDATE old→new first, then re-run gate.',
  ].join('\n'),
  priority: 0,
  status: 'pending',
  assignee: 'mimo',
  dependencies: [],
  acceptance: [
    '15 SELECT DISTINCT queries produce zero rogue values',
    'scripts/check-status-enum-coverage.sh exits 0 on a clean dev.db',
    'Rogue detection: backfill UPDATE documented (if any)',
    'Stage output pasted into audit-log.md',
  ],
  created_at: new Date().toISOString(),
};

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
}

function findIdx(q, id) {
  return q.tasks.findIndex((t) => t.id === id);
}

function augmentDescription() {
  // Replace completely — divergence-aware directive is the new authoritative version.
  return NEAR_DIRECTIVE;
}

function main() {
  const q = loadQueue();

  const targetIdx = findIdx(q, 'cycle-19-status-enums');
  if (targetIdx === -1) {
    console.error('FATAL: cycle-19-status-enums task not found in queue — nothing was appended.');
    process.exit(1);
  }

  const target = q.tasks[targetIdx];
  const newDescription = augmentDescription(target.description);

  const sameDescription = (target.description || '').trim() === newDescription;
  const gateIdx = findIdx(q, GATE_TASK.id);
  const gateAlreadyExists = gateIdx !== -1;

  if (sameDescription && gateAlreadyExists) {
    console.log(
      'No-op: cycle-19-status-enums directive already updated, and gate task '
        + GATE_TASK.id
        + ' is already in queue.'
    );
    process.exit(0);
  }

  // Apply description augmentation.
  q.tasks[targetIdx] = { ...target, description: newDescription };

  // Append gate task if missing.
  if (!gateAlreadyExists) {
    GATE_TASK.created_at = new Date().toISOString();
    q.tasks.push(GATE_TASK);
    console.log('Appended gate task: ' + GATE_TASK.id);
  } else {
    console.log('Gate task ' + GATE_TASK.id + ' already present, skipping append.');
  }

  q.last_updated = new Date().toISOString();
  q.cycle = Math.max(19, q.cycle || 0);

  // Atomic write.
  const tmp = QUEUE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(q, null, 2) + '\n');
  fs.renameSync(tmp, QUEUE_PATH);

  console.log('Update applied \u2014 description enriched, gate appended (or kept).');
  console.log('  total tasks: ' + q.tasks.length);
  console.log('  cycle: ' + q.cycle);
  console.log('  last_updated: ' + q.last_updated);
  console.log(
    '  cycle-19-status-enums.description length: '
      + String(q.tasks[targetIdx].description.length)
  );
}

main();
