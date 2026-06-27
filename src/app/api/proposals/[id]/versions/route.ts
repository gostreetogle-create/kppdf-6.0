import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextProposalNumber } from '@/lib/counter';
import { cloneProposalItems } from '@/lib/proposals/clone-items';

/**
 * POST /api/proposals/[id]/versions — создать новую версию КП.
 *
 * Cycle 43 / Block 3.2.
 *
 * Поведение:
 *  1. Загружает parent proposal + items.
 *  2. Hard-block если parent уже superseded (была ошибка — теперь parent.supersededAt !== null).
 *  3. Внутри prisma.$transaction:
 *     - Создаёт new Proposal (number = nextProposalNumber(), version = parent.version + 1,
 *       parentProposalId = parent.id, status='draft', snapshot of fields).
 *     - cloneProposalItems копирует items с sourceItemId lineage.
 *     - Marks parent.supersededAt = NOW().
 *  4. Возвращает новое Proposal (без items для краткости).
 *
 * Auth: requireEditor (manager, production, accountant не имеют права — только admin/manager).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEditor();
    const { id } = await params;

    const parent = await prisma.proposal.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!parent) return apiError('КП не найдена', 404);
    if (parent.supersededAt) {
      return apiError('Нельзя создать новую версию из superseded КП', 400);
    }

    const newProposal = await prisma.$transaction(async (tx) => {
      const newNumber = await nextProposalNumber();

      const v = await tx.proposal.create({
        data: {
          number: newNumber,
          title: parent.title,
          status: 'draft',
          customerId: parent.customerId,
          organizationId: parent.organizationId,
          templateId: parent.templateId,
          markupPercent: parent.markupPercent,
          discountPercent: parent.discountPercent,
          vatRate: parent.vatRate,
          ralCode: parent.ralCode,
          notes: parent.notes,
          validUntil: parent.validUntil,
          parentProposalId: parent.id,
          version: parent.version + 1,
        },
      });

      // Clone items with lineage (sourceItemId → immediate parent item.id).
      await cloneProposalItems(tx, parent.items, v.id);

      // Mark parent as superseded.
      await tx.proposal.update({
        where: { id: parent.id },
        data: { supersededAt: new Date() },
      });

      return v;
    });

    return apiOk({ proposal: newProposal }, `Версия v${newProposal.version} создана`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    console.error('Create proposal version failed:', error);
    return apiError('Ошибка сервера', 500);
  }
}
