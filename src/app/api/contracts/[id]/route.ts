import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
// Cycle 51 (B.3): live workflow вместо VALID_TRANSITIONS.
import { assertTransitionAllowed, WorkflowError } from '@/lib/status-workflow';
// Cycle 55 (B.4): protection to frozen-statuses.
import { assertNumberImmutable, NumberLockedError } from '@/lib/number-protection';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

const include = { items: true, customer: { select: { name: true } }, organization: true, proposal: true };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.contract.findUnique({ where: { id }, include });
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
    // Cycle 52 (B.6): manager-only mutation.
    await requireRole(['manager']);
    const { id } = await params;
    const body = await request.json();
    if (body.number) {
      // Cycle 55 (B.4): freeze number for active/completed statuses.
      const cur = await prisma.contract.findUnique({
        where: { id },
        select: { status: true, number: true },
      });
      if (!cur) return apiError('Не найдено', 404);
      try {
        assertNumberImmutable('contract', cur.status, body.number, cur.number);
      } catch (e) {
        if (e instanceof NumberLockedError) return apiError(e.message, 400);
        throw e;
      }
      const existing = await prisma.contract.findUnique({ where: { number: body.number } });
      if (existing && existing.id !== id) return apiError(`Документ с номером ${body.number} уже существует`, 400);
    }
    const item = await prisma.contract.update({ where: { id }, data: body, include });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Cycle 52 (B.6): manager-only delete.
    await requireRole(['manager']);
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

// Cycle 51 (B.3): VALID_TRANSITIONS удалён — теперь live query через assertTransitionAllowed.

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Cycle 52 (B.6): capture user.role для transition check.
    const user = await requireRole(['manager']);
    const { id } = await params;
    const { status, signedAt } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.contract.findUnique({ where: { id }, select: { status: true, signedAt: true } });
    if (!current) return apiError('Не найдено', 404);

    // Cycle 51 (B.3): live workflow + role-aware transition check.
    try {
      await assertTransitionAllowed('contract', current.status, status, user.role);
    } catch (error) {
      if (error instanceof WorkflowError) {
        if (error.code === 'TRANSITION_NOT_ALLOWED') {
          return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
        }
        if (error.code === 'INSUFFICIENT_ROLE') {
          return apiError(error.message, 403);
        }
      }
      throw error;
    }

    const data: Record<string, unknown> = { status };
    // Авто-дата подписания при переходе в active
    if (status === 'active' && !current.signedAt) {
      data.signedAt = signedAt || new Date().toISOString();
    }

    const item = await prisma.contract.update({ where: { id }, data, include });
    // Cycle 57 (B.7): audit event for status transition.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'update_status',
      entity: 'contract',
      entityId: id,
      details: { from: current.status, to: status, signedAt: data.signedAt ?? null },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
