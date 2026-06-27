import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Коммерческое предложение',
  description: 'Просмотр и редактирование коммерческого предложения',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
