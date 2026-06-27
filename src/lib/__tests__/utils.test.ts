import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatDateTime } from '../utils';

describe('cn', () => {
  it('должен объединять классы', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('должен обрабатывать пустые значения', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('должен обрабатывать undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('должен обрабатывать null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('должен обрабатывать объединение через tailwind-merge', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6'); // последний побеждает
  });
});

describe('formatCurrency', () => {
  it('должен форматировать целые числа', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('₽');
    expect(result.replace(/\u00A0/g, ' ')).toBe('1 000 ₽');
  });

  it('должен форматировать ноль', () => {
    const result = formatCurrency(0);
    expect(result).toBe('0 ₽');
  });

  it('должен округлять дробные числа', () => {
    const result = formatCurrency(1500.75);
    expect(result.replace(/\u00A0/g, ' ')).toBe('1 501 ₽');
  });

  it('должен форматировать большие числа', () => {
    const result = formatCurrency(1000000);
    expect(result.replace(/\u00A0/g, ' ')).toBe('1 000 000 ₽');
  });

  it('должен форматировать отрицательные числа', () => {
    const result = formatCurrency(-500);
    expect(result).toBe('-500 ₽');
  });

  it('должен форматировать малые числа', () => {
    const result = formatCurrency(49.3);
    expect(result).toBe('49 ₽');
  });
});

describe('formatDate', () => {
  it('должен форматировать строку с датой', () => {
    const result = formatDate('2026-06-18T00:00:00.000Z');
    expect(result).toContain('18');
    expect(result).toContain('06');
    expect(result).toContain('2026');
  });

  it('должен форматировать объект Date', () => {
    const date = new Date('2026-06-18T00:00:00.000Z');
    const result = formatDate(date);
    expect(result).toContain('06');
    expect(result).toContain('2026');
  });

  it('должен использовать формат ДД.ММ.ГГГГ', () => {
    const result = formatDate('2026-03-15T00:00:00.000Z');
    // ru-RU locale: 15.03.2026
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});

describe('formatDateTime', () => {
  it('должен форматировать дату с временем', () => {
    const result = formatDateTime('2026-06-18T10:30:00.000Z');
    expect(result).toContain('06');
    expect(result).toContain('2026');
    // должно содержать часы и минуты
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
  });
});
