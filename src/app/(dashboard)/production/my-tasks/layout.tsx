import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мои задачи',
  description: 'Панель работника — просмотр и отметка выполнения задач',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
