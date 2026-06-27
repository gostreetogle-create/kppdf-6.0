import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // Modular Monolith (cycle 60 — docs/features/CONVENTIONS.md): запрет
      // глубоких импортов между фичами. Контракт фичи = только то, что она
      // явно реэкспортирует через index.ts (barrel export). Глубокие файлы
      // — private; их нельзя дёргать из соседней фичи напрямую.
      //
      // Примеры разрешённых импортов между фичами:
      //   import { ProposalEditor } from '@/features/proposals'         // ✓ public barrel
      //   import { formatCurrency } from '@/shared'                    // ✓ from shared layer
      //   import { cn } from '@/lib/utils'                              // ✓ from explicit lib
      //
      // Примеры запрещённых:
      //   import { EditorHeader } from '@/features/proposals/editor-header' // ✗ deep
      //   import { useDraft } from '@/features/templates/hooks/use-draft'    // ✗ deep
      //
      // Правило сейчас warn (не error) — старые импорты продолжают работать.
      // Перевод в error после cycle-61, когда фичи будут формально расщеплены.
      "no-restricted-imports": ["warn", {
        patterns: [
          // Modular Monolith: запрещаем ЛЮБОЕ sub-path под @/features/*, включая
          // /index и /public. Использовать ТОЛЬКО bare @/features/<name> (barrel).
          // Простая glob-семантика без extglob — ESLint no-restricted-imports не
          // поддерживает !(...) negation в gitignore-patterns (только *, **, ?, []).
          // С single pattern ниже: всё, что глубже одного сегмента (@/features/x/*),
          // подсвечивается как warn — пользователь либо использует barrel, либо
          // делает explicit allow через inline disable.
          {
            group: ["@/features/*/*"],
            message: "Modular Monolith: import через '@/features/<name>' (barrel). Глубокие файлы — private API фичи.",
          },
        ],
      }],
      "no-restricted-syntax": [
        "error",
        // Direct member access: process.env.NODE_ENV
        {
          selector:
            "MemberExpression[property.name='NODE_ENV'][object.property.name='env'][object.object.name='process']",
          message:
            "Use `isProd`/`isDev` from '@/lib/env' instead of direct process.env.NODE_ENV access.",
        },
        // Computed member access: process.env['NODE_ENV']
        {
          selector:
            "MemberExpression[computed=true][property.value='NODE_ENV'][object.property.name='env'][object.object.name='process']",
          message:
            "Use `isProd`/`isDev` from '@/lib/env' instead of direct process.env['NODE_ENV'] access.",
        },
        // Direct member access: process.env.NEXT_PUBLIC_BASE_URL
        {
          selector:
            "MemberExpression[property.name='NEXT_PUBLIC_BASE_URL']",
          message:
            "Use `baseUrl` from '@/lib/env' instead of direct process.env.NEXT_PUBLIC_BASE_URL access.",
        },
        // Computed member access: process.env['NEXT_PUBLIC_BASE_URL']
        {
          selector:
            "MemberExpression[computed=true][property.value='NEXT_PUBLIC_BASE_URL']",
          message:
            "Use `baseUrl` from '@/lib/env' instead of direct process.env['NEXT_PUBLIC_BASE_URL'] access.",
        },
      ],
    },
  },
  // Override: src/lib/env.ts is the only file allowed to access process.env
  // directly (it's the source of truth for isProd/isDev/baseUrl).
  {
    files: ['src/lib/env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);

export default eslintConfig;
