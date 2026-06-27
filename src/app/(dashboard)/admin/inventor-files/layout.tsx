import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CAD-файлы',
  description: 'Файлы Inventor, чертежи и 3D-модели',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
