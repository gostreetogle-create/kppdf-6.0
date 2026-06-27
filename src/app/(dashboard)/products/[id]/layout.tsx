import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Товар',
  description: 'Просмотр и редактирование товара',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
