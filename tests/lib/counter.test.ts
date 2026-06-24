import { describe, it, expect } from 'vitest';
import { formatNumber, type CounterType } from '@/lib/counter';

/**
 * Pure-function tests для formatNumber (внутренняя хелпер-функция counter.ts).
 * НЕ покрывает:
 * - nextNumber() + $transaction + SELECT FOR UPDATE — это integration test, требует реальный PG
 * - peekCounter() — требует реальный PG
 *
 * Эти unit-тесты покрывают только pure-логику форматирования (PREFIX_BY_TYPE + year + padding).
 */
describe('counter formatNumber (lib/counter)', () => {
  // Канонические префиксы — синхронизированы с SCHEMA-CONSOLIDATED.md §4
  const expectedPrefixes: Array<[CounterType, string]> = [
    ['proposal', 'КП'],
    ['contract', 'Д'],
    ['production', 'ЗК'],
    ['order', 'Order'],
    ['invoice', 'Inv'],
    ['payment', 'Pay'],
    ['supplier_delivery', 'СД'],
    ['shipment', 'ОТК'],
    ['write_off', 'АС'],
    ['purchase_order', 'ЗП'],
    ['comment', 'C'],
  ];

  it('formats all 11 CounterType values with correct prefix and 4-digit padding', () => {
    for (const [type, prefix] of expectedPrefixes) {
      const result = formatNumber(type, 1n, null);
      // Ожидаем: PREFIX-0001 (без year)
      expect(result).toBe(`${prefix}-0001`);
    }
  });

  it('pads numbers correctly up to 4 digits', () => {
    expect(formatNumber('proposal', 9n, null)).toBe('КП-0009');
    expect(formatNumber('proposal', 99n, null)).toBe('КП-0099');
    expect(formatNumber('proposal', 999n, null)).toBe('КП-0999');
    expect(formatNumber('proposal', 1000n, null)).toBe('КП-1000');
  });

  it('handles large values (10+ digits) for future-proof numbering', () => {
    expect(formatNumber('proposal', 1000000n, null)).toBe('КП-1000000');
    expect(formatNumber('invoice', 9999999n, null)).toBe('Inv-9999999');
  });

  it('matches expected canonical format for proposal КП-0001', () => {
    // Самая частая проверка — КП-0001 (sales flow)
    expect(formatNumber('proposal', 1n, null)).toBe('КП-0001');
  });

  it('includes year suffix when year is provided', () => {
    expect(formatNumber('proposal', 1n, 2026)).toBe('КП-2026-0001');
    expect(formatNumber('order', 1n, 2025)).toBe('Order-2025-0001');
  });

  it('omits year when year is null (сквозной счётчик)', () => {
    expect(formatNumber('production', 5n, null)).toBe('ЗК-0005');
  });

  it('all 11 CounterType values accept the same uniform value', () => {
    for (const [type] of expectedPrefixes) {
      const r = formatNumber(type, 42n, null);
      // Всегда формат PREFIX-0042 (- для 2-digit values)
      expect(r).toMatch(/^[А-ЯA-Za-z][А-ЯA-Za-z]*-0042$/);
    }
  });

  it('accepts 0n as initial value', () => {
    expect(formatNumber('proposal', 0n, null)).toBe('КП-0000');
  });

  it('handles combinations: year + zero value', () => {
    expect(formatNumber('contract', 0n, 2027)).toBe('Д-2027-0000');
  });
});
