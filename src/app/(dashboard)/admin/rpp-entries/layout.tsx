import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'РПП записи',
  description: 'Журнал распоряжений и протоколов',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
