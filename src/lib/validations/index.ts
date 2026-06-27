import { type ZodSchema } from 'zod';
import { apiError } from '@/lib/api-response';

export function validateBody<T>(body: unknown, schema: ZodSchema<T>): { success: true; data: T } | { success: false; error: Response } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => `${String(issue.path.join('.'))}: ${issue.message}`).join('; ');
  return { success: false, error: apiError(`Ошибка валидации: ${errors}`, 400) };
}
