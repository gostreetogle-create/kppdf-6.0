import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Типы документов',
  description: 'Справочник типов документов для шаблонов',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
