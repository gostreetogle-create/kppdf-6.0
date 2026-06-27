import { NextRequest } from 'next/server';
import { cleanupExpiredEntries } from '@/lib/rate-limit';
import { apiOk, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET}`) {
    return apiError('Unauthorized', 401);
  }

  const deleted = await cleanupExpiredEntries();
  return apiOk({ deleted });
}
