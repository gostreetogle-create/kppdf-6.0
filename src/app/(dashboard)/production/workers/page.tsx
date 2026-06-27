import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { WorkersClient } from './client';
import { WORKER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Работники',
  description: 'Справочник сотрудников производства',
};

export default async function WorkersPage() {
  await requireAuthPage();

  const [items, total] = await Promise.all([
    prisma.worker.findMany(WORKER_LIST_QUERY_ARGS),
    prisma.worker.count(),
  ]);

  return <WorkersClient initialData={items} initialTotal={total} />;
}
