// Cycle 35 — render-site + nullable-interface fixes.
// Cycle-28-style Prisma-nullable alignment. Idempotent: re-run safe.
import fs from 'node:fs';

// (1) Convert Date.slice(0,n) to Date→ISO→slice (4 sites).
const fixes = [
  ['src/app/(dashboard)/proposals/client.tsx',
   /item\.validUntil\.slice\(0, 10\)/g,
   'new Date(item.validUntil).toISOString().slice(0, 10)'],
  ['src/app/(dashboard)/production/client.tsx',
   /item\.plannedStart\.slice\(0, 16\)/g,
   'new Date(item.plannedStart).toISOString().slice(0, 16)'],
  ['src/app/(dashboard)/production/client.tsx',
   /item\.plannedEnd\.slice\(0, 16\)/g,
   'new Date(item.plannedEnd).toISOString().slice(0, 16)'],
  ['src/app/(dashboard)/admin/tenders/client.tsx',
   /item\.deadline\.slice\(0, 10\)/g,
   'new Date(item.deadline).toISOString().slice(0, 10)'],
];

for (const [file, regex, replacement] of fixes) {
  const content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(regex, replacement);
  fs.writeFileSync(file, updated, 'utf8');
  const matches = (content.match(regex) || []).length;
  console.log(`${file}: ${matches} replacement(s)`);
}

// (2) Nullable-relation/field alignment in ProductionOrder interface.
// tsc flagged `workTypeId: string | null` not assignable to local `string`.
// Preemptively align `workCenterId` similarly for consistency.
const interfacePatches = [
  ['src/app/(dashboard)/production/client.tsx',
   '  workTypeId: string;\n  workCenterId: string;\n',
   '  workTypeId: string | null;\n  workCenterId: string | null;\n'],
];

for (const [file, find, replace] of interfacePatches) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(find)) {
    console.log(`${file}: no match (already aligned)`);
    continue;
  }
  const updated = content.replace(find, replace);
  fs.writeFileSync(file, updated, 'utf8');
  console.log(`${file}: interface patch applied`);
}
