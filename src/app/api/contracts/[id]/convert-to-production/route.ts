import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextProductionOrderNumber } from '@/lib/counter';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

/**
 * Распределить задачи по рабочим дням, начиная с startDate.
 * Каждая задача получает plannedStart / plannedEnd исходя из estimatedHours
 * (1 день ≈ 8 рабочих часов). Выходные пропускаем.
 */
function distributeTasksByDays(
  tasks: { title: string; estimatedHours: number; sortOrder: number }[],
  startDate: Date,
): { title: string; estimatedHours: number; sortOrder: number; plannedStart: Date; plannedEnd: Date }[] {
  const WORK_HOURS_PER_DAY = 8;
  const current = new Date(startDate);

  return tasks.map((t) => {
    // Пропускаем выходные
    while (current.getDay() === 0 || current.getDay() === 6) {
      current.setDate(current.getDate() + 1);
    }
    const start = new Date(current);
    const daysNeeded = Math.max(1, Math.ceil(t.estimatedHours / WORK_HOURS_PER_DAY));
    current.setDate(current.getDate() + daysNeeded);
    // Снова пропускаем выходные
    while (current.getDay() === 0 || current.getDay() === 6) {
      current.setDate(current.getDate() + 1);
    }
    const end = new Date(current);
    return { ...t, plannedStart: start, plannedEnd: end };
  });
}

/**
 * Собрать данные по модулям товаров для создания детальных задач.
 * Для каждого ProductModule → ModuleWorkType создаётся OrderTask.
 */
async function buildModuleTasks(
  productIds: string[],
  itemQuantities: Map<string, number>,
): Promise<{ title: string; estimatedHours: number; sortOrder: number }[]> {
  const modules = await prisma.productModule.findMany({
    where: { productId: { in: productIds } },
    include: {
      workTypes: {
        include: { workType: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const tasks: { title: string; estimatedHours: number; sortOrder: number }[] = [];
  let order = 0;

  for (const mod of modules) {
    // Определяем количество = минимальное из всех товаров, содержащих этот модуль
    // (на практике модуль привязан к одному товару)
    const qty = (mod.productId ? itemQuantities.get(mod.productId) : undefined) || 1;

    for (const wt of mod.workTypes) {
      tasks.push({
        title: `${mod.name} — ${wt.workType.name}`,
        estimatedHours: wt.estimatedHours * qty,
        sortOrder: order++,
      });
    }

    // Если нет видов работ — создаём задачу на модуль целиком
    if (mod.workTypes.length === 0) {
      tasks.push({
        title: `Изготовление: ${mod.name}`,
        estimatedHours: 8 * qty,
        sortOrder: order++,
      });
    }
  }

  return tasks;
}

// POST /api/contracts/[id]/convert-to-production — конвертировать договор в производственный заказ
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(['manager']); // Cycle 57: capture user for activity log
    const { id } = await params;

    // Получаем договор с товарами и КП
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        items: true,
        customer: { select: { name: true } },
        organization: true,
        proposal: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    modules: {
                      include: {
                        workTypes: {
                          include: { workType: true },
                          orderBy: { sortOrder: 'asc' },
                        },
                      },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!contract) return apiError('Договор не найден', 404);
    if (contract.items.length === 0 && (!contract.proposal || contract.proposal.items.length === 0))
      return apiError('Договор не содержит товаров', 400);

    // Проверяем, не создан ли уже производственный заказ
    const existing = await prisma.productionOrder.findFirst({
      where: { contractId: id },
    });
    if (existing) {
      return apiError('Производственный заказ для этого договора уже существует', 400);
    }

    // Генерируем номер заказа
    const number = await nextProductionOrderNumber();

    // Определяем товары для производства (из договора или КП)
    const sourceItems = contract.items.length > 0
      ? contract.items
      : (contract.proposal?.items || []);

    // Собираем ID продуктов и их количества
    const productIds: string[] = [];
    const itemQuantities = new Map<string, number>();

    // Если есть proposalItems с productId — используем их
    if (contract.proposal?.items) {
      for (const pi of contract.proposal.items) {
        if (pi.productId) {
          productIds.push(pi.productId);
          itemQuantities.set(pi.productId, (itemQuantities.get(pi.productId) || 0) + pi.quantity);
        }
      }
    }

    // Пробуем построить детальные задачи из модулей товаров
    let taskDefs: { title: string; estimatedHours: number; sortOrder: number }[] = [];

    if (productIds.length > 0) {
      taskDefs = await buildModuleTasks(productIds, itemQuantities);
    }

    // Если не удалось построить модульные задачи — создаём по одной на товар
    if (taskDefs.length === 0) {
      taskDefs = sourceItems.map((item, index) => {
        const itemName = 'name' in item && item.name ? String(item.name)
          : (item as { product?: { name?: string } }).product?.name || `Позиция ${index + 1}`;
        return {
          title: itemName,
          estimatedHours: 8,
          sortOrder: index,
        };
      });
    }

    // Распределяем задачи по дням
    const now = new Date();
    const datedTasks = distributeTasksByDays(taskDefs, now);

    // Вычисляем плановые даты заказа
    const orderPlannedStart = datedTasks.length > 0 ? datedTasks[0].plannedStart : now;
    const orderPlannedEnd = datedTasks.length > 0 ? datedTasks[datedTasks.length - 1].plannedEnd : now;

    // Создаём производственный заказ с детальными задачами
    const [productionOrder] = await prisma.$transaction([
      prisma.productionOrder.create({
        data: {
          number,
          title: `Производство: ${contract.title || `Договор №${contract.number}`}`,
          status: 'planned',
          plannedStart: orderPlannedStart,
          plannedEnd: orderPlannedEnd,
          notes: contract.notes || '',
          contractId: id,
          proposalId: contract.proposalId,
          tasks: {
            create: datedTasks.map((t) => ({
              title: t.title,
              status: 'pending',
              estimatedHours: t.estimatedHours,
              plannedStart: t.plannedStart,
              plannedEnd: t.plannedEnd,
              sortOrder: t.sortOrder,
            })),
          },
        },
        include: { tasks: true, workType: true, workCenter: true },
      }),
      // Обновляем статус договора
      prisma.contract.update({
        where: { id },
        data: { status: 'active' },
      }),
    ]);

    const taskCount = productionOrder.tasks.length;
    // Cycle 57 (B.7): audit event for contract → production_order conversion.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'convert_to_production',
      entity: 'contract',
      entityId: id,
      details: {
        targetEntity: 'production_order',
        targetId: productionOrder.id,
        targetNumber: productionOrder.number,
        tasksCount: taskCount,
      },
    });
    return apiOk(productionOrder, `Производственный заказ №${number} создан (${taskCount} задач)`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
