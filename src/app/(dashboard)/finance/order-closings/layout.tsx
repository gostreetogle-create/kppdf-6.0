import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Закрытия заказов',
  description: 'Учёт закрытия производственных заказов и актов выполненных работ',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
