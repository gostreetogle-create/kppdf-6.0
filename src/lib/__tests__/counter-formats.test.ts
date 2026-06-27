import { describe, it, expect } from 'vitest';
import { formatDocNumber } from '../counter';

describe('formatDocNumber', () => {
  it('должен форматировать число с padStart 4', () => {
    expect(formatDocNumber('КП', 1)).toBe('КП-0001');
  });

  it('должен форматировать число с padStart 4 для четырёхзначного', () => {
    expect(formatDocNumber('КП', 1234)).toBe('КП-1234');
  });

  it('должен форматировать число с padStart 4 для пятизначного', () => {
    expect(formatDocNumber('Д', 12345)).toBe('Д-12345');
  });

  it('должен использовать разные префиксы', () => {
    expect(formatDocNumber('СФ', 1)).toBe('СФ-0001');
    expect(formatDocNumber('ЗК', 42)).toBe('ЗК-0042');
    expect(formatDocNumber('ЗП', 100)).toBe('ЗП-0100');
    expect(formatDocNumber('Т', 1)).toBe('Т-0001');
    expect(formatDocNumber('С', 5)).toBe('С-0005');
    expect(formatDocNumber('РПП', 1)).toBe('РПП-0001');
    expect(formatDocNumber('ЗР', 1)).toBe('ЗР-0001');
    expect(formatDocNumber('АС', 1)).toBe('АС-0001');
  });

  it('должен работать с нулём', () => {
    expect(formatDocNumber('КП', 0)).toBe('КП-0000');
  });
});
