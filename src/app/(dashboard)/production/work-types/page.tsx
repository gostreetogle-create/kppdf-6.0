import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { WorkTypesClient } from './client';
import { WORK_TYPE_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Виды работ',
  description: 'Справочник видов работ для производственных заказов',
};

export default async function WorkTypesPage() {
  await requireAuthPage();

  const [items, total] = await Promise.all([
    prisma.workType.findMany(WORK_TYPE_LIST_QUERY_ARGS),
    prisma.workType.count(),
  ]);

  return <WorkTypesClient initialData={items} initialTotal={total} />;
}
