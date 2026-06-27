import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Договор',
  description: 'Просмотр и редактирование договора',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
