/**
 * Таблица позиций КП — inline-editable прямо внутри живой preview А4.
 * Использует Mantine NumberInput для quantity/price/discount с controlled value.
 * total пересчитывается через pure-function computeLineTotal сразу при изменении.
 */
'use client';

import { Table, Group, TextInput, NumberInput, ActionIcon, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { computeLineTotal } from '@/lib/validations/proposal.schema';
import type { SerializedProposalItem } from '@/lib/serialize';

interface Props {
  items: SerializedProposalItem[];
  vatRate: number;
  onUpdateItem: (id: string, patch: Partial<SerializedProposalItem>) => void;
  onRemoveItem: (id: string) => void;
}

export function ItemsTable({ items, onUpdateItem, onRemoveItem }: Props) {
  if (items.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        Нет позиций. Добавьте товары из левой витрины.
      </Text>
    );
  }
  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>№</Table.Th>
          <Table.Th>Артикул</Table.Th>
          <Table.Th>Название</Table.Th>
          <Table.Th ta="right">Кол-во</Table.Th>
          <Table.Th ta="right">Цена</Table.Th>
          <Table.Th ta="right">Скидка, %</Table.Th>
          <Table.Th ta="right">Итого</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((it, idx) => (
          <Table.Tr key={it.id}>
            <Table.Td>{idx + 1}</Table.Td>
            <Table.Td>{it.productSku}</Table.Td>
            <Table.Td>
              <Group gap={4} wrap="nowrap">
                <Text>{it.productName}</Text>
                <Text c="dimmed" size="xs">
                  ({it.productUnit})
                </Text>
              </Group>
            </Table.Td>
            <Table.Td ta="right">
              <NumberInput
                value={it.quantity}
                onChange={(v) => {
                  const qty = Number(v) || 0;
                  onUpdateItem(it.id, {
                    quantity: qty,
                    total: computeLineTotal(qty, it.price, 0, it.discountPercent),
                  });
                }}
                min={0.001}
                step={1}
                decimalScale={3}
                size="xs"
                w={80}
                hideControls
              />
            </Table.Td>
            <Table.Td ta="right">
              <NumberInput
                value={it.price}
                onChange={(v) => {
                  const price = Number(v) || 0;
                  onUpdateItem(it.id, {
                    price,
                    total: computeLineTotal(it.quantity, price, 0, it.discountPercent),
                  });
                }}
                min={0}
                step={100}
                decimalScale={2}
                size="xs"
                w={100}
                hideControls
              />
            </Table.Td>
            <Table.Td ta="right">
              <NumberInput
                value={it.discountPercent ?? ''}
                onChange={(v) => {
                  const raw = v === '' || v == null ? null : Number(v);
                  const discount = raw === null ? null : Math.max(0, Math.min(100, raw));
                  onUpdateItem(it.id, {
                    discountPercent: discount,
                    total: computeLineTotal(it.quantity, it.price, 0, discount),
                  });
                }}
                min={0}
                max={100}
                size="xs"
                w={70}
                hideControls
              />
            </Table.Td>
            <Table.Td ta="right" fw={500}>
              {it.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
            </Table.Td>
            <Table.Td>
              <ActionIcon
                color="red"
                variant="subtle"
                size="sm"
                onClick={() => onRemoveItem(it.id)}
                title="Удалить позицию"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
