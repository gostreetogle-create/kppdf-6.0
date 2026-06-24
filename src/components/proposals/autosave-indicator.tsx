/**
 * Индикатор автосохранения в правой панели редактора (МОДУЛЬ §5 «Кнопки управления»).
 * Возвращает один Mantine Badge + опционально время последнего сохранения.
 *
 * Маппинг статусов → визуальный:
 *   idle    → серый кружок «Всё спокойно»
 *   saving  → жёлтый «⏳ Сохраняется…»
 *   saved   → зелёный «✓ Сохранено HH:MM»
 *   error   → красный «⚠️ Не сохранено»
 */
'use client';

import { Badge, Group, Text } from '@mantine/core';
import { IconCircleCheck, IconAlertTriangle, IconCircleDashed, IconLoader } from '@tabler/icons-react';
import { useProposalStore, selectSaveStatus } from '@/lib/stores/proposal.store';

const STATUS_MAP = {
  idle: { color: 'gray', label: 'Всё спокойно', icon: IconCircleDashed },
  saving: { color: 'yellow', label: 'Сохраняется…', icon: IconLoader },
  saved: { color: 'green', label: 'Сохранено', icon: IconCircleCheck },
  error: { color: 'red', label: 'Не сохранено', icon: IconAlertTriangle },
} as const;

export function AutosaveIndicator() {
  const { status, error, lastSavedAt } = useProposalStore(selectSaveStatus);
  const cfg = STATUS_MAP[status];
  const Icon = cfg.icon;
  const time = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Group gap={6} wrap="nowrap">
      <Badge color={cfg.color} variant="light" leftSection={<Icon size={12} />} size="sm">
        {cfg.label}
        {time ? ` ${time}` : ''}
      </Badge>
      {status === 'error' && error ? (
        <Text size="xs" c="red" lineClamp={2}>
          {error}
        </Text>
      ) : null}
    </Group>
  );
}
