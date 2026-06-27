import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Категории товаров',
  description: 'Справочник категорий товаров и услуг',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
