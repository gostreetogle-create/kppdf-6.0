/**
 * POST /api/auth/logout — очищает HttpOnly cookie.
 */
import { NextResponse } from 'next/server';
import { buildClearCookie } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'set-cookie': buildClearCookie() },
  });
}
