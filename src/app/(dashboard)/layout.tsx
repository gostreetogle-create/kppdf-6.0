/**
 * Server-side guard для всего содержимого (dashboard) route group.
 *
 * Проверяет presence валидного JWT cookie; при отсутствии — redirect на /login.
 * При успехе — оборачивает контент в KarkasLayout, передавая serialized user.
 *
 * Это server component (no 'use client') — cookie reading происходит через next/headers.
 * Page-level data fetching ниже остаётся server-side too: Prisma calls → JSON → client components.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { KarkasLayout } from '@/components/karkas-kit/KarkasLayout';
import { readSessionCookie, verifyToken } from '@/lib/jwt';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = readSessionCookie(cookieStore.toString());
  if (!token) redirect('/login');
  try {
    const payload = await verifyToken(token);
    return (
      <KarkasLayout user={{ fullName: payload.email, role: payload.role }}>
        {children}
      </KarkasLayout>
    );
  } catch {
    redirect('/login');
  }
}
}
