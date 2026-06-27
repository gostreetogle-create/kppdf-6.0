/**
 * counter.ts — Автоинкремент номеров документов
 *
 * Аналог nextCounter() из v4.0.
 * При создании документа вызывает nextCounter('proposal') → получает число,
 * форматирует как "КП-0001".
 */

import { prisma } from './db';

/**
 * Получить следующее значение счётчика (атомарно)
 * Аналог MongoDB $inc + upsert
 */
export async function nextCounter(name: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

/**
 * Форматировать номер документа с префиксом
 */
export function formatDocNumber(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`;
}

// ── Документы продаж ──────────────────────────────────────────

/** КП-0001 */
export async function nextProposalNumber(): Promise<string> {
  const val = await nextCounter('proposal');
  return formatDocNumber('КП', val);
}

/** Д-0001 */
export async function nextContractNumber(): Promise<string> {
  const val = await nextCounter('contract');
  return formatDocNumber('Д', val);
}

/** СФ-0001 */
export async function nextInvoiceNumber(): Promise<string> {
  const val = await nextCounter('invoice');
  return formatDocNumber('СФ', val);
}

// ── Производство ──────────────────────────────────────────────

/** ЗК-0001 — производственный заказ */
export async function nextProductionOrderNumber(): Promise<string> {
  const val = await nextCounter('production-order');
  return formatDocNumber('ЗК', val);
}

// ── Снабжение ─────────────────────────────────────────────────

/** ЗП-0001 — заказ поставщику / заявка на закупку */
export async function nextSupplierOrderNumber(): Promise<string> {
  const val = await nextCounter('supplier-order');
  return formatDocNumber('ЗП', val);
}

// ── Администрирование ─────────────────────────────────────────

/** Т-0001 — тендер */
export async function nextTenderNumber(): Promise<string> {
  const val = await nextCounter('tender');
  return formatDocNumber('Т', val);
}

/** С-0001 — сертификат */
export async function nextCertificateNumber(): Promise<string> {
  const val = await nextCounter('certificate');
  return formatDocNumber('С', val);
}

/** РПП-0001 */
export async function nextRppNumber(): Promise<string> {
  const val = await nextCounter('rpp-entry');
  return formatDocNumber('РПП', val);
}

// ── Финансы ───────────────────────────────────────────────────

/** ЗР-0001 — закрытие заказа */
export async function nextOrderClosingNumber(): Promise<string> {
  const val = await nextCounter('order-closing');
  return formatDocNumber('ЗР', val);
}

/** АС-0001 — акт сверки */
export async function nextReconciliationNumber(): Promise<string> {
  const val = await nextCounter('reconciliation');
  return formatDocNumber('АС', val);
}

/**
 * Сбросить счётчик (для тестов/админки)
 */
export async function resetCounter(name: string): Promise<void> {
  await prisma.counter.upsert({
    where: { name },
    create: { name, value: 0 },
    update: { value: 0 },
  });
}
