/**
 * POST /api/auth/login — аутентификация по email + password (bcrypt).
 * Безопасность: bcrypt-hash hashed (v5 cycle 39 baseline).
 * Cookie: HttpOnly + SameSite=Lax + Secure (prod).
 */
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { signToken, buildSessionCookie } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations/auth.schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      // Защита от username enumeration: одинаковое сообщение для обоих случаев
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // passwordHash — placeholder в seed; в prod — реальный bcrypt-hash
    // v5 уже хранит bcrypt-hash; тут используем bcrypt.compare
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    const cookie = buildSessionCookie(token);

    return new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': cookie,
        },
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
