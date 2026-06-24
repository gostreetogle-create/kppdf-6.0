/**
 * Zod-валидация env. Падает с понятной ошибкой при старте, если что-то не задано.
 * Использует Zod 4 (схема в SCHEMA-CONSOLIDATED.md §0.1).
 */
import { z } from 'zod';

/** @internal Exported for test consumption. */
export const envSchema = z.object({
  // Postgres
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (val) => val.startsWith('postgres://') || val.startsWith('postgresql://'),
      'DATABASE_URL must start with postgres:// or postgresql://',
    ),

  // JWT (минимум 32 символа для безопасности HS256)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Seed
  SEED_ADMIN_EMAIL: z.string().email().default('[email protected]'),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`\n❌ Invalid environment variables:\n${issues}\n`);
    throw new Error('Invalid environment variables. See above.');
  }

  return parsed.data;
}

// Singleton (HMR-safe)
let envCache: Env | null = null;
export function env(): Env {
  if (envCache === null) {
    envCache = loadEnv();
  }
  return envCache;
}

// Convenience constants
export const isProd = (): boolean => env().NODE_ENV === 'production';
export const isDev = (): boolean => env().NODE_ENV === 'development';
export const isTest = (): boolean => env().NODE_ENV === 'test';
export const baseUrl = (): string => (isProd() ? '' : `http://localhost:${env().PORT}`);
