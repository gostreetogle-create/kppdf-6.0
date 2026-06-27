import { getCurrentUser } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError('Не авторизован', 401);
    }
    return apiOk(user);
  } catch {
    return apiError('Ошибка сервера', 500);
  }
}
