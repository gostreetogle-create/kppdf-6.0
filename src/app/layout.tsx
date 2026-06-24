/**
 * Корневой layout Next.js 16 + Mantine 7.
 * MantineProvider с ColorSchemeScript (важно для SSR, иначе мигает светлая тема при гидратации).
 * QueryClientProvider для TanStack Query.
 */
import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mantineTheme } from '@/lib/theme';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'KPPDF CRM',
  description: 'Коммерческие предложения, договоры, производство, склад, финансы',
};

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const queryClient = makeQueryClient();

  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={mantineTheme} defaultColorScheme="light">
            <Notifications position="top-right" />
            {children}
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
