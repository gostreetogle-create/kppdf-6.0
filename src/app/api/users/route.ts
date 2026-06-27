import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['username', 'displayName', 'email'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, username: true, displayName: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);
    const body = await request.json();

    if (!body.username || !body.password) {
      return apiError('Логин и пароль обязательны', 400);
    }

    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) {
      return apiError('Пользователь с таким логином уже существует', 409);
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const item = await prisma.user.create({
      data: {
        username: body.username,
        password: hashedPassword,
        displayName: body.displayName || body.username,
        email: body.email || null,
        phone: body.phone || null,
        role: body.role || 'viewer',
        isActive: body.isActive ?? true,
      },
      select: { id: true, username: true, displayName: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });

    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
