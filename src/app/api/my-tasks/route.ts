import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiOk, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/my-tasks?workerId=xxx
 * Возвращает задачи назначенные конкретному работнику.
 * Если workerId не указан, пытается найти Worker по displayName текущего пользователя.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('Не авторизован', 401);

    const { searchParams } = new URL(request.url);
    let workerId = searchParams.get('workerId');

    // Если workerId не передан — ищем Worker по displayName пользователя
    if (!workerId && user.displayName) {
      const parts = user.displayName.split(' ').filter(Boolean);
      const firstName = parts[0] || '';
      const lastName = parts[1]?.trim() || undefined;
      const workers = await prisma.worker.findMany({
        where: {
          // P2.3: tighten `contains` → `equals` чтобы избежать privacy leak при похожих displayName
          // (бывший `contains` мог случайно матчить worker "Иван Петрович" по одному displayName="Иван")
          firstName: { equals: firstName },
          ...(lastName ? { lastName: { equals: lastName } } : {}),
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: 1,
      });
      if (workers.length > 0) {
        workerId = workers[0].id;
      }
    }

    if (!workerId) {
      return apiOk({ worker: null, tasks: [] }, 'Укажите workerId или настройте displayName пользователя');
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!worker) return apiError('Работник не найден', 404);

    const tasks = await prisma.orderTask.findMany({
      where: { workerId },
      orderBy: { sortOrder: 'asc' },
      include: {
        order: { select: { id: true, number: true, title: true, status: true } },
        workType: { select: { id: true, name: true } },
        workCenter: { select: { id: true, name: true } },
      },
    });

    return apiOk({ worker, tasks });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
