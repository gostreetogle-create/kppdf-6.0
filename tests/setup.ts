/**
 * Vitest setup — загружается ДО тестов (см. vitest.config.ts setupFiles).
 * Устанавливает минимальные ENV-переменные так, чтобы Zod-валидация в env.ts прошла.
 * Каждый test файл может override по необходимости через vi.stubEnv.
 */
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'test-secret-' + 'x'.repeat(32); // >= 32 chars
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3000';
