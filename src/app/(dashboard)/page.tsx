/**
 * Главная (dashboard) — server component.
 * Сводка: счётчики КП по статусам + список 10 последних черновиков.
 */
import Link from 'next/link';
import { Stack, Title, Text, SimpleGrid, Card, Group, Button } from '@mantine/core';
import { IconFileInvoice, IconPlus } from '@tabler/icons-react';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const [draftCount, sentCount, paidCount, totalCount, recent] = await Promise.all([
    prisma.proposal.count({ where: { status: 'DRAFT', isActive: true } }),
    prisma.proposal.count({ where: { status: 'SENT', isActive: true } }),
    prisma.proposal.count({ where: { status: 'PAID', isActive: true } }),
    prisma.proposal.count({ where: { isActive: true } }),
    prisma.proposal.findMany({
      where: { isActive: true },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Главная</Title>
        <Button component={Link} href="/proposals/new" leftSection={<IconPlus size={16} />}>
          Создать КП
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <StatCard label="Всего КП" value={totalCount} />
        <StatCard label="Черновики" value={draftCount} color="gray" />
        <StatCard label="Отправлено" value={sentCount} color="blue" />
        <StatCard label="Оплачено" value={paidCount} color="green" />
      </SimpleGrid>

      <Card withBorder padding="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Последние КП</Title>
          <Button component={Link} href="/proposals" variant="subtle" size="xs">
            Все КП →
          </Button>
        </Group>
        {recent.length === 0 ? (
          <Text c="dimmed">Нет КП. Нажмите «Создать КП» выше.</Text>
        ) : (
          <Stack gap="xs">
            {recent.map((p) => (
              <Group key={p.id} justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                  <IconFileInvoice size={16} />
                  <Text fw={500}>{p.number}</Text>
                  <Text c="dimmed" lineClamp={1}>
                    {p.title}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {p.status}
                  </Text>
                  <Button
                    component={Link}
                    href={`/proposals/${p.id}`}
                    variant="subtle"
                    size="compact-xs"
                  >
                    Открыть
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

function StatCard({
  label,
  value,
  color = 'blue',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card withBorder padding="md">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text fw={700} size="xl" c={color}>
        {value}
      </Text>
    </Card>
  );
}
