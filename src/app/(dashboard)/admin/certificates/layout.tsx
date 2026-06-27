import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Сертификаты',
  description: 'Сертификаты соответствия, допуски и разрешения',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
