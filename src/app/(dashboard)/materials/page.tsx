import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { MaterialsClient } from './client';
import { MATERIAL_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Материалы',
  description: 'Справочник материалов и сырья для производства',
};

export default async function MaterialsPage() {
  await requireAuthPage();

  const [raw, total] = await Promise.all([
    prisma.material.findMany(MATERIAL_LIST_QUERY_ARGS),
    prisma.material.count(),
  ]);

  // Prisma returns null for optional fields; convert to undefined for client
  const materials = raw.map((m) => ({
    ...m,
    article: m.article ?? undefined,
    description: m.description ?? undefined,
    image: m.image ?? undefined,
    price: m.price ?? undefined,
    supplierId: m.supplierId ?? undefined,
    categoryId: m.categoryId ?? undefined,
    supplier: m.supplier ?? undefined,
    category: m.category ?? undefined,
  }));

  return <MaterialsClient initialData={materials} initialTotal={total} />;
}
