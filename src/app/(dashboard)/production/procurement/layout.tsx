import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Снабжение',
  description: 'Потребности в закупках с учётом складских остатков',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
