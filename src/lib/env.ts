// src/lib/env.ts
// Single source of truth for environment-derived runtime constants.
// Заменяет любые прямые обращения process.env.NODE_ENV / NEXT_PUBLIC_BASE_URL
// на эти exports. Запрещено ESLint rule no-restricted-syntax (см. eslint.config.mjs).

export const isProd = process.env.NODE_ENV === 'production';
// isDev возвращает true для NODE_ENV === 'development' И 'test'. Если нужно
// отличать test от dev (например, для фикстур), используй явный
// process.env.NODE_ENV === 'development'. В текущем коде isDev не используется.
export const isDev = !isProd;
// baseUrl: в production должен быть установлен NEXT_PUBLIC_BASE_URL;
// в dev-режиме fallback на localhost:3000 (стандарт Next.js dev port).
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
