'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home, Building2, Package, Factory, Warehouse, Banknote, Shield, ChevronDown, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];  // Какие роли видят этот пункт. Пусто/не указано = всем.
  /**
   * v3.2 — section accent palette.
   * Maps 1..7 → --nav-N-{stripe,bg,icon} design tokens (glossy.css).
   * Each sidebar section gets a UNIQUE muted accent color so the user feels
   * the difference subconsciously without overwhelm.
   *   1 Dashboard      slate
   *   2 References     dusty lavender
   *   3 Sales          muted terracotta
   *   4 Production     sage
   *   5 Warehouse      dim gold
   *   6 Finance        deep teal
   *   7 Admin          muted ruby
   */
  section: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  children?: { label: string; href: string; roles?: string[] }[];
}

const navigation: NavItem[] = [
  { label: 'Главная', href: '/dashboard', icon: Home, section: 1 },
  {
    label: 'Справочники', href: '/organizations', icon: Building2,
    section: 2, roles: ['admin', 'manager'],
    children: [
      { label: 'Организации', href: '/organizations' },
      { label: 'Контактные лица', href: '/persons' },
      { label: 'Категории', href: '/products/categories' },
      { label: 'Товары', href: '/products' },
      { label: 'Материалы', href: '/materials' },
    ],
  },
  {
    label: 'Продажи', href: '/proposals', icon: Package,
    section: 3, roles: ['admin', 'manager'],
    children: [
      { label: 'КП (список)', href: '/proposals' },
      { label: 'Оформить КП', href: '/proposals/new' },
      { label: 'Договоры', href: '/contracts' },
    ],
  },
  {
    label: 'Производство', href: '/production', icon: Factory,
    section: 4, roles: ['admin', 'manager', 'production'],
    children: [
      { label: 'Заказы', href: '/production' },
      { label: 'Гантт-чарт', href: '/production/gantt' },
      { label: 'Модули', href: '/production/modules' },
      { label: 'Снабжение', href: '/production/procurement' },
      { label: 'Мои задачи', href: '/production/my-tasks', roles: ['production', 'worker'] },
      { label: 'Типы работ', href: '/production/work-types' },
      { label: 'Центры', href: '/production/work-centers' },
      { label: 'Работники', href: '/production/workers' },
    ],
  },
  {
    label: 'Склад', href: '/warehouse', icon: Warehouse,
    section: 5, roles: ['admin', 'storekeeper', 'manager'],
    children: [
      { label: 'Склады', href: '/warehouse' },
      { label: 'Позиции', href: '/warehouse/positions' },
      { label: 'Закупки', href: '/warehouse/purchases' },
      { label: 'Отгрузка', href: '/warehouse/shipping' },
    ],
  },
  {
    label: 'Финансы', href: '/finance', icon: Banknote,
    section: 6, roles: ['admin', 'manager', 'accountant'],
    children: [
      { label: 'Обзор', href: '/finance' },
      { label: 'Закрытия заказов', href: '/finance/order-closings' },
      { label: 'Сверки', href: '/finance/reconciliation' },
      { label: 'Отчёты', href: '/finance/reports' },
    ],
  },
  {
    label: 'Администрирование', href: '/admin', icon: Shield,
    section: 7, roles: ['admin'],
    children: [
      { label: 'Пользователи', href: '/admin/users' },
      { label: 'Типы документов', href: '/admin/doc-types' },
      { label: 'Шаблоны таблиц', href: '/admin/table-templates' },
      { label: 'Шаблоны документов', href: '/admin/templates' },
      { label: 'Мастер статусов', href: '/admin/status-workflows' },
      { label: 'Тендеры', href: '/admin/tenders' },
      { label: 'Сертификаты', href: '/admin/certificates' },
      { label: 'РПП записи', href: '/admin/rpp-entries' },
      { label: 'CAD-файлы', href: '/admin/inventor-files' },
      { label: 'Дашборд', href: '/admin' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  // Фильтруем навигацию по роли пользователя
  const filteredNav = navigation.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!user) return false;
    // admin видит всё
    if (user.role === 'admin') return true;
    return item.roles.includes(user.role);
  });

  // Фильтруем дочерние пункты
  const filterChildren = (children: { label: string; href: string; roles?: string[] }[] | undefined) => {
    if (!children) return undefined;
    return children.filter((child) => {
      if (!child.roles || child.roles.length === 0) return true;
      if (!user) return false;
      if (user.role === 'admin') return true;
      return child.roles.includes(user.role);
    });
  };

  const toggleSection = (href: string) => {
    setExpanded(expanded === href ? null : href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 glass-surface border-r border-[var(--border)]/60 overflow-hidden',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{background: 'var(--gradient-sidebar)'}}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)]">
              <span className="text-[var(--primary)]">KP</span>
              <span>CRM</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-[var(--muted)]">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation — v3.2 section color-coding via design tokens */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const filteredChildren = filterChildren(item.children);
                const isActive = pathname === item.href ||
                  (filteredChildren && filteredChildren.some(c => pathname === c.href));
                const isExpanded = expanded === item.href || filteredChildren?.some(c => pathname === c.href);

                /* Per-section design tokens: stripe / bg / icon — injected via
                   CSS vars. Children Cascade down so child links inside an
                   expanded section inherit them too. */
                const sectionStyle = {
                  '--sec-stripe': `var(--nav-${item.section}-stripe)`,
                  '--sec-bg': `var(--nav-${item.section}-bg)`,
                  '--sec-icon': `var(--nav-${item.section}-icon)`,
                } as React.CSSProperties;

                if (filteredChildren && filteredChildren.length > 0) {
                  return (
                    <li key={item.href} style={sectionStyle}>
                      <button
                        onClick={() => toggleSection(item.href)}
                        className={cn(
                          /* border-l-[3px] stripe — invisible until hover/active,
                             smooth 200ms color transitions (no pop). */
                          'relative w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm font-medium',
                          'border-l-[3px] transition-colors duration-200',
                          isActive
                            ? 'border-[var(--sec-stripe)] bg-[var(--sec-bg)] text-[var(--sec-icon)]'
                            : 'border-transparent text-muted-foreground hover:border-[var(--sec-stripe)]/60 hover:bg-[var(--sec-bg)] hover:text-[var(--sec-icon)]',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180',
                        )} />
                      </button>
                      {isExpanded && (
                        <ul className="mt-1 ml-4 space-y-1">
                          {filteredChildren.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'block px-3 py-1.5 rounded-lg text-sm border-l-[2px] transition-colors duration-200',
                                  pathname === child.href
                                    ? 'border-[var(--sec-stripe)] bg-[var(--sec-bg)] text-[var(--sec-icon)] font-medium'
                                    : 'border-transparent text-muted-foreground hover:border-[var(--sec-stripe)]/50 hover:bg-[var(--sec-bg)]/70 hover:text-[var(--sec-icon)]',
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href} style={sectionStyle}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm font-medium',
                        'border-l-[3px] transition-colors duration-200',
                        isActive
                          ? 'border-[var(--sec-stripe)] bg-[var(--sec-bg)] text-[var(--sec-icon)]'
                          : 'border-transparent text-muted-foreground hover:border-[var(--sec-stripe)]/60 hover:bg-[var(--sec-bg)] hover:text-[var(--sec-icon)]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)]">KP CRM v5.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
