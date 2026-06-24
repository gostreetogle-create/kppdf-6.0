/**
 * /api/proposals/[id] — GET/PUT/DELETE для одного КП.
 * RBAC ownership check: manager видит/правит/удаляет только созданные им.
 * Оптимистичная блокировка через `updatedAt` (АНАЛИЗ-П1): если поменялся между загрузкой и PUT → 409 Conflict.
 */import { NextResponse, type NextRequest } from 'next/server';
import { requireAuthOnly } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { proposalUpdateSchema, computeLineTotal } from '@/lib/validations/proposal.schema';
import { serializeProposal, decimalToNumber } from '@/lib/serialize';
import { ProposalStatus, Prisma } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return requireAuthOnly(req, async (payload) => {
    const { id } = await ctx.params;
    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        isActive: true,
        ...(payload.role === 'MANAGER' ? { createdById: payload.sub } : {}),
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found или нет доступа' }, { status: 404 });
    }
    return NextResponse.json(serializeProposal(proposal));
  });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return requireAuthOnly(req, async (payload) => {
    const { id } = await ctx.params;
    const raw = await req.json().catch(() => null);
    const parsed = proposalUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // Ownership check + verify it's still editable (cannot edit PAID/CONVERTED).
    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        isActive: true,
        ...(payload.role === 'MANAGER' ? { createdById: payload.sub } : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found или нет доступа' }, { status: 404 });
    }
    if (existing.status === ProposalStatus.PAID || existing.status === ProposalStatus.CONVERTED) {
      return NextResponse.json(
        { error: 'КП в статусе PAID/CONVERTED — редактирование заблокировано' },
        { status: 409 },
      );
    }

    // Optimistic lock: если updatedAt с момента загрузки изменился — кто-то уже сохранил.
    const incomingUpdatedAt = new Date(input.lastUpdatedAt);
    if (existing.updatedAt.getTime() !== incomingUpdatedAt.getTime()) {
      return NextResponse.json(
        {
          error: 'Conflict: документ был изменён другим пользователем',
          serverUpdatedAt: existing.updatedAt.toISOString(),
        },
        { status: 409 },
      );
    }

    // Fetch products для snapshot на новые позиции.
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

    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Upsert-like pattern: удалить items которых НЕТ в input.items + create new + update существующие.
        // Безопасная работа с persistent ids: client-provided id сохраняется в БД (sortOrder sync уже есть).
        const incomingIds = input.items.map((it) => it.id).filter((x): x is string => Boolean(x));
        if (incomingIds.length > 0) {
          await tx.proposalItem.deleteMany({
            where: { proposalId: id, id: { notIn: incomingIds } },
          });
        } else {
          await tx.proposalItem.deleteMany({ where: { proposalId: id } });
        }

        const proposal = await tx.proposal.update({
          where: { id },
          data: {
            title: input.title,
            customerId: input.customerId,
            contractorId: input.contractorId,
            templateId: input.templateId ?? null,
            vatRate: input.vatRate,
            paymentTermDays: input.paymentTermDays ?? null,
            packageTag: input.packageTag ?? null,
            notes: input.notes ?? null,
            validUntil: input.validUntil ?? null,
            // Persistent ids через upsert: если id есть в БД — update, иначе create с client-provided id.
            items: {
              upsert: input.items.map((it, idx) => {
                const product = productMap.get(it.productId)!;
                const total = computeLineTotal(it.quantity, it.price, 0, it.discountPercent ?? null);
                return {
                  where: { id: it.id },
                  create: {
                    id: it.id,
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
                  },
                  update: {
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
                  },
                };
              }),
            },
          },
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        });

        return proposal;
      });

      return NextResponse.json(serializeProposal(updated));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return NextResponse.json({ error: 'Proposal disappeared during update' }, { status: 409 });
      }
      console.error('[PUT /api/proposals/[id]]', err);
      const message = err instanceof Error ? err.message : 'Internal';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return requireAuthOnly(req, async (payload) => {
    const { id } = await ctx.params;
    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        isActive: true,
        ...(payload.role === 'MANAGER' ? { createdById: payload.sub } : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found или нет доступа' }, { status: 404 });
    }
    // Разрешаем soft-delete только в DRAFT (не PAID/CONVERTED). Admin/director могут всегда.
    const canForceDelete =
      payload.role === 'ADMIN' || payload.role === 'DIRECTOR';
    if (
      !canForceDelete &&
      existing.status !== ProposalStatus.DRAFT &&
      existing.status !== ProposalStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: `Soft-delete разрешён только для DRAFT/REJECTED. Текущий статус: ${existing.status}` },
        { status: 409 },
      );
    }
    await prisma.proposal.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, id });
  });
}
