import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProposalsClient } from './client';
import { PROPOSAL_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Коммерческие предложения',
  description: 'Создание и управление коммерческими предложениями',
};

export default async function ProposalsPage() {
  await requireAuthPage();

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany(PROPOSAL_LIST_QUERY_ARGS),
    prisma.proposal.count(),
  ]);

  return <ProposalsClient initialData={proposals} initialTotal={total} />;
}
