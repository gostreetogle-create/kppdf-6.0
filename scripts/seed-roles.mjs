// Seed script: populate OrgRole with base roles
// Usage: node scripts/seed-roles.mjs
import { PrismaClient } from '../generated/prisma/client/index.js';

const prisma = new PrismaClient();

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
