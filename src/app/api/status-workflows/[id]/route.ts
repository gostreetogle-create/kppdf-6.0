import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { UpdateStatusWorkflowSchema } from '@/lib/validations/status-workflow';
import { validateBody } from '@/lib/validations';
// Cycle 51 (B.3): invalidate cache после admin evolution; param unused — always invalidate all.
import { invalidateStatusWorkflowCache } from '@/lib/status-workflow';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.statusWorkflow.findUnique({ where: { id } });
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
    await requireRole(['admin']);
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(body, UpdateStatusWorkflowSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.statusWorkflow.update({ where: { id }, data: validation.data });
    // Cycle 51 (B.3): invalidate ALL после PUT: если admin менял entity / fromStatus / toStatus,
    // мы не знаем previous values без re-read, а targeted invalidate только по new entity
    // оставит stale cache для old entity. invalidate() всего — cheaper than race.
    invalidateStatusWorkflowCache();
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['admin']);
    const { id } = await params;
    // Cycle 51 (B.3): invalidate ALL после DELETE — simpler и безопаснее (single round-trip).
    await prisma.statusWorkflow.delete({ where: { id } });
    invalidateStatusWorkflowCache();
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
