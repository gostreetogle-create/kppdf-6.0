'use client';

import { Users, FileText, Shield, Building2, Package, Factory } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Typography, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';

interface AdminStats {
  users: number;
  proposals: number;
  contracts: number;
  organizations: number;
  products: number;
  productionOrders: number;
}

const cards = [
  { label: 'Пользователи', key: 'users' as const, icon: Users, bgClass: 'bg-[var(--status-info-solid)]/10', iconClass: 'text-[var(--status-info-solid)]', href: '/admin/users' },
  { label: 'КП', key: 'proposals' as const, icon: FileText, bgClass: 'bg-[var(--status-success-solid)]/10', iconClass: 'text-[var(--status-success-solid)]', href: '/proposals' },
  { label: 'Договоры', key: 'contracts' as const, icon: Shield, bgClass: 'bg-[var(--status-purple-text)]/10', iconClass: 'text-[var(--status-purple-text)]', href: '/contracts' },
  { label: 'Контрагенты', key: 'organizations' as const, icon: Building2, bgClass: 'bg-[var(--status-orange-text)]/10', iconClass: 'text-[var(--status-orange-text)]', href: '/organizations' },
  { label: 'Товары', key: 'products' as const, icon: Package, bgClass: 'bg-[var(--status-cyan-text)]/10', iconClass: 'text-[var(--status-cyan-text)]', href: '/products' },
  { label: 'Заказы производства', key: 'productionOrders' as const, icon: Factory, bgClass: 'bg-[var(--status-danger-solid)]/10', iconClass: 'text-[var(--status-danger-solid)]', href: '/production' },
];

const quickLinks = [
  { icon: Users, label: 'Управление пользователями', href: '/admin/users' },
  { icon: Shield, label: 'Мастер статусов', href: '/admin/status-workflows' },
  { icon: Shield, label: 'Сертификаты', href: '/admin/certificates' },
  { icon: FileText, label: 'РПП записи', href: '/admin/rpp-entries' },
  { icon: Package, label: 'CAD-файлы', href: '/admin/inventor-files' },
];

const systemInfo = [
  ['Версия', '5.0.0'],
  ['Framework', 'Next.js'],
  ['База данных', 'PostgreSQL'],
  ['ORM', 'Prisma'],
  ['UI', 'Tailwind CSS'],
] as const;

export function AdminStatsCards({ stats }: { stats: AdminStats }) {
  return (
    <Grid cols="auto-md" gap="md">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <a key={card.label} href={card.href} className="group">
            <Card variant="interactive" className="p-6 h-full">
              <Flex justify="between" align="start">
                <div className={`h-10 w-10 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${card.iconClass}`} />
                </div>
                <Typography variant="h3">{value}</Typography>
              </Flex>
              <Muted className="mt-3 group-hover:text-foreground transition-colors">{card.label}</Muted>
            </Card>
          </a>
        );
      })}
    </Grid>
  );
}

export function AdminQuickLinks() {
  return (
    <Card className="p-6">
      <Typography variant="h4" className="mb-4">Быстрые ссылки</Typography>
      <Stack gap="sm">
        {quickLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
          >
            <link.icon className="h-4 w-4 text-muted-foreground" />
            {link.label}
          </a>
        ))}
      </Stack>
    </Card>
  );
}

export function AdminSystemInfo() {
  return (
    <Card className="p-6">
      <Typography variant="h4" className="mb-4">Информация о системе</Typography>
      <Stack gap="sm">
        {systemInfo.map(([label, value]) => (
          <Flex key={label} justify="between">
            <Muted>{label}</Muted>
            <span className="text-sm font-medium text-foreground">{value}</span>
          </Flex>
        ))}
      </Stack>
    </Card>
  );
}
