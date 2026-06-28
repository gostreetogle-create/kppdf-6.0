// Load .env from project root before reading DATABASE_URL (tsx does NOT auto-load .env).
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL not set. Create .env first.');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: false });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const proposalCount = await prisma.proposal.count();
    const contractCount = await prisma.contract.count();
    const productCount = await prisma.product.count();
    console.log(
      JSON.stringify(
        {
          ok: true,
          db: url.replace(/:[^:@]+@/, ':***@'),
          counts: {
            organization: orgCount,
            user: userCount,
            proposal: proposalCount,
            contract: contractCount,
            product: productCount,
          },
        },
        null,
        2,
      ),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ ok: false, error: msg.slice(0, 300) }, null, 2));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  }
})();
