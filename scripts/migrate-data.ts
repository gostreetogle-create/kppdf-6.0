#!/usr/bin/env node
/**
 * scripts/migrate-data.ts — Перенос данных из SQLite (dev.db) в PostgreSQL.
 *
 * Запуск:  DATABASE_URL="postgresql://user:pass@localhost:5432/kppdf?sslmode=disable" npx tsx scripts/migrate-data.ts
 *   или:   npm run db:migrate-data
 *
 * Требования:
 *   - better-sqlite3 должен быть установлен: npm install --save-dev better-sqlite3
 *   - DATABASE_URL должен указывать на существующую PostgreSQL БД (схема уже создана через prisma migrate)
 *   - Файл dev.db (старый SQLite) должен существовать в корне проекта
 *
 * Идемпотентность: пропускает записи с существующим id (findUnique перед create).
 * Порядок таблиц: сначала родительские, затем зависимые.
 *
 * После миграции:
 *   - dev.db можно удалить
 *   - better-sqlite3 можно удалить: npm uninstall better-sqlite3
 *   - Убедись, что все данные на месте через админку
 *
 * Cycle v3.4 — one-time migration from SQLite to PostgreSQL.
 */

// better-sqlite3 импортируется динамически — он не обязан быть установлен
// для компиляции этого скрипта. Ошибка "not found" будет показана в runtime
// с понятной инструкцией.

import { createRequire } from 'node:module';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const _require = createRequire(import.meta.url);

// ============================================================
// CONFIG
// ============================================================

const SQLITE_PATH = 'dev.db';
const BATCH_SIZE = 100;

// ============================================================
// HELPERS
// ============================================================

interface TableConfig {
  name: string;
  idempotent: boolean;
}

// All 47 models in dependency-safe order
const TABLES: TableConfig[] = [
  { name: 'Counter',           idempotent: true },
  { name: 'User',              idempotent: true },
  { name: 'Organization',      idempotent: true },
  { name: 'OrgRole',           idempotent: true },
  { name: 'WorkType',          idempotent: true },
  { name: 'WorkCenter',        idempotent: true },
  { name: 'Worker',            idempotent: true },
  { name: 'ProductCategory',   idempotent: true },
  { name: 'CartSession',       idempotent: true },
  { name: 'Warehouse',         idempotent: true },
  { name: 'PurchaseRequest',   idempotent: true },
  { name: 'SupplierOrder',     idempotent: true },
  { name: 'IncomingInvoice',   idempotent: true },
  { name: 'Shipment',          idempotent: true },
  { name: 'ReconciliationAct', idempotent: true },
  { name: 'FinancialReport',   idempotent: true },
  { name: 'Tender',            idempotent: true },
  { name: 'DocType',           idempotent: true },
  { name: 'DocumentTemplate',  idempotent: true },
  { name: 'TemplateBlock',     idempotent: true },
  { name: 'TableTemplate',     idempotent: true },
  { name: 'StatusWorkflow',    idempotent: true },
  { name: 'RppEntry',          idempotent: true },
  { name: 'Certificate',       idempotent: true },
  { name: 'OrderHistory',      idempotent: true },
  { name: 'UserActivity',      idempotent: true },
  { name: 'InventorFile',      idempotent: true },
  { name: 'FeatureFlag',       idempotent: true },
  { name: 'RateLimitEntry',    idempotent: true },
  { name: 'Product',           idempotent: true },
  { name: 'ProductPhoto',      idempotent: true },
  { name: 'ProductComponent',  idempotent: true },
  { name: 'ProductModule',     idempotent: true },
  { name: 'ModuleWorkType',    idempotent: true },
  { name: 'ModuleMaterial',    idempotent: true },
  { name: 'CartItem',          idempotent: true },
  { name: 'Proposal',          idempotent: true },
  { name: 'ProposalItem',      idempotent: true },
  { name: 'Contract',          idempotent: true },
  { name: 'ContractItem',      idempotent: true },
  { name: 'ProductionOrder',   idempotent: true },
  { name: 'OrderTask',         idempotent: true },
  { name: 'OrderClosing',      idempotent: true },
  { name: 'StorageItem',       idempotent: true },
  { name: 'InventoryMovement', idempotent: true },
  { name: 'PurchaseRequestItem', idempotent: true },
  { name: 'SupplierOrderItem', idempotent: true },
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== Data migration: SQLite → PostgreSQL ===');
  console.log('');

  // 1. Require better-sqlite3 (one-time migration dep, not always installed).
  let Database: any;
  try {
    Database = _require('better-sqlite3');
  } catch {
    console.error('✗ better-sqlite3 is not installed.');
    console.error('  Run: npm install --save-dev better-sqlite3@^12.11.1');
    console.error('  This is a one-time migration dependency — you can remove it after.');
    process.exit(1);
  }

  // 2. Open SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log(`✓ Connected to SQLite: ${SQLITE_PATH}`);

  // 3. Connect to PostgreSQL
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl) {
    console.error('✗ DATABASE_URL is not set. Point it to your PostgreSQL instance.');
    console.error('  Example: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kppdf?sslmode=disable"');
    process.exit(1);
  }
  if (!pgUrl.startsWith('postgresql://') && !pgUrl.startsWith('postgres://')) {
    console.error('✗ DATABASE_URL must use the postgresql:// protocol.');
    console.error(`  Got: ${pgUrl.substring(0, 30)}...`);
    console.error('  If you see "file:", you have a stale SQLite DATABASE_URL.');
    console.error('  Set it correctly: DATABASE_URL="postgresql://user:pass@localhost:5432/kppdf?sslmode=disable"');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: pgUrl, ssl: false });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('✓ Connected to PostgreSQL');

  // 4. Migrate each table
  let totalRows = 0;

  for (const table of TABLES) {
    const prismaModel = (prisma as any)[table.name.charAt(0).toLowerCase() + table.name.slice(1)];
    if (!prismaModel) {
      console.log(`  ⚠ Model "${table.name}" not found in PrismaClient, skipping`);
      continue;
    }

    let rows: Record<string, unknown>[];
    try {
      rows = sqlite.prepare(`SELECT * FROM "${table.name}"`).all() as Record<string, unknown>[];
    } catch {
      console.log(`  ⚠ Table "${table.name}" not found in SQLite, skipping`);
      continue;
    }

    if (rows.length === 0) {
      console.log(`  - ${table.name}: empty, skipped`);
      continue;
    }

    console.log(`  → ${table.name}: ${rows.length} rows`);
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
          if (table.idempotent && row.id) {
            const existing = await prismaModel.findUnique({
              where: { id: row.id as string },
            });
            if (existing) {
              skipped++;
              continue;
            }
          }

          await prismaModel.create({ data: row });
          inserted++;
        } catch (err: any) {
          if (err?.code === 'P2002' && table.idempotent) {
            skipped++;
          } else {
            console.error(`  ✗ Error inserting ${table.name} id=${row.id}: ${err?.message || err}`);
          }
        }
      }
    }

    totalRows += inserted;
    if (skipped > 0) {
      console.log(`    → inserted: ${inserted}, skipped (already exists): ${skipped}`);
    } else {
      console.log(`    → inserted: ${inserted}`);
    }
  }

  console.log('');
  console.log(`=== Migration complete: ${totalRows} total rows transferred ===`);

  await prisma.$disconnect();
  sqlite.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
