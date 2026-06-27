import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Вход в систему управления КП и производством',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
