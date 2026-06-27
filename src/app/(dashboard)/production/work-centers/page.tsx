import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { WorkCentersClient } from './client';
import { WORK_CENTER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Рабочие центры',
  description: 'Справочник производственных рабочих центров и оборудования',
};

export default async function WorkCentersPage() {
  await requireAuthPage();

  const [items, total] = await Promise.all([
    prisma.workCenter.findMany(WORK_CENTER_LIST_QUERY_ARGS),
    prisma.workCenter.count(),
  ]);

  return <WorkCentersClient initialData={items} initialTotal={total} />;
}
