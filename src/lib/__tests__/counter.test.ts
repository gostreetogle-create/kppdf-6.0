import { describe, it, expect } from 'vitest';
import { formatDocNumber } from '../counter';

describe('formatDocNumber', () => {
  it('должен форматировать номер с префиксом и padStart 4', () => {
    expect(formatDocNumber('КП', 1)).toBe('КП-0001');
  });

  it('должен форматировать номер с ведущими нулями', () => {
    expect(formatDocNumber('Д', 42)).toBe('Д-0042');
  });

  it('должен форматировать номер без ведущих нулей при большом значении', () => {
    expect(formatDocNumber('ЗК', 1234)).toBe('ЗК-1234');
  });

  it('должен работать с пустым префиксом', () => {
    expect(formatDocNumber('', 1)).toBe('-0001');
  });

  it('должен работать с кириллическим префиксом', () => {
    expect(formatDocNumber('РПП', 5)).toBe('РПП-0005');
  });

  it('должен работать с числом 0', () => {
    expect(formatDocNumber('Т', 0)).toBe('Т-0000');
  });

  it('должен работать с пятизначным числом', () => {
    expect(formatDocNumber('СФ', 10000)).toBe('СФ-10000');
  });
});
