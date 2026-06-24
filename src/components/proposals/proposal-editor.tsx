/**
 * ProposalEditor — главный Client Component редактора КП.
 *
 * Структура (МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ §5 «Каркас-Kit»):
 * - LEFT  (col-span 3): витрина товаров (ProductsShowcase) — фильтр + клик «+» добавляет в items.
 * - CENTER (col-span 6): живой preview А4 (Paper 210mm×297mm) с inline-editable таблицей позиций (ItemsTable).
 * - RIGHT (col-span 3): мета КП + кнопки действий + AutosaveIndicator.
 *
 * Autosave: см. src/lib/stores/proposal.store.ts — debounce 7s + persist (localStorage).
 * Hydration: setDraft(initialData) на mount; далее все edits через store.
 */
'use client';

import { useEffect, useRef } from 'react';
import { Grid, Stack, TextInput, NumberInput, Select, Paper, Group, Divider, Title, Text, Button, ActionIcon } from '@mantine/core';
import { IconDeviceFloppy, IconTrash, IconPrinter } from '@tabler/icons-react';
import { useProposalStore, selectDraft } from '@/lib/stores/proposal.store';
import { apiPut, ApiError } from '@/lib/api-client';
import { AutosaveIndicator } from './autosave-indicator';
import { ItemsTable } from './items-table';
import { ProductsShowcase } from './products-showcase';
import { computeLineTotal } from '@/lib/validations/proposal.schema';
import type { SerializedProposal, SerializedProposalItem } from '@/lib/serialize';

type ProductLite = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  kind: string;
  price: number;
};

interface Props {
  initialData: SerializedProposal;
  contractors: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  products: ProductLite[];
}

