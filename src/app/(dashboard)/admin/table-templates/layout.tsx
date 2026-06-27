import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Шаблоны таблиц',
  description: 'Настройка шаблонов для табличных представлений данных',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
