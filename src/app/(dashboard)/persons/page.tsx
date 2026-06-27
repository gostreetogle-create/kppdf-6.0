import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { PersonsClient } from './client';
import { PERSON_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export const metadata: Metadata = {
  title: 'Контактные лица',
  description: 'Справочник контактных лиц организаций',
};

export default async function PersonsPage() {
  await requireAuthPage();

  const [persons, total] = await Promise.all([
    prisma.person.findMany(PERSON_LIST_QUERY_ARGS),
    prisma.person.count(),
  ]);

  return <PersonsClient initialData={persons} initialTotal={total} />;
}
