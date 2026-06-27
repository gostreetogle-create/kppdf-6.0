import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { nextProposalNumber } from '@/lib/counter';
import { CreateProposalSchema } from '@/lib/validations/proposal';
import { validateBody } from '@/lib/validations';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['number', 'title'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { include: { product: true } }, customer: { select: { name: true } }, organization: true },
      }),
      prisma.proposal.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

// POST /api/proposals — создать КП.
// D-A1 (cycle 47-extension): POST → manager-only; GET остаётся requireAuth (read-only).
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['manager']); // Cycle 57: capture user for activity log
    const body = await request.json();
    const validation = validateBody(body, CreateProposalSchema);
    if (!validation.success) return validation.error;

    const number = validation.data.number || await nextProposalNumber();
    const existing = await prisma.proposal.findFirst({
      where: { number, version: 1 },
      select: { id: true },
    });
    if (existing) return apiError(`Документ с номером ${number} уже существует`, 400);

    const { items, ...data } = validation.data;
    const item = await prisma.proposal.create({
      data: {
        ...data,
        number,
        items: items ? { create: items } : undefined,
      },
      include: { items: { include: { product: true } }, customer: { select: { name: true } }, organization: true },
    });
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'proposal',
      entityId: item.id,
      details: { number: item.number, title: item.title },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
