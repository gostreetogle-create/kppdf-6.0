import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { AdminStatsCards, AdminQuickLinks, AdminSystemInfo } from './client';
import { H1, Muted } from '@/components/ui/typography';
import { Stack, Grid } from '@/components/ui/layout';

export const metadata: Metadata = {
  title: 'Администрирование',
  description: 'Обзор системы, управление пользователями, статусами и настройками',
};

export default async function AdminDashboardPage() {
  await requireAuthPage();

  const [users, proposals, contracts, organizations, products, productionOrders] = await Promise.all([
    prisma.user.count(),
    prisma.proposal.count(),
    prisma.contract.count(),
    prisma.organization.count(),
    prisma.product.count(),
    prisma.productionOrder.count(),
  ]);

  const stats = { users, proposals, contracts, organizations, products, productionOrders };

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <H1>Администрирование</H1>
        <Muted>Обзор системы и управление</Muted>
      </Stack>

      <AdminStatsCards stats={stats} />

      <Grid cols="auto-sm" gap="lg">
        <AdminQuickLinks />
        <AdminSystemInfo />
      </Grid>
    </Stack>
  );
}
