import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'src/generated'],
    // Cycle v3.4: PostgreSQL migration — vitest needs a valid postgresql://
    // DATABASE_URL to load src/lib/db.ts (which rejects non-postgresql).
    // This placeholder is never actually connected to — tests mock prisma or
    // use it only for type-level imports. Actual DB connection requires a
    // real PostgreSQL instance set via .env or shell env.
    env: {
      DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/test?sslmode=disable',
    },
  },
  resolve: {
    alias: {
      // Единственный нужный alias. `@/` matches любой путь в src/ через tsconfig
      // paths, поэтому '@/features/warehouse' уже resolved в './src/features/warehouse'.
      // ВАЖНО: vitest alias (vite resolve.alias) НЕ поддерживает wildcards, поэтому
      // дополнительные '@/features' / '@/shared' НЕ добавляем — они бы только захватывали
      // bare-импорт без суффикса. Полные пути покрывает '@'.
      // Modular Monolith path aliases @/features/* и @/shared/* живут в tsconfig.json —
      // TypeScript компиляция их резолвит, а vitest прозрачно следует за тем же паттерном.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
