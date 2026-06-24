/**
 * Список КП (Server Component).
 * Direct DB fetch через Prisma — нет waterfall client/server.
 * RBAC: manager → where createdById = sub; остальные роли — все КП.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Stack, Title, Group, Button, Table, Text, Badge, ActionIcon } from '@mantine/core';
import { IconPlus, IconEye } from '@tabler/icons-react';
import { prisma } from '@/lib/db';
import { readSessionCookie, verifyToken } from '@/lib/jwt';
import { decimalToNumber } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'gray',
  SENT: 'blue',
  ACCEPTED: 'teal',
  REJECTED: 'red',
  PAID: 'green',
  CONVERTED: 'violet',
};

export default async function ProposalsListPage() {
  const cookieStore = await cookies();
  const token = readSessionCookie(cookieStore.toString());
  if (!token) redirect('/login');
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    redirect('/login');
  }
  const whereClause = payload.role === 'MANAGER' ? { isActive: true, createdById: payload.sub } : { isActive: true };

  const whereClause = payload.role === 'MANAGER' ? { isActive: true, createdById: payload.sub } : { isActive: true };

  const proposals = await prisma.proposal.findMany({
    where: whereClause,
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      vatRate: true,
      currency: true,
      updatedAt: true,
      customer: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  // Один batch GROUP BY для total вместо N+1.
  const totals = await prisma.proposalItem.groupBy({
    by: ['proposalId'],
    _sum: { total: true },
    where: { proposalId: { in: proposals.map((p) => p.id) } },
  });
  const totalsMap = new Map(totals.map((t) => [t.proposalId, decimalToNumber(t._sum.total)]));

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Коммерческие предложения</Title>
        <Button component={Link} href="/proposals/new" leftSection={<IconPlus size={16} />}>
          Создать пустое КП
        </Button>
      </Group>

      {proposals.length === 0 ? (
        <Text c="dimmed">Нет доступных КП. Создайте первое.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Номер</Table.Th>
              <Table.Th>Название</Table.Th>
              <Table.Th>Клиент</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th ta="right">Сумма</Table.Th>
              <Table.Th>Обновлено</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {proposals.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Text fw={500}>{p.number}</Text>
                </Table.Td>
                <Table.Td>
                  <Text lineClamp={1}>{p.title}</Text>
                </Table.Td>
                <Table.Td>{p.customer?.name ?? '—'}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLOR[p.status] ?? 'gray'} variant="light">
                    {p.status}
                  </Badge>
                </Table.Td>
                <Table.Td ta="right">
                  {totalsMap.get(p.id)?.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) ?? '0,00'} ₽
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {p.updatedAt.toLocaleDateString('ru-RU')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ActionIcon component={Link} href={`/proposals/${p.id}`} variant="subtle" title="Открыть">
                    <IconEye size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
