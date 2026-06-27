import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Пользователи',
  description: 'Управление учётными записями пользователей и ролями',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
