import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProductsClient } from './client';
import { PRODUCT_LIST_QUERY_ARGS, PRODUCT_CATEGORY_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Товары',
  description: 'Справочник товаров и услуг с категориями',
};

export default async function ProductsPage() {
  await requireAuthPage();

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany(PRODUCT_LIST_QUERY_ARGS),
    prisma.product.count(),
    prisma.productCategory.findMany(PRODUCT_CATEGORY_LIST_QUERY_ARGS),
  ]);

  return (
    <ProductsClient
      initialData={products}
      initialTotal={total}
      categories={categories}
    />
  );
}
