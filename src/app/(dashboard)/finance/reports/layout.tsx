import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Финансовые отчёты',
  description: 'Сводка по коммерческим предложениям, договорам и экспорт отчётов',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
