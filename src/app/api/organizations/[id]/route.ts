import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { invalidateByPrefix } from '@/lib/cache';
import { UpdateOrganizationSchema, applyTypeAwareValidation, OrganizationType } from '@/lib/validations/organization';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';

const CACHE_PREFIX = 'organizations';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.organization.findUnique({
      where: { id },
      include: { roles: true, contacts: { include: { person: { select: { lastName: true, firstName: true, patronymic: true } } } } },
    });
    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await request.json();
    // Cycle 54 / P2.1 — load DB entity first to run type-aware refinement (ИНН/КПП
    // зависят от типа контрагента: legal=10 цифр, entrepreneur/individual=12, КПП
    // только у legal). Если не найден → 404.
    const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true, type: true } });
    if (!existing) return apiError('Не найдено', 404);
    // Defensive guard: CHECР constraint не включён в миграции (см. migration.sql),
    // поэтому теоретически в БД может оказаться неизвестный type. Проверяем явно.
    const VALID_TYPES: OrganizationType[] = ['legal', 'entrepreneur', 'individual'];
    if (!VALID_TYPES.includes(existing.type as OrganizationType)) {
      return apiError('Некорректный тип контрагента в БД', 500);
    }
    const validation = validateBody(body, UpdateOrganizationSchema);
    if (!validation.success) return validation.error;
    // Сбор errors от applyTypeAwareValidation в mock-контекст (наша helper
    // принимает z.RefinementCtx — нам нужен только addIssue + params).
    const typeErrors: string[] = [];
    const mockCtx = {
      addIssue: (issue: { message?: string; path?: (string | number)[] }) => {
        typeErrors.push(`${issue.path?.join('.') ?? '?'}: ${issue.message ?? ''}`);
      },
    } as unknown as z.RefinementCtx;
    applyTypeAwareValidation(validation.data, existing.type as OrganizationType, mockCtx);
    if (typeErrors.length > 0) {
      return apiError(`Ошибка валидации: ${typeErrors.join('; ')}`, 400);
    }
    const { roleIds, contactPersonIds, ...orgData } = validation.data;
    const item = await prisma.organization.update({
      where: { id },
      data: {
        ...orgData,
        roles: roleIds?.length
          ? { set: [], connect: roleIds.map((id: string) => ({ id })) }
          : undefined,
        // Замена контактов: удаляем старые, добавляем новые
        contacts: contactPersonIds !== undefined
          ? {
              deleteMany: {},
              create: contactPersonIds.map((personId: string) => ({ personId })),
            }
          : undefined,
      },
      include: { roles: true, contacts: { include: { person: { select: { lastName: true, firstName: true, patronymic: true } } } } },
    });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    await prisma.organization.delete({ where: { id } });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
