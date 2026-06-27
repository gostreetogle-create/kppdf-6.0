/**
 * clone-items.ts — Cycle 43 / Block 3.2: deep-copy ProposalItem rows для новой версии КП.
 *
 * Используется:
 *  - В POST /api/proposals/[id]/versions внутри prisma.$transaction
 *  - Может переиспользоваться в editor "Save as new version" в будущем
 *
 * Важно:
 *  - НЕ копирует ProductPhoto/ProductComponent — они в `Product`, ссылка через `productId` остаётся.
 *  - Копирует только ProposalItem rows с новыми id (cuid default) + установленным sourceItemId.
 *  - sourceItemId указывает на **immediate parent** (v3 source → v2 item, не v1).
 *  - Self-FK on ProposalItem.sourceItemId имеет onDelete: SetNull — soft cascade сохраняет audit-trail.
 *  - Вызывать внутри prisma.$transaction (tx — Prisma transaction client).
 */
import type { Prisma, PrismaClient } from '../../generated/prisma/client';

type TxClient = Prisma.TransactionClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface CloneableProposalItem {
  id: string;
  quantity: number;
  unitPrice: number;
  markupPercent: number | null;
  total: number;
  sortOrder: number;
  productId: string | null;
}

/**
 * Deep-copy list of ProposalItem под newProposalId, сохраняя lineage через sourceItemId.
 * Возвращает количество скопированных строк.
 */
export async function cloneProposalItems(
  tx: Pick<TxClient, 'proposalItem'>,
  originalItems: CloneableProposalItem[],
  newProposalId: string,
): Promise<number> {
  if (originalItems.length === 0) return 0;

  const data = originalItems.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    markupPercent: item.markupPercent ?? 0,
    total: item.total,
    sortOrder: item.sortOrder,
    productId: item.productId,
    proposalId: newProposalId,
    sourceItemId: item.id, // ← lineage на immediate parent
  }));

  const result = await tx.proposalItem.createMany({ data });
  return result.count;
}
