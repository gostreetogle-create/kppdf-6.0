import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Шаблоны документов',
  description: 'Редактор шаблонов документов и печатных форм',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
