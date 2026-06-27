'use client';

import { type ReactNode } from 'react';
import { Building2, Users, Package, FileText, ClipboardList, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Typography, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';
import DashboardCharts from './charts';

const iconByTitle: Record<string, ReactNode> = {
  'Организации': <Building2 className="h-6 w-6" />,
  'Клиенты': <Users className="h-6 w-6" />,
  'Товары': <Package className="h-6 w-6" />,
  'Предложения': <FileText className="h-6 w-6" />,
  'Договоры': <ClipboardList className="h-6 w-6" />,
  'Заказы': <ShoppingCart className="h-6 w-6" />,
};

interface StatCard {
  title: string;
  count: number;
  href: string;
}

interface ProposalStat {
  status: string;
  count: number;
}

interface CategoryStat {
  name: string;
  count: number;
}

export default function DashboardClient({
  overview,
  proposalStats,
  categoryStats,
}: {
  overview: StatCard[];
  proposalStats: ProposalStat[];
  categoryStats: CategoryStat[];
}) {
  const statusColors: Record<string, string> = {
    draft: '#94a3b8',
    sent: '#3b82f6',
    accepted: '#22c55e',
    rejected: '#ef4444',
    converted: '#8b5cf6',
  };

  const statusNames: Record<string, string> = {
    draft: 'Черновик',
    sent: 'Отправлено',
    accepted: 'Принято',
    rejected: 'Отклонено',
    converted: 'Конвертировано',
  };

  const chartProposalStats = proposalStats
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: statusNames[s.status] || s.status,
      value: s.count,
      color: statusColors[s.status] || '#94a3b8',
    }));

  const chartCategoryStats = categoryStats
    .filter((c) => c.count > 0)
    .slice(0, 5);

  return (
    <Stack gap="xl">
      <Grid cols="auto-md" gap="md">
        {overview.map((stat) => (
          <a key={stat.title} href={stat.href}>
            <Card variant="interactive" className="p-6 h-full">
              <Flex justify="between" className="mb-3">
                <Muted>{stat.title}</Muted>
                <span className="text-primary">{iconByTitle[stat.title] || <div />}</span>
              </Flex>
              <Typography variant="h1">{stat.count}</Typography>
            </Card>
          </a>
        ))}
      </Grid>

      <DashboardCharts proposalStats={chartProposalStats} categoryStats={chartCategoryStats} />
    </Stack>
  );
}
