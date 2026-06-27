import { cookies } from 'next/headers';
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiOk, apiError } from '@/lib/api-response';
import { isProd } from '@/lib/env';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return apiError('Требуется повторная авторизация', 401);
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      return apiError('Токен истёк', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, role: true, isActive: true, refreshTokenVersion: true },
    });

    if (!user || !user.isActive) {
      return apiError('Пользователь не найден', 401);
    }

    // Проверяем версию refresh-токена (старые токены после ротации становятся невалидными)
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.refreshTokenVersion) {
      return apiError('Токен устарел, требуется повторная авторизация', 401);
    }

    const newPayload = { userId: user.id, username: user.username, role: user.role };

    // Ротация: инкрементируем версию, выдаём новый accessToken И новый refreshToken
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenVersion: { increment: 1 } },
    });

    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken({ ...newPayload, tokenVersion: user.refreshTokenVersion + 1 });

    const response = apiOk({ accessToken });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    // Устанавливаем новый refresh token (старый становится невалидным)
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return apiError('Ошибка сервера', 500);
  }
}
