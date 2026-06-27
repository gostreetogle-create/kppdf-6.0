import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Модули продуктов',
  description: 'Конструктор модулей продуктов с материалами и видами работ',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
