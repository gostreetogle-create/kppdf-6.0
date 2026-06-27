import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ContractsClient } from './client';
import { CONTRACT_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Договоры',
  description: 'Реестр договоров с контрагентами',
};

export default async function ContractsPage() {
  await requireAuthPage();

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany(CONTRACT_LIST_QUERY_ARGS),
    prisma.contract.count(),
  ]);

  return <ContractsClient initialData={contracts} initialTotal={total} />;
}
