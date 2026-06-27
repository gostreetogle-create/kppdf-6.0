// Seed script: populate OrgRole with base roles
// Usage: npx tsx scripts/seed-roles.ts
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const roles = [
  { name: 'Поставщик', slug: 'supplier' },
  { name: 'Клиент', slug: 'client' },
  { name: 'Партнёр', slug: 'partner' },
  { name: 'Подрядчик', slug: 'contractor' },
];

async function main() {
  console.log('Seeding OrgRole...');
  for (const role of roles) {
    const existing = await prisma.orgRole.findUnique({ where: { slug: role.slug } });
    if (!existing) {
      await prisma.orgRole.create({ data: role });
      console.log(`  + ${role.name} (${role.slug})`);
    } else {
      console.log(`  = ${role.name} (${role.slug}) — already exists`);
    }
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
