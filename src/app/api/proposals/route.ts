/**
 * GET /api/proposals      — список КП (RBAC: manager→свои; director/admin/accountant→все).
 * POST /api/proposals     — создание нового КП в атомарной транзакции:
 *                           counter increment (TRANSACT FOR UPDATE) → Proposal → ProposalItems.
 *
 * Future: cursor-based pagination, фильтры по status/customerId/ownerId через query params.
 * v2: Server-Sent Events для push updates.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuthOnly } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { nextProposalNumber } from '@/lib/counter';
import { proposalCreateSchema, computeLineTotal } from '@/lib/validations/proposal.schema';
import { serializeProposal, decimalToNumber } from '@/lib/serialize';
import { ProposalStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return requireAuthOnly(req, async (payload) => {
    // Manager видит только свои КП; director/admin/accountant — все.
    // STOREKEEPER/PRODUCTION/VIEWER — всё (read-only по другим эндпоинтам).
    const whereClause =
      payload.role === 'MANAGER' ? { createdById: payload.sub, isActive: true } : { isActive: true };

    const proposals = await prisma.proposal.findMany({
      where: whereClause,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        vatRate: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Сумма total по позициям для каждого КП (2 query, не N+1).
    const totals = await prisma.proposalItem.groupBy({
      by: ['proposalId'],
      _sum: { total: true },
      where: { proposalId: { in: proposals.map((p) => p.id) } },
    });
    const totalsMap = new Map(
      totals.map((t) => [t.proposalId, decimalToNumber(t._sum.total)]),
    );

    return NextResponse.json({
      items: proposals.map((p) => ({
        ...p,
        vatRate: decimalToNumber(p.vatRate),
        totalAmount: totalsMap.get(p.id) ?? 0,
      })),
      count: proposals.length,
    });
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return requireAuthOnly(req, async (payload) => {
    const raw = await req.json().catch(() => null);
    const parsed = proposalCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // 1. Авто-номер через Counter (атомарно, см. src/lib/counter.ts).
    const number = await nextProposalNumber();

    // 2. Snapshot полей Product (price, sku, name, unit) в ProposalItem.
    //    НЕ денормализация через налоги — только то что нужно для устойчивости КП при изменении справочника.
    const products = await prisma.product.findMany({
      where: { id: { in: input.items.map((it) => it.productId) }, isActive: true },
      select: { id: true, sku: true, name: true, unit: true, salePrice: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const it of input.items) {
      if (!productMap.has(it.productId)) {
        return NextResponse.json(
          { error: `Product ${it.productId} not found или архивирован` },
          { status: 400 },
        );
      }
    }

    // 3. Атомарная транзакция (Counter уже инкрементирован в nextProposalNumber; здесь — Proposal+Items).
    try {
      const created = await prisma.$transaction(async (tx) => {
        const proposal = await tx.proposal.create({
          data: {
            number,
            title: input.title,
            status: ProposalStatus.DRAFT,
            customerId: input.customerId,
            contractorId: input.contractorId,
            templateId: input.templateId ?? null,
            vatRate: input.vatRate,
            currency: 'RUB', // жёстко RUB v1
            paymentTermDays: input.paymentTermDays ?? null,
            packageTag: input.packageTag ?? null,
            notes: input.notes ?? null,
            validUntil: input.validUntil ?? null,
            createdById: payload.sub,
            items: {
              create: input.items.map((it, idx) => {
                const product = productMap.get(it.productId)!;
                // Цена позиции — переданная клиентом (price DOES change per agreement).
                // Снимок productPrice — salePrice на момент создания.
                const total = computeLineTotal(it.quantity, it.price, 0, it.discountPercent ?? null);
                return {
                  productId: it.productId,
                  quantity: it.quantity,
                  price: it.price,
                  productPriceSnapshot: product.salePrice,
                  discountPercent: it.discountPercent ?? null,
                  total,
                  productSku: product.sku,
                  productName: product.name,
                  productUnit: product.unit,
                  sortOrder: idx,
                  notes: it.notes ?? null,
                };
              }),
            },
          },
          include: { items: true },
        });
        return proposal;
      });

      return NextResponse.json(serializeProposal(created), { status: 201 });
    } catch (err) {
      console.error('[POST /api/proposals]', err);
      const message = err instanceof Error ? err.message : 'Internal';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
