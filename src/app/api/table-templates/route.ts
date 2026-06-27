import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateTableTemplateSchema } from '@/lib/validations/table-template';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const { page, limit } = parseSearchParams(new URL(request.url).searchParams);

    const [items, total] = await Promise.all([
      prisma.tableTemplate.findMany({
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tableTemplate.count(),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const body = await request.json();
    const validation = validateBody(body, CreateTableTemplateSchema);
    if (!validation.success) return validation.error;

    const template = await prisma.tableTemplate.create({
      data: {
        name: validation.data.name.trim(),
        description: validation.data.description || null,
        columns: validation.data.columns || '[]',
      },
    });

    return apiOk(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
