import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { OrganizationsClient } from './client';
import { ORGANIZATION_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Организации',
  description: 'Справочник организаций и контрагентов',
};

export default async function OrganizationsPage() {
  await requireAuthPage();

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany(ORGANIZATION_LIST_QUERY_ARGS),
    prisma.organization.count(),
  ]);

  return < OrganizationsClient initialData={organizations} initialTotal={total} />;
}
