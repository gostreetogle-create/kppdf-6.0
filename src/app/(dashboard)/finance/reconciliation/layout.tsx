import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Акты сверки',
  description: 'Акты сверки взаиморасчётов с контрагентами',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
