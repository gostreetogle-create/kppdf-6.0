import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getCached } from '@/lib/cache';

export async function GET() {
  try {
    await requireAuth();

    const result = await getCached('dashboard_aggregated', async () => {
      const [
        orgCount,
        productCount,
        proposalCount,
        proposalStatusCounts,
        contractCount,
        productionOrderCount,
        productCatCounts,
        recentProposals,
        recentOrders,
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
        prisma.proposal.findMany({
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            createdAt: true,
            customer: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.productionOrder.findMany({
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            plannedStart: true,
            plannedEnd: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        overview: [
          { title: 'Организации', count: orgCount, href: '/organizations' },
          { title: 'Товары', count: productCount, href: '/products' },
          { title: 'Предложения', count: proposalCount, href: '/proposals' },
          { title: 'Договоры', count: contractCount, href: '/contracts' },
          { title: 'Заказы', count: productionOrderCount, href: '/production' },
        ],
        proposalStats: proposalStatusCounts.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        categoryStats: productCatCounts.map((c) => ({
          name: c.name,
          count: c._count.products,
        })),
        recentProposals,
        recentOrders,
      };
    }, 60 * 1000);

    return apiOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return apiError('Не авторизован', 401);
    }
    console.error('Dashboard aggregated error:', error);
    return apiError('Ошибка загрузки статистики', 500);
  }
}
