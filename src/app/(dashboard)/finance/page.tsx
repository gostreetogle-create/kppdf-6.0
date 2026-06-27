import type { Metadata } from 'next';
import { FinanceCards } from './client';

export const metadata: Metadata = {
  title: 'Финансы',
  description: 'Учёт закрытия заказов, акты сверки и финансовые отчёты',
};

const sections = [
  {
    slug: 'order-closings',
    title: 'Закрытия заказов',
    description: 'Учёт закрытия производственных заказов и списания',
    href: '/finance/order-closings',
  },
  {
    slug: 'reconciliation',
    title: 'Акты сверки',
    description: 'Акты сверки расчётов с клиентами и поставщиками',
    href: '/finance/reconciliation',
  },
  {
    slug: 'reports',
    title: 'Финансовые отчёты',
    description: 'Сводные отчёты по доходам, расходам и прибыли',
    href: '/finance/reports',
  },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Финансы</h1>
      <FinanceCards sections={sections} />
    </div>
  );
}
