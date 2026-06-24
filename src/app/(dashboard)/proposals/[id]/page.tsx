/**
 * Один КП — server fetch + client-side editor wrapper.
 * Server component: validate cookie → load proposal with ownership check → serialize → pass to <ProposalEditor/>.
 */
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { readSessionCookie, verifyToken } from '@/lib/jwt';
import { serializeProposal } from '@/lib/serialize';
import { ProposalEditor } from '@/components/proposals/proposal-editor';

export const dynamic = 'force-dynamic';

export default async function ProposalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = readSessionCookie(cookieStore.toString());
  if (!token) redirect('/login');
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    redirect('/login');
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id,
      isActive: true,
      ...(payload.role === 'MANAGER' ? { createdById: payload.sub } : {}),
    },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      customer: { select: { id: true, name: true } },
      contractor: { select: { id: true, name: true } },
    },
  });
  if (!proposal) notFound();

  // Для dropdown в правой панели: список 100 наших юрлиц (роль CONTRACTOR) и клиентов (CUSTOMER).
  // MVP-упрощение: показываем любые активные Organization, RBAC фильтрация — на уровне API.
  const [contractors, customers, products] = await Promise.all([
    prisma.organization.findMany({
      where: { isActive: true, roles: { has: 'CONTRACTOR' } },
      select: { id: true, name: true },
      take: 100,
    }),
    prisma.organization.findMany({
      where: { isActive: true, roles: { has: 'CUSTOMER' } },
      select: { id: true, name: true },
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        kind: true,
        salePrice: true,
      },
      take: 200,
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <ProposalEditor
      initialData={serializeProposal(proposal)}
      contractors={contractors}
      customers={customers}
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        kind: p.kind,
        price: p.salePrice ? Number(p.salePrice.toFixed(2)) : 0,
      }))}
    />
  );
}
