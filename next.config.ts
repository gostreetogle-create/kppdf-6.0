import type { NextConfig } from "next";
import { isProd } from "@/lib/env";

const nextConfig: NextConfig = {
  // Standalone сборка для Docker
  output: 'standalone',

  // Скрыть заголовок X-Powered-By
  poweredByHeader: false,

  // Удаление console.log/debug в продакшене, но сохраняем warn/error для мониторинга
  compiler: {
    removeConsole: isProd
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Tree-shaking для тяжёлых пакетов — только используемые импорты попадают в бандл
  experimental: {
    optimizePackageImports: [
      'lucide-react',       // ~20 KB вместо ~200 KB
      'date-fns',            // только используемые функции
      '@radix-ui/react-slot',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'react-resizable-panels',
    ],
  },

  // Кеширование статики + безопасность
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],

  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
