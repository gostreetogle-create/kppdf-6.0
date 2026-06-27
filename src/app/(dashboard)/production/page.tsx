import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProductionClient } from './client';
import { PRODUCTION_ORDER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Производство',
  description: 'Управление производственными заказами',
};

export default async function ProductionPage() {
  await requireAuthPage();

  const [orders, total] = await Promise.all([
    prisma.productionOrder.findMany(PRODUCTION_ORDER_LIST_QUERY_ARGS),
    prisma.productionOrder.count(),
  ]);

  return <ProductionClient initialData={orders} initialTotal={total} />;
}
