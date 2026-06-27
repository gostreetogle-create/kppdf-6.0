import { describe, it, expect } from 'vitest';
import { CreateOrderClosingSchema, UpdateOrderClosingSchema } from '../validations/order-closing';
import { CreateReconciliationActSchema, UpdateReconciliationActSchema } from '../validations/reconciliation-act';
import { CreateIncomingInvoiceSchema, UpdateIncomingInvoiceSchema } from '../validations/incoming-invoice';

describe('CreateOrderClosingSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = CreateOrderClosingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('должен устанавливать closingType=full по умолчанию', () => {
    const result = CreateOrderClosingSchema.parse({});
    expect(result.closingType).toBe('full');
  });

  it('должен устанавливать status=draft по умолчанию', () => {
    const result = CreateOrderClosingSchema.parse({});
    expect(result.status).toBe('draft');
  });

  it('должен устанавливать totalAmount=0 по умолчанию', () => {
    const result = CreateOrderClosingSchema.parse({});
    expect(result.totalAmount).toBe(0);
  });

  it('должен принимать все closingType', () => {
    for (const ct of ['full', 'partial']) {
      const result = CreateOrderClosingSchema.safeParse({ closingType: ct });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный closingType', () => {
    const result = CreateOrderClosingSchema.safeParse({ closingType: 'half' });
    expect(result.success).toBe(false);
  });

  it('должен принимать все статусы', () => {
    for (const status of ['draft', 'approved', 'completed']) {
      const result = CreateOrderClosingSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять отрицательный totalAmount', () => {
    const result = CreateOrderClosingSchema.safeParse({ totalAmount: -100 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateOrderClosingSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateOrderClosingSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CreateReconciliationActSchema', () => {
  it('должен требовать periodStart', () => {
    const result = CreateReconciliationActSchema.safeParse({ periodEnd: '2026-01-01' });
    expect(result.success).toBe(false);
  });

  it('должен требовать periodEnd', () => {
    const result = CreateReconciliationActSchema.safeParse({ periodStart: '2026-01-01' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateReconciliationActSchema.safeParse({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreateReconciliationActSchema.parse({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-01',
    });
    expect(result.status).toBe('draft');
  });

  it('должен принимать статус signed', () => {
    const result = CreateReconciliationActSchema.safeParse({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-01',
      status: 'signed',
    });
    expect(result.success).toBe(true);
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateReconciliationActSchema.safeParse({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-01',
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный totalDebit', () => {
    const result = CreateReconciliationActSchema.safeParse({
      periodStart: '2026-01-01',
      periodEnd: '2026-06-01',
      totalDebit: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateReconciliationActSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateReconciliationActSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CreateIncomingInvoiceSchema', () => {
  it('должен пропускать пустой объект', () => {
    const result = CreateIncomingInvoiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreateIncomingInvoiceSchema.parse({});
    expect(result.status).toBe('draft');
  });

  it('должен устанавливать totalAmount=0 по умолчанию', () => {
    const result = CreateIncomingInvoiceSchema.parse({});
    expect(result.totalAmount).toBe(0);
  });

  it('должен принимать все статусы', () => {
    for (const status of ['draft', 'paid', 'overdue']) {
      const result = CreateIncomingInvoiceSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateIncomingInvoiceSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный totalAmount', () => {
    const result = CreateIncomingInvoiceSchema.safeParse({ totalAmount: -50 });
    expect(result.success).toBe(false);
  });

  it('должен пропускать notes', () => {
    const result = CreateIncomingInvoiceSchema.safeParse({ notes: 'Оплата ожидается' });
    expect(result.success).toBe(true);
  });
});

describe('UpdateIncomingInvoiceSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateIncomingInvoiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
