'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  dashboard: 'Главная',
  organizations: 'Контрагенты',
  clients: 'Клиенты',
  products: 'Товары',
  categories: 'Категории',
  proposals: 'КП',
  new: 'Новое',
  contracts: 'Договоры',
  production: 'Производство',
  'work-types': 'Типы работ',
  'work-centers': 'Центры',
  workers: 'Работники',
  warehouse: 'Склад',
  positions: 'Позиции',
  purchases: 'Закупки',
  finance: 'Финансы',
  admin: 'Администрирование',
  tenders: 'Тендеры',
  'doc-types': 'Типы документов',
  templates: 'Шаблоны документов',
  'table-templates': 'Шаблоны таблиц',
  users: 'Пользователи',
  'status-workflows': 'Мастер статусов',
  certificates: 'Сертификаты',
  'rpp-entries': 'РПП записи',
  'inventor-files': 'CAD-файлы',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const items: { label: string; href: string }[] = [];
  let path = '';

  segments.forEach((segment) => {
    path += `/${segment}`;
    const label = LABELS[segment] || segment;
    items.push({ label, href: path });
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] mb-4">
      <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === items.length - 1 ? (
            <span className="text-[var(--foreground)] font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-[var(--foreground)] transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
