import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Новое КП',
  description: 'Создание нового коммерческого предложения',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
