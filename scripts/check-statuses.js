/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const tables = [
  { table: 'Proposal', column: 'status' },
  { table: 'Contract', column: 'status' },
  { table: 'ProductionOrder', column: 'status' },
  { table: 'OrderTask', column: 'status' },
  { table: 'PurchaseRequest', column: 'status' },
  { table: 'SupplierOrder', column: 'status' },
  { table: 'IncomingInvoice', column: 'status' },
  { table: 'Shipment', column: 'status' },
  { table: 'OrderClosing', column: 'status' },
  { table: 'ReconciliationAct', column: 'status' },
  { table: 'Tender', column: 'status' },
  { table: 'RppEntry', column: 'status' },
  { table: 'Certificate', column: 'status' },
  { table: 'InventoryMovement', column: 'type' },
];

for (const t of tables) {
  try {
    const rows = db.prepare(`SELECT DISTINCT "${t.column}" FROM "${t.table}" WHERE "${t.column}" IS NOT NULL`).all();
    const values = rows.map(r => r[t.column]).filter(Boolean);
    console.log(t.table + '.' + t.column + ':', values.join(', ') || '(empty)');
  } catch (e) {
    console.log(t.table + ':', 'error -', e.message.slice(0, 80));
  }
}

db.close();
