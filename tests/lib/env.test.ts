import { describe, it, expect } from 'vitest';
import { envSchema } from '@/lib/env';

const baseValid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
  NODE_ENV: 'test' as const,
  PORT: 3000,
  SEED_ADMIN_EMAIL: '[email protected]',
};

describe('envSchema (lib/env)', () => {
  it('accepts a valid configuration', () => {
    const r = envSchema.safeParse(baseValid);
    expect(r.success).toBe(true);
  });

  it('rejects missing DATABASE_URL', () => {
    const { DATABASE_URL: _drop, ...rest } = baseValid;
    const r = envSchema.safeParse(rest);
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('DATABASE_URL');
    }
  });

  it('rejects DATABASE_URL without postgres:// prefix', () => {
    const r = envSchema.safeParse({ ...baseValid, DATABASE_URL: 'mysql://localhost/db' });
    expect(r.success).toBe(false);
  });

  it('rejects DATABASE_URL empty string', () => {
    const r = envSchema.safeParse({ ...baseValid, DATABASE_URL: '' });
    expect(r.success).toBe(false);
  });

  it('rejects short JWT_SECRET (< 32 chars)', () => {
    const r = envSchema.safeParse({ ...baseValid, JWT_SECRET: 'short' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('JWT_SECRET');
    }
  });

  it('rejects exactly 31 characters (boundary)', () => {
    const r = envSchema.safeParse({ ...baseValid, JWT_SECRET: 'x'.repeat(31) });
    expect(r.success).toBe(false);
  });

  it('accepts exactly 32 characters (boundary)', () => {
    const r = envSchema.safeParse({ ...baseValid, JWT_SECRET: 'x'.repeat(32) });
    expect(r.success).toBe(true);
  });

  it('accepts NODE_ENV in development', () => {
    const r = envSchema.safeParse({ ...baseValid, NODE_ENV: 'development' });
    expect(r.success).toBe(true);
  });

  it('accepts NODE_ENV in production', () => {
    const r = envSchema.safeParse({ ...baseValid, NODE_ENV: 'production' });
    expect(r.success).toBe(true);
  });

  it('rejects unknown NODE_ENV (e.g. staging)', () => {
    const r = envSchema.safeParse({ ...baseValid, NODE_ENV: 'staging' });
    expect(r.success).toBe(false);
  });

  it('coerces PORT from string', () => {
    const r = envSchema.safeParse({ ...baseValid, PORT: '8080' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.PORT).toBe(8080);
    }
  });
});
