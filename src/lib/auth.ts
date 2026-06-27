import { cookies } from 'next/headers';
import { prisma } from './db';
import { verifyToken } from './jwt';

// Цикл 39 (M5 развязка): JWT-логика вынесена в `./jwt.ts` чтобы:
//   1) избежать импорта `prisma` при юнит-тестировании чистых JWT-функций;
//   2) убрать top-level throw на JWT_SECRET (теперь lazy в jwt.ts);
//   3) сохранить backwards-compatible re-export.
// Двойной re-export: в TS strict/verbatimModuleSyntax (Next.js 16) простой
// import НЕ реэкспортирует — нужен явный export statement. Только `verifyToken`
// нужен локально в этом файле (для `requireAuth()`); signAccessToken/
// signRefreshToken/JwtPayload — pure re-exports без локального использования,
// поэтому удалены из import statement чтобы избежать unused-vars warnings
// (cycle 46 ESLint cleanup).
export { signAccessToken, signRefreshToken, verifyToken, type JwtPayload } from './jwt';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, displayName: true, email: true, phone: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/** Блокирует мутирующие операции (DELETE/PUT/POST) для роли viewer */
export async function requireEditor() {
  const user = await requireAuth();
  if (user.role === 'viewer') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
