/**
 * «Каркас-Kit» — единый 3-зонный layout для всех 6 модулей (КП/Договор/Производство/Склад/Финансы/Картотека).
 * Согласовано: МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md §1 «Каркас-Kit».
 *
 * Структура (Mantine AppShell):
 * - Header (верх): название приложения, бейдж текущего пользователя, logout
 * - Navbar (левая): меню навигации по модулям + поиск по сделкам
 * - Main (центр): основной контент (А4 / таблицы / формы)
 * - Aside (правая): действия + история комментариев
 */
'use client';

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Title,
  Text,
  Badge,
  ActionIcon,
  Stack,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';

interface KarkasLayoutProps {
  user: {
    fullName: string;
    role: string;
  };
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/proposals', label: 'Коммерческие предложения' },
  { href: '/contracts', label: 'Договоры' },
  { href: '/production', label: 'Производство' },
  { href: '/warehouse', label: 'Склад' },
  { href: '/finance', label: 'Финансы' },
  { href: '/kartoteka', label: 'Картотека сделок' },
];

export function KarkasLayout({ user, children }: KarkasLayoutProps) {
  const [opened, { toggle }] = useDisclosure(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      aside={{ width: 280, breakpoint: 'md' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>KPPDF CRM</Title>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">{user.fullName}</Text>
            <Badge variant="light">{user.role}</Badge>
            <ActionIcon variant="subtle" onClick={handleLogout} title="Выйти">
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea>
          <Stack gap={4}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
              />
            ))}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Aside p="sm">
        <Stack gap="sm">
          <ActionIcon variant="light" size="lg">
            <IconSearch size={20} />
          </ActionIcon>
          <Text size="sm" c="dimmed">История комментариев · v1 (правка F)</Text>
        </Stack>
      </AppShell.Aside>
    </AppShell>
  );
}
