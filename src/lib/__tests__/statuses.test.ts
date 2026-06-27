import { describe, it, expect } from 'vitest';
import { getStatus, PROPOSAL_STATUS, ORDER_STATUS, TASK_STATUS, SHIPPING_STATUS } from '../constants/statuses';

describe('getStatus', () => {
  it('должен возвращать конфиг для существующего статуса', () => {
    const result = getStatus(PROPOSAL_STATUS, 'draft');
    expect(result.label).toBe('Черновик');
    expect(result.className).toMatch(/var\(--status-[a-z]+-bg\)/);
  });

  it('должен возвращать дефолтный конфиг для неизвестного статуса', () => {
    const result = getStatus(ORDER_STATUS, 'unknown_status');
    expect(result.label).toBe('unknown_status');
    expect(result.className).toMatch(/var\(--status-[a-z]+-bg\)/);
  });

  it('должен корректно возвращать все статусы proposal', () => {
    const statuses = ['draft', 'sent', 'accepted', 'rejected', 'converted'];
    const labels = ['Черновик', 'Отправлено', 'Принято', 'Отклонено', 'Конвертировано'];

    statuses.forEach((s, i) => {
      expect(getStatus(PROPOSAL_STATUS, s).label).toBe(labels[i]);
    });
  });

  it('должен корректно возвращать статусы отгрузки', () => {
    expect(getStatus(SHIPPING_STATUS, 'draft').label).toBe('Черновик');
    expect(getStatus(SHIPPING_STATUS, 'partially').label).toBe('Частично');
    expect(getStatus(SHIPPING_STATUS, 'shipped').label).toBe('Отгружено');
    expect(getStatus(SHIPPING_STATUS, 'cancelled').label).toBe('Отменено');
  });
});

describe('status maps completeness', () => {
  it('PROPOSAL_STATUS должен содержать все ключи', () => {
    expect(Object.keys(PROPOSAL_STATUS)).toEqual(
      expect.arrayContaining(['draft', 'sent', 'accepted', 'rejected', 'converted'])
    );
  });

  it('ORDER_STATUS должен содержать все ключи', () => {
    expect(Object.keys(ORDER_STATUS)).toEqual(
      expect.arrayContaining(['planned', 'in_progress', 'manufacturing', 'painting', 'shipping', 'completed', 'cancelled'])
    );
  });

  it('TASK_STATUS должен содержать все ключи', () => {
    expect(Object.keys(TASK_STATUS)).toEqual(
      expect.arrayContaining(['pending', 'in_progress', 'completed', 'blocked'])
    );
  });
});