/** Простой UUID для новых позиций (сервер при сохранении мапит на Prisma id при необходимости). */
function newClientId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ProposalEditor({ initialData, contractors, customers, products }: Props) {
  const draft = useProposalStore(selectDraft);
  const pendingDirty = useProposalStore((s) => s.pendingDirty);
  const setDraft = useProposalStore((s) => s.setDraft);
  const updateItem = useProposalStore((s) => s.updateItem);
  const removeItem = useProposalStore((s) => s.removeItem);
  const addItem = useProposalStore((s) => s.addItem);
  const updateMeta = useProposalStore((s) => s.updateMeta);
  const scheduleAutosave = useProposalStore((s) => s.scheduleAutosave);
  const reset = useProposalStore((s) => s.reset);
  const hasHydratedRef = useRef(false);

  // Hydrate store on mount + reset on unmount.
  useEffect(() => {
    if (!hasHydratedRef.current) {
      // Только если в store пусто (первый mount) или другой id.
      if (!draft || draft.id !== initialData.id) {
        setDraft(initialData);
      }
      hasHydratedRef.current = true;
    }
    return () => {
      // ВАЖНО: НЕ сбрасываем store на unmount — это стёрло бы persist localStorage и сломало refresh-restore.
      // reset() вызывается только при logout (api/auth/logout → router.push('/login')).
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData.id]);

  // На локальные изменения draft → scheduleAutosave (debounced).
  // Гейт по `pendingDirty` критичен: после успешного setDraft(serverResponse) React re-render триггерит
  // useEffect, но pendingDirty=false → scheduleAutosave пропускает лишний PUT (break infinite loop).
  useEffect(() => {
    if (!draft || !pendingDirty) return;
    const cancel = scheduleAutosave(draft.id, async (id, body) => {
      const updated = await apiPut<SerializedProposal>(`/api/proposals/${id}`, body);
      setDraft(updated);
    });
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, pendingDirty]);

  const onAddProduct = (product: ProductLite, quantity = 1) => {
    // crypto.randomUUID() valid uuid v4 — server при PUT сохранит ProposalItem с этим id (см. /api/proposals/[id]).
    const newItem: SerializedProposal['items'][number] = {
      id: newClientId(),
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      productUnit: product.unit,
      quantity,
      price: product.price,
      discountPercent: null,
      total: computeLineTotal(quantity, product.price, 0, null),
      sortOrder: (draft?.items.length ?? 0) + 1,
      notes: null,
    };
    addItem(newItem);
  };

  const subtotal = (draft?.items ?? []).reduce((acc, it) => acc + it.total, 0);
  const vat = subtotal * ((draft?.vatRate ?? 0) / 100);
  const total = subtotal + vat;

  if (!draft) {
    return <Text c="dimmed">Загрузка…</Text>;
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleManualSave = async () => {
    // Manual save — без debounce: сразу PUT, синхронизируем draft из ответа.
    // При ошибке — выставляем saveStatus='error' чтобы AutosaveIndicator показал badge «⚠️ Не сохранено».
    try {
      const updated = await apiPut<SerializedProposal>(
        `/api/proposals/${draft.id}`,
        {
          lastUpdatedAt: draft.updatedAt,
          title: draft.title,
          customerId: draft.customerId,
          contractorId: draft.contractorId,
          vatRate: draft.vatRate,
          paymentTermDays: draft.paymentTermDays,
          packageTag: draft.packageTag,
          notes: draft.notes,
          validUntil: draft.validUntil,
          designSnapshot: draft.designSnapshot,
          items: draft.items.map((it) => ({
            id: it.id,
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
            discountPercent: it.discountPercent,
            notes: it.notes,
          })),
        },
      );
      setDraft(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      useProposalStore.getState().setSaveStatus('error', message);
    }
  };

  return (
    <Grid gutter="md" grow>
      {/* LEFT — витрина товаров */}
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Paper withBorder p="sm" h="calc(100vh - 100px)" style={{ overflow: 'hidden' }}>
          <ProductsShowcase products={products} onAdd={(p) => onAddProduct(p, 1)} />
        </Paper>
      </Grid.Col>

      {/* CENTER — живой preview А4 + таблица позиций */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm" align="center">
          <Paper
            withBorder
            shadow="md"
            p="lg"
            radius="sm"
            style={{
              width: '210mm',
              maxWidth: '100%',
              minHeight: '297mm',
              background: 'white',
              color: 'black',
            }}
          >
            <Stack gap="md">
              <Title order={2}>{draft.title || 'Без названия'}</Title>
              <Text size="sm" c="dimmed">
                {draft.number} · статус: <strong>{draft.status}</strong>
              </Text>
              <Divider />
              <Group justify="space-between">
                <Text size="sm">
                  <strong>Покупатель:</strong>{' '}
                  {customers.find((c) => c.id === draft.customerId)?.name ?? '—'}
                </Text>
                <Text size="sm">
                  <strong>Продавец:</strong>{' '}
                  {contractors.find((c) => c.id === draft.contractorId)?.name ?? '—'}
                </Text>
              </Group>
              <ItemsTable
                items={draft.items}
                vatRate={draft.vatRate}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
              <Divider />
              <Group justify="flex-end" gap="xl">
                <Text size="sm">Сумма: {subtotal.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽</Text>
                <Text size="sm">НДС ({draft.vatRate}%): {vat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽</Text>
                <Text fw={700} size="lg">
                  ИТОГО: {total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                </Text>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Grid.Col>

      {/* RIGHT — мета + параметры + кнопки */}
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Stack gap="md">
          <Paper withBorder p="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Title order={5}>Основное</Title>
                <AutosaveIndicator />
              </Group>
              <TextInput
                label="Название КП"
                value={draft.title}
                onChange={(e) => updateMeta({ title: e.currentTarget.value })}
              />
              <Select
                label="Покупатель (клиент)"
                data={customers.map((c) => ({ value: c.id, label: c.name }))}
                value={draft.customerId}
                onChange={(v) => v && updateMeta({ customerId: v })}
                searchable
              />
              <Select
                label="Продавец (мы)"
                data={contractors.map((c) => ({ value: c.id, label: c.name }))}
                value={draft.contractorId}
                onChange={(v) => v && updateMeta({ contractorId: v })}
                searchable
              />
              <NumberInput
                label="Ставка НДС, %"
                value={draft.vatRate}
                onChange={(v) => updateMeta({ vatRate: Number(v) || 0 })}
                min={0}
                max={100}
                decimalScale={2}
              />
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Stack gap="xs">
              <Title order={5}>Действия</Title>
              <Group>
                <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleManualSave} variant="light">
                  Сохранить
                </Button>
                <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="subtle">
                  Печать
                </Button>
              </Group>
              <Group>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  title="Архивировать (soft-delete)"
                  onClick={async () => {
                    if (!confirm('Архивировать КП?')) return;
                    await fetch(`/api/proposals/${draft.id}`, { method: 'DELETE' });
                    window.location.href = '/proposals';
                  }}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
