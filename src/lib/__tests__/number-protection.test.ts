import { describe, it, expect } from 'vitest';
import { assertNumberImmutable, NumberLockedError } from '../number-protection';

describe('assertNumberImmutable', () => {
  it('должен проходить если entity не в frozenStatuses', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'any_status', 'NEW-001', 'OLD-001'),
    ).not.toThrow();
  });

  it('должен проходить если newNumber === currentNumber', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'sent', 'КП-0001', 'КП-0001'),
    ).not.toThrow();
  });

  it('должен проходить если newNumber undefined', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'sent', undefined, 'КП-0001'),
    ).not.toThrow();
  });

  it('должен проходить если статус не заморожен', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'draft', 'КП-9999', 'КП-0001'),
    ).not.toThrow();
  });

  it('должен бросать NumberLockedError если статус заморожен и номер меняется', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'sent', 'КП-9999', 'КП-0001'),
    ).toThrow(NumberLockedError);
  });

  it('должен бросать с правильным кодом NUMBER_LOCKED', () => {
    try {
      assertNumberImmutable('contract', 'active', 'Д-9999', 'Д-0001');
    } catch (e) {
      expect(e).toBeInstanceOf(NumberLockedError);
      expect((e as NumberLockedError).code).toBe('NUMBER_LOCKED');
      return;
    }
    expect.fail('Должен был бросить NumberLockedError');
  });

  it('должен блокировать смену номера в completed для productionOrder', () => {
    expect(() =>
      assertNumberImmutable('productionOrder', 'completed', 'ЗК-1234', 'ЗК-0001'),
    ).toThrow(NumberLockedError);
  });

  it('должен блокировать смену номера в confirmed для supplierOrder', () => {
    expect(() =>
      assertNumberImmutable('supplierOrder', 'confirmed', 'ЗП-1234', 'ЗП-0001'),
    ).toThrow(NumberLockedError);
  });

  it('должен блокировать смену номера в paid для incomingInvoice', () => {
    expect(() =>
      assertNumberImmutable('incomingInvoice', 'paid', 'СФ-1234', 'СФ-0001'),
    ).toThrow(NumberLockedError);
  });

  it('должен проходить для proposal в статусе draft (не заморожен)', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'draft', 'КП-9999', 'КП-0001'),
    ).not.toThrow();
  });

  it('должен проходить для proposal в статусе rejected (не заморожен)', () => {
    expect(() =>
      assertNumberImmutable('proposal', 'rejected', 'КП-9999', 'КП-0001'),
    ).not.toThrow();
  });
});
