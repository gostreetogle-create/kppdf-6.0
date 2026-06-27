import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAuth();
    const roles = await prisma.orgRole.findMany({
      orderBy: { name: 'asc' },
      where: { isActive: true },
    });
    return apiOk(roles);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
