/**
 * Root page — проверка JWT cookie и редирект.
 * Server component (без 'use client') — прямой redirect через next/navigation.
 *
 * Логика:
 * - нет cookie или невалидный → /login
 * - иначе → /proposals (главная рабочая страница менеджера).
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { readSessionCookie, verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = readSessionCookie(cookieStore.toString());
  if (!token) redirect('/login');
  try {
    await verifyToken(token);
  } catch {
    redirect('/login');
  }
  redirect('/proposals');
}
