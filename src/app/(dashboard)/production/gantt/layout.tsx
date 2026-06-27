import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Диаграмма Гантта',
  description: 'Планирование производства, загрузка сотрудников и контроль сроков',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
