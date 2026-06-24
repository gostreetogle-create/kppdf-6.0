/**
 * Витрина товаров — левая зона редактора КП (МОДУЛЬ §5 «Левая панель»).
 * MVP: текстовый фильтр по имени/артикулу + tabs по типу + кнопка «+» добавляет в items.
 */
'use client';

import { useMemo, useState } from 'react';
import { Stack, Tabs, TextInput, Card, Group, Text, Button, ScrollArea } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';

type ProductKind = 'ITEM' | 'SERVICE' | 'WORK';

interface ProductLite {
  id: string;
  sku: string;
  name: string;
  unit: string;
  kind: ProductKind | string;
  price: number;
}

interface Props {
  products: ProductLite[];
  onAdd: (product: ProductLite) => void;
}

export function ProductsShowcase({ products, onAdd }: Props) {
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState<string>('all');

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return products
      .filter((p) => (tab === 'all' ? true : p.kind === tab))
      .filter((p) =>
        needle === ''
          ? true
          : p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle),
      )
      .slice(0, 100);
  }, [products, filter, tab]);

  return (
    <Stack gap="xs" h="100%">
      <Tabs value={tab} onChange={(v) => setTab(v ?? 'all')}>
        <Tabs.List>
          <Tabs.Tab value="all">Все</Tabs.Tab>
          <Tabs.Tab value="ITEM">Товары</Tabs.Tab>
          <Tabs.Tab value="SERVICE">Услуги</Tabs.Tab>
          <Tabs.Tab value="WORK">Работы</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <TextInput
        leftSection={<IconSearch size={14} />}
        placeholder="Поиск по артикулу или названию"
        value={filter}
        onChange={(e) => setFilter(e.currentTarget.value)}
        size="xs"
      />
      <ScrollArea h="calc(100% - 90px)">
        <Stack gap={6}>
          {filtered.length === 0 ? (
            <Text c="dimmed" ta="center" py="md" size="sm">
              Нет товаров по фильтру
            </Text>
          ) : (
            filtered.map((p) => (
              <Card key={p.id} withBorder padding="xs">
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="xs" c="dimmed">
                      {p.sku}
                    </Text>
                    <Text size="sm" fw={500} lineClamp={2}>
                      {p.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {p.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽ / {p.unit}
                    </Text>
                  </Stack>
                  <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => onAdd(p)}
                  >
                    В КП
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}
