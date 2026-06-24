/**
 * Safe-increment счётчика Counter через $transaction + SELECT FOR UPDATE.
 * Источник: SCHEMA-CONSOLIDATED.md §4.2 (Critical для Phase 1 Bootstrap).
 * Гарантия: PostgreSQL serializable isolation + row lock — две одновременные транзакции
 * НЕ получат одинаковый number.
 */
import { prisma } from './db';

export type CounterType =
  | 'proposal'
  | 'contract'
  | 'production'
  | 'order'
  | 'invoice'
  | 'payment'
  | 'supplier_delivery'
  | 'shipment'
  | 'write_off'
  | 'purchase_order'
  | 'comment';

const PREFIX_BY_TYPE: Record<CounterType, string> = {
  proposal: 'КП',
  contract: 'Д',
  production: 'ЗК',
  order: 'Order',
  invoice: 'Inv',
  payment: 'Pay',
  supplier_delivery: 'СД',
  shipment: 'ОТК',
  write_off: 'АС',
  purchase_order: 'ЗП',
  comment: 'C',
};

function export function formatNumber(type: CounterType, value: bigint, year: number | null): string {
  const padded = String(value).padStart(4, '0');
  const yearPart = year ? `-${year}` : '';
  return `${PREFIX_BY_TYPE[type]}${yearPart ? yearPart : ''}-${padded}`.replace('--', '-');
}

/**
 * Получить следующий номер для типа. Блокирует row внутри транзакции.
 * Возвращает форматированный номер документа (КП-0001, Д-0001, ...).
 */
export async function nextNumber(type: CounterType, year: number | null = null): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Блокируем row чтобы исключить race condition
    const rows = await tx.$queryRaw<Array<{ value: bigint }>>`
      SELECT value FROM "counters"
      WHERE id = ${type} AND "year" IS NOT DISTINCT FROM ${year}::int
      FOR UPDATE
    `;

    let nextValue: bigint;
    if (rows.length === 0) {
      // Counter ещё не seeded — создаём со значением 1
      await tx.$executeRaw`
        INSERT INTO "counters" (id, "year", value)
        VALUES (${type}, ${year}, 1)
        ON CONFLICT (id, "year") DO UPDATE SET value = "counters".value + 1
      `;
      nextValue = 1n;
    } else {
      nextValue = rows[0].value + 1n;
      await tx.$executeRaw`
        UPDATE "counters" SET value = ${nextValue}
        WHERE id = ${type} AND "year" IS NOT DISTINCT FROM ${year}::int
      `;
    }

    return formatNumber(type, nextValue, year);
  });
}

/**
 * Текущее значение счётчика (без инкремента). Для UI.
 */
export async function peekCounter(type: CounterType, year: number | null = null): Promise<bigint> {
  const counter = await prisma.counter.findUnique({
    where: { id_year: { id: type, year } },
  });
  return counter?.value ?? 0n;
}
