import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { WarehouseClient } from './client';
import { WAREHOUSE_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Склад',
  description: 'Управление складами и складскими остатками',
};

export default async function WarehousePage() {
  await requireAuthPage();

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany(WAREHOUSE_LIST_QUERY_ARGS),
    prisma.warehouse.count(),
  ]);

  // WAREHOUSE_LIST_QUERY_ARGS types findMany as `Warehouse[]` (Prisma base model).
  // Structural-compat with the client's permissive local interface (incl. `address: string | null`).
  return <WarehouseClient initialData={warehouses} initialTotal={total} />;
}
