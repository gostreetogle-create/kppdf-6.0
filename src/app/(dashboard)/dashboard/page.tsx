import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { H1, Muted } from '@/components/ui/typography';
import { Stack } from '@/components/ui/layout';
import DashboardClient from './client';

export const metadata: Metadata = {
  title: 'Дашборд',
  description: 'Главная панель управления с аналитикой и сводками',
};

export default async function DashboardPage() {
  await requireAuthPage();

  const [
    orgCount,
    productCount,
    proposalCount,
    proposalStatusCounts,
    contractCount,
    productionOrderCount,
    productCatCounts,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.product.count(),
    prisma.proposal.count(),
    prisma.proposal.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.contract.count(),
    prisma.productionOrder.count(),
    prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const overview = [
    { title: 'Организации', count: orgCount, href: '/organizations' },
    { title: 'Товары', count: productCount, href: '/products' },
    { title: 'Предложения', count: proposalCount, href: '/proposals' },
    { title: 'Договоры', count: contractCount, href: '/contracts' },
    { title: 'Заказы', count: productionOrderCount, href: '/production' },
  ];

  const proposalStats = proposalStatusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));

  const categoryStats = productCatCounts.map((c) => ({
    name: c.name,
    count: c._count.products,
  }));

  return (
    <Stack gap="xl">
      <H1>Дашборд</H1>
      <Muted>Данные загружены на сервере — без задержки</Muted>

      <DashboardClient
        overview={overview}
        proposalStats={proposalStats}
        categoryStats={categoryStats}
      />
    </Stack>
  );
}
