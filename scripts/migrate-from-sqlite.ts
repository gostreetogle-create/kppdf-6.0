/**
 * scripts/migrate-from-sqlite.ts
 *
 * One-time data migration script: SQLite → PostgreSQL.
 *
 * Reads data from the old SQLite database file (dev.db in project root)
 * and inserts it into the PostgreSQL database via Prisma client.
 *
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx tsx scripts/migrate-from-sqlite.ts
 *
 * Requirements:
 *   - PostgreSQL running + schema applied (prisma db push or prisma migrate dev)
 *   - Old dev.db in project root
 *   - better-sqlite3 installed (temporarily: npm install better-sqlite3)
 *
 * Cycle v3.4 — FINAL migration. PostgreSQL-only.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

const SQLITE_DB_PATH = path.resolve(process.cwd(), 'dev.db');

/** Models to migrate, ordered by dependency (parents first). */
const TABLES = [
  'Counter', 'User', 'Organization', 'OrgRole', 'DocType',
  'WorkType', 'WorkCenter', 'Worker', 'ProductCategory',
  'Product', 'ProductPhoto', 'ProductComponent', 'ProductModule',
  'ModuleWorkType', 'ModuleMaterial', 'CartSession', 'CartItem',
  'Client', 'Proposal', 'ProposalItem', 'Contract', 'ContractItem',
  'ProductionOrder', 'OrderTask', 'Warehouse', 'StorageItem',
  'InventoryMovement', 'PurchaseRequest', 'PurchaseRequestItem',
  'SupplierOrder', 'SupplierOrderItem', 'IncomingInvoice', 'Shipment',
  'OrderClosing', 'ReconciliationAct', 'FinancialReport', 'Tender',
  'DocumentTemplate', 'TemplateBlock', 'TableTemplate', 'StatusWorkflow',
  'RppEntry', 'Certificate', 'OrderHistory', 'UserActivity',
  'InventorFile', 'FeatureFlag', 'RateLimitEntry',
];

async function main() {
  console.log('=== SQLite → PostgreSQL Migration Tool ===\n');

  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.warn(`⚠️  SQLite DB not found at: ${SQLITE_DB_PATH}`);
    console.warn('   No data to migrate — this is normal for a fresh install.');
    console.warn('   Run POST /api/seed or npm run seed to create initial data.\n');
    process.exit(0);
  }

  console.log(`📁 Found: ${SQLITE_DB_PATH}`);
  console.log(`📦 Size: ${(fs.statSync(SQLITE_DB_PATH).size / 1024 / 1024).toFixed(1)} MB\n`);

  const pgUrl = process.env.DATABASE_URL || '';
  if (!pgUrl.startsWith('postgresql://') && !pgUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL must point to PostgreSQL.');
    console.error(`   Got: ${pgUrl.substring(0, 40)}`);
    process.exit(1);
  }

  // better-sqlite3 for reading old DB
  let SqliteDb: new (p: string) => { prepare: (s: string) => { all: () => Record<string, unknown>[] }; close: () => void };
  try { SqliteDb = require('better-sqlite3'); }
  catch {
    console.error('❌ better-sqlite3 not installed. Run: npm install better-sqlite3');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: pgUrl, ssl: false });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const sqlite = new SqliteDb(SQLITE_DB_PATH);

  // List actual SQLite tables
  const existingTables: string[] = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'")
    .all()
    .map((r: Record<string, unknown>) => r['name'] as string);

  console.log(`📋 Tables in SQLite (${existingTables.length}): ${existingTables.join(', ')}\n`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = prisma as any;
  let total = 0;

  for (const model of TABLES) {
    const snake = model.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    const tbl = existingTables.find(t => t.toLowerCase() === snake);
    if (!tbl) { console.log(`⏭️  ${model}: table "${snake}" not in SQLite`); continue; }

    const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
    if (!m[modelKey]) { console.log(`⏭️  ${model}: Prisma model "${modelKey}" not found`); continue; }

    const rows = sqlite.prepare(`SELECT * FROM "${tbl}"`).all();
    if (!rows.length) { console.log(`⏭️  ${model}: empty`); continue; }

    // Convert SQLite types to Prisma-compatible types:
    // - Booleans: SQLite stores as 0/1 integers, Prisma expects true/false
    // - Dates: stored as ISO strings, Prisma accepts strings
    const boolFields = ['isActive','isDefault','isMain','showLine','hasPassport','hasDrawing','isPurchased','enabledByDefault','isActive']; // prettier-ignore
    const converted = rows.map(r => {
      const c = { ...r };
      for (const key of Object.keys(c)) {
        if (boolFields.includes(key) && typeof c[key] === 'number') {
          c[key] = c[key] === 1;
        }
      }
      return c;
    });

    try {
      await m[modelKey].createMany({ data: converted, skipDuplicates: true });
      total += converted.length;
      console.log(`✅ ${model}: ${converted.length} rows`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⚠️  ${model}: createMany → ${msg.slice(0, 150)}`);
      console.log(`   → Trying fallback with individual creates...`);
      let ok = 0, fail = 0;
      for (const row of converted) {
        try { await m[modelKey].create({ data: row }); ok++; }
        catch { fail++; }
      }
      total += ok;
      console.log(`   → ${ok} ok, ${fail} failed`);
    }
  }

  console.log(`\n✅ Done. ${total} total rows migrated.`);
  sqlite.close();
  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
