import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { baseUrl } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase: обязателен для абсолютных URL OpenGraph/Twitter Card image и canonical.
  // baseUrl из @/lib/env: production берёт NEXT_PUBLIC_BASE_URL, dev — localhost:3000.
  metadataBase: new URL(baseUrl),
  title: {
    default: "KP CRM",
    template: "%s — KP CRM",
  },
  description: "Система управления коммерческими предложениями и производством",
  // Canonical URL: убирает дублирование контента для SEO (когда один и тот же
  // page доступен с трейлинг-слэшем, query-params и т.п.).
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KP CRM',
    description: 'Система управления коммерческими предложениями и производством',
    siteName: 'KP CRM',
    locale: 'ru_RU',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KP CRM',
    description: 'Система управления коммерческими предложениями и производством',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Шрифты Geist загружаются через next/font локально (/_next/static/media/).
         * Preconnect к Google Fonts не нужен — шрифты не с их CDN.
         * Preload-ссылки не добавляем вручную: next/font автоматически генерирует
         * правильные <link rel="preload"> с хешированными именами файлов при сборке.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t) document.documentElement.setAttribute('data-theme', t);
                else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-[var(--primary-foreground)] focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Пропустить навигацию
        </a>
        <Providers>
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
