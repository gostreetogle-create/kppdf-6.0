import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {requireAuth, requireRole} from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateOrderClosingSchema } from '@/lib/validations/order-closing';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);
    const where: Record<string, unknown> = {};
    if (search) where.OR = ['number', 'notes'].map((f) => ({ [f]: { contains: search } }));
    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';
    const [items, total] = await Promise.all([
      prisma.orderClosing.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.orderClosing.count({ where }),
    ]);
    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['accountant']);
    const body = await request.json();
    const validation = validateBody(body, CreateOrderClosingSchema);
    if (!validation.success) return validation.error;
    if (validation.data.number) {
      const existing = await prisma.orderClosing.findUnique({ where: { number: validation.data.number } });
      if (existing) return apiError(`Документ с номером ${validation.data.number} уже существует`, 400);
    }
    const item = await prisma.orderClosing.create({ data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    // Cycle 60+: matrix tests uncovered that non-accountant roles got 500 instead of 403.
    // FORBIDDEN must be mapped to 403 before falling through to the catch-all 500.
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
