import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Отгрузка товаров',
  description: 'Акт приёма-передачи, частичная отгрузка и фотофиксация',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
