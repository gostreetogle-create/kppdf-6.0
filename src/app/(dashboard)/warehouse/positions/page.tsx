import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { PositionsClient } from './client';
import { STORAGE_ITEM_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Складские позиции',
  description: 'Остатки товаров и материалов на складах',
};

export default async function PositionsPage() {
  await requireAuthPage();

  const [items, total] = await Promise.all([
    prisma.storageItem.findMany(STORAGE_ITEM_LIST_QUERY_ARGS),
    prisma.storageItem.count(),
  ]);

  return <PositionsClient initialData={items} initialTotal={total} />;
}
