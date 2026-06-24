/**
 * Создание нового КП — server action: создать пустой draft и редиректить на /proposals/[id].
 * Делаем POST через внутренний fetch через Prisma напрямую, чтобы не зависеть от auth-cookie на этом этапе.
 *
 * Упрощение v1: создаём пустой черновик с одним placeholder-товаром (если менеджер не указал customer/contractor —
 * покажется ошибка на /proposals/[id] и он заполнит). MVP — простой workflow.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Anchor, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { readSessionCookie, verifyToken } from '@/lib/jwt';
import { nextProposalNumber } from '@/lib/counter';
import { ProposalStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  const cookieStore = await cookies();
  const token = readSessionCookie(cookieStore.toString());
  if (!token) redirect('/login');
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    redirect('/login');
  }

  // Берём первого активного клиента + первого активного контрактора + первый товар (placeholder-строка).
  // Без placeholder-товара PUT будет отослан Zod `proposalUpdateSchema.items.min(1)` — менеджер не сможет сохранить.
  const [firstCustomer, firstContractor, firstProduct] = await Promise.all([
    prisma.organization.findFirst({
      where: { isActive: true, roles: { has: 'CUSTOMER' } },
      select: { id: true },
    }),
    prisma.organization.findFirst({
      where: { isActive: true, roles: { has: 'CONTRACTOR' } },
      select: { id: true },
    }),
    // Fallback: берём первый активный товар БЕЗ фильтра salePrice — если нет товаров с ценой,
    // мы всё равно должны создать КП (с placeholder-строкой price=0, Zod nonnegative принимает).
    prisma.product.findFirst({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, unit: true, salePrice: true },
    }),
  ]);

  if (!firstCustomer || !firstContractor) {
    return (
      <Stack gap="md">
        <Title order={2}>Создание КП</Title>
        <Text c="dimmed">
          В справочнике нет ни одного клиента и/или нашей организации. Менеджер не может создать КП без
          обязательных сторон.{' '}
          <Anchor component={Link} href="/">
            На главную
          </Anchor>
          .
        </Text>
      </Stack>
    );
  }

  const number = await nextProposalNumber();

  // Создаём КП с одним placeholder-item, чтобы PUT сразу принимался (Zod items.min(1)).
  const created = await prisma.proposal.create({
    data: {
      number,
      title: 'Новое КП',
      status: ProposalStatus.DRAFT,
      customerId: firstCustomer.id,
      contractorId: firstContractor.id,
      vatRate: 20,
      currency: 'RUB',
      createdById: payload.sub,          items: firstProduct
            ? {
                create: [
                  {
                    productId: firstProduct.id,
                    quantity: 1,
                    price: firstProduct.salePrice ? Number(firstProduct.salePrice) : 0,
                    productPriceSnapshot: firstProduct.salePrice,
                    discountPercent: null,
                    total: firstProduct.salePrice ? Number(firstProduct.salePrice) : 0,
                    productSku: firstProduct.sku,
                    productName: `${firstProduct.name} (placeholder)`,
                    productUnit: firstProduct.unit,
                    sortOrder: 1,
                    notes: 'Placeholder — замените на нужный товар',
                  },
                ],
              }
            : undefined,
    },
    select: { id: true },
  });

  redirect(`/proposals/${created.id}`);
}
