import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { TendersClient } from './client';
import { TENDER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Тендеры',
  description: 'Управление тендерами и закупочными процедурами',
};

export default async function TendersPage() {
  await requireAuthPage();

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany(TENDER_LIST_QUERY_ARGS),
    prisma.tender.count(),
  ]);

  return <TendersClient initialData={tenders} initialTotal={total} />;
}
