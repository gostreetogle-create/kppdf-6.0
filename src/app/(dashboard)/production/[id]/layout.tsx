import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Заказ производства',
  description: 'Просмотр и редактирование производственного заказа',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
