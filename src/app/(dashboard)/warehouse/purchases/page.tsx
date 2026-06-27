import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { PurchasesClient } from './client';
import { PURCHASE_REQUEST_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Заявки на закупку',
  description: 'Журнал заявок на закупку материалов',
};

export default async function PurchasesPage() {
  await requireAuthPage();

  const [items, total] = await Promise.all([
    prisma.purchaseRequest.findMany(PURCHASE_REQUEST_LIST_QUERY_ARGS),
    prisma.purchaseRequest.count(),
  ]);

  return <PurchasesClient initialData={items} initialTotal={total} />;
}
