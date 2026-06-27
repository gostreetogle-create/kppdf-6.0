import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { UpdateIncomingInvoiceSchema } from '@/lib/validations/incoming-invoice';
import { validateBody } from '@/lib/validations';
// Cycle 51 (B.3): live workflow вместо VALID_TRANSITIONS.
import { assertTransitionAllowed, WorkflowError } from '@/lib/status-workflow';
// Cycle 55 (B.4): protection to frozen-statuses.
import { assertNumberImmutable, NumberLockedError } from '@/lib/number-protection';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.incomingInvoice.findUnique({ where: { id } });
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
    // Cycle 52 (B.6): accountant-only mutation закупок.
    await requireRole(['accountant']);
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(body, UpdateIncomingInvoiceSchema);
    if (!validation.success) return validation.error;
    if (validation.data.number) {
      // Cycle 55 (B.4): freeze number for paid status.
      const cur = await prisma.incomingInvoice.findUnique({
        where: { id },
        select: { status: true, number: true },
      });
      if (!cur) return apiError('Не найдено', 404);
      try {
        assertNumberImmutable('incomingInvoice', cur.status, validation.data.number, cur.number);
      } catch (e) {
        if (e instanceof NumberLockedError) return apiError(e.message, 400);
        throw e;
      }
      const existing = await prisma.incomingInvoice.findUnique({ where: { number: validation.data.number } });
      if (existing && existing.id !== id) return apiError(`Документ с номером ${validation.data.number} уже существует`, 400);
    }
    const item = await prisma.incomingInvoice.update({ where: { id }, data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Cycle 52 (B.6): accountant-only delete.
    await requireRole(['accountant']);
    const { id } = await params;
    await prisma.incomingInvoice.delete({ where: { id } });
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
    // Cycle 52 (B.6): accountant-only PATCH (оплата/овердью).
    const user = await requireRole(['accountant']);
    const { id } = await params;
    const { status } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.incomingInvoice.findUnique({ where: { id }, select: { status: true } });
    if (!current) return apiError('Не найдено', 404);

    // Cycle 51 (B.3): live workflow + role-aware transition check.
    try {
      await assertTransitionAllowed('incomingInvoice', current.status, status, user.role);
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

    const item = await prisma.incomingInvoice.update({ where: { id }, data: { status } });
    // Cycle 57 (B.7): audit event for status transition.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'update_status',
      entity: 'incoming_invoice',
      entityId: id,
      details: { from: current.status, to: status },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
