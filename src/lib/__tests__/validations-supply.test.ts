import { describe, it, expect } from 'vitest';
import { CreateSupplierOrderSchema, UpdateSupplierOrderSchema, SupplierOrderItemSchema } from '../validations/supplier-order';
import { CreatePurchaseRequestSchema, UpdatePurchaseRequestSchema, PurchaseRequestItemSchema } from '../validations/purchase-request';

describe('SupplierOrderItemSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = SupplierOrderItemSchema.safeParse({ name: 'Болт', quantity: 10 });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать unit=шт по умолчанию', () => {
    const result = SupplierOrderItemSchema.parse({ name: 'Болт', quantity: 1 });
    expect(result.unit).toBe('шт');
  });

  it('должен устанавливать unitPrice=0 по умолчанию', () => {
    const result = SupplierOrderItemSchema.parse({ name: 'Болт', quantity: 1 });
    expect(result.unitPrice).toBe(0);
  });

  it('должен отклонять пустое name', () => {
    const result = SupplierOrderItemSchema.safeParse({ name: '', quantity: 1 });
    expect(result.success).toBe(false);
  });

  it('должен отклонять quantity=0', () => {
    const result = SupplierOrderItemSchema.safeParse({ name: 'Болт', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный quantity', () => {
    const result = SupplierOrderItemSchema.safeParse({ name: 'Болт', quantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe('CreateSupplierOrderSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = CreateSupplierOrderSchema.safeParse({ title: 'Заказ поставщику' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreateSupplierOrderSchema.parse({ title: 'Заказ' });
    expect(result.status).toBe('draft');
  });

  it('должен устанавливать totalAmount=0 по умолчанию', () => {
    const result = CreateSupplierOrderSchema.parse({ title: 'Заказ' });
    expect(result.totalAmount).toBe(0);
  });

  it('должен отклонять пустое title', () => {
    const result = CreateSupplierOrderSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('должен принимать все статусы', () => {
    for (const status of ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']) {
      const result = CreateSupplierOrderSchema.safeParse({ title: 'Заказ', status });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateSupplierOrderSchema.safeParse({ title: 'Заказ', status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать items', () => {
    const result = CreateSupplierOrderSchema.safeParse({
      title: 'Заказ',
      items: [{ name: 'Болт', quantity: 10 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateSupplierOrderSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateSupplierOrderSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('PurchaseRequestItemSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = PurchaseRequestItemSchema.safeParse({ name: 'Краска', quantity: 5 });
    expect(result.success).toBe(true);
  });

  it('должен отклонять пустое name', () => {
    const result = PurchaseRequestItemSchema.safeParse({ name: '', quantity: 1 });
    expect(result.success).toBe(false);
  });

  it('должен отклонять quantity не целое', () => {
    const result = PurchaseRequestItemSchema.safeParse({ name: 'Краска', quantity: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('CreatePurchaseRequestSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = CreatePurchaseRequestSchema.safeParse({ title: 'Заявка на закупку' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreatePurchaseRequestSchema.parse({ title: 'Заявка' });
    expect(result.status).toBe('draft');
  });

  it('должен принимать все статусы', () => {
    for (const status of ['draft', 'approved', 'ordered', 'received', 'cancelled']) {
      const result = CreatePurchaseRequestSchema.safeParse({ title: 'Заявка', status });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreatePurchaseRequestSchema.safeParse({ title: 'Заявка', status: 'deleted' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательный totalAmount', () => {
    const result = CreatePurchaseRequestSchema.safeParse({ title: 'Заявка', totalAmount: -100 });
    expect(result.success).toBe(false);
  });

  it('должен пропускать items', () => {
    const result = CreatePurchaseRequestSchema.safeParse({
      title: 'Заявка',
      items: [{ name: 'Краска', quantity: 5 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdatePurchaseRequestSchema', () => {
  it('должен быть partial', () => {
    const result = UpdatePurchaseRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
