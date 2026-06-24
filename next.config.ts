import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack default в Next.js 16 (App Router). Не включает webpack explicitly.
  reactStrictMode: true,

  experimental: {
    // Allow large pages (Karkas-Kit может иметь много блоков в design state)
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // sharp — обрабатывает фото на сервере; bundling для server-only OK.
  transpilePackages: [],

  // Standalone output для Docker (single container)
  output: 'standalone',

  // Production: error sources скрыты
  productionBrowserSourceMaps: false,
};

export default nextConfig;
