import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateOrganizationSchema, OrganizationType } from '@/lib/validations/organization';
import { validateBody } from '@/lib/validations';
import { getCached, invalidateByPrefix } from '@/lib/cache';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

const CACHE_PREFIX = 'organizations';
const LIST_TTL = 30 * 1000;

// Cycle 54 / P2.1 — нормализация дискриминатора для backward-compat.
// Принимает rawBody.type (string | undefined) или любую form-coerced вариацию,
// возвращает валидный OrganizationType literal. Невалидные значения → 'legal'
// fallback. Используется в POST перед Zod DU parse.
const VALID_ORG_TYPES: OrganizationType[] = ['legal', 'entrepreneur', 'individual'];
export function pickValidType(raw: unknown): OrganizationType {
  if (typeof raw !== 'string') return 'legal';
  return (VALID_ORG_TYPES as string[]).includes(raw) ? (raw as OrganizationType) : 'legal';
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);
    const roleSlug = searchParams.get('role');

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const baseWhere: Record<string, unknown> = roleSlug
      ? { roles: { some: { slug: roleSlug } } }
      : {};

    if (search) {
      const where = {
        ...baseWhere,
        OR: ['name', 'shortName', 'inn'].map((f) => ({ [f]: { contains: search } })),
      };
      const [items, total] = await Promise.all([
        prisma.organization.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { roles: true } }),
        prisma.organization.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_${roleSlug || 'all'}_p${page}_l${limit}_s${sortField || 'createdAt'}_${sortOrder || 'desc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.organization.findMany({ where: baseWhere, orderBy, skip: (page - 1) * limit, take: limit, include: { roles: true } }),
        prisma.organization.count({ where: baseWhere }),
      ]);
      return { items, total };
    }, LIST_TTL);

    return apiPaginated(result.items, result.total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

// POST /api/organizations — создать организацию-контрагента.
// D-A1 batch 2 (cycle 47-extension): CRM managers register counterparties.
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['manager']); // Cycle 57: capture user for activity log
    const rawBody = await request.json();
    // Cycle 54 / P2.1 — backward-compat: UI OrganizationForm не отправляет `type`.
    // Сервер инжектит дефолт 'legal' (юр.лицо) если поле отсутствует/пустое/нестрока,
    // чтобы Zod discriminatedUnion не падал на старых payload'ах.
    // Когда UI получит dropdown выбора типа контрагента — fallback можно убрать,
    // но нормализация пустой строки остаётся (защита от rawBody.type === '').
    const candidateType = pickValidType(rawBody?.type);
    const body = { ...(rawBody && typeof rawBody === 'object' ? rawBody : {}), type: candidateType };
    const validation = validateBody(body, CreateOrganizationSchema);
    if (!validation.success) return validation.error;
    const { roleIds, contactPersonIds, ...orgData } = validation.data;
    const item = await prisma.organization.create({
      data: {
        ...orgData,
        roles: roleIds?.length ? { connect: roleIds.map((id: string) => ({ id })) } : undefined,
        contacts: contactPersonIds?.length
          ? { create: contactPersonIds.map((personId: string) => ({ personId })) }
          : undefined,
      },
      include: { roles: true, contacts: { include: { person: { select: { lastName: true, firstName: true, patronymic: true } } } } },
    });
    invalidateByPrefix(CACHE_PREFIX);
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'organization',
      entityId: item.id,
      details: { name: item.name, inn: item.inn },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
