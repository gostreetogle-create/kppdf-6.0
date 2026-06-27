import { describe, it, expect } from 'vitest';
import { CreateProductSchema, ProductModuleInputSchema, ModuleMaterialSchema } from '../validations/product';
import { CreateWarehouseSchema } from '../validations/warehouse';
import { CreateTenderSchema } from '../validations/tender';

// ═══════════════════════════════════════════════════════════════
// Product Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateProductSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: 'Стул офисный' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать productType=purchased по умолчанию', () => {
    const result = CreateProductSchema.parse({ sku: 'SKU-001', name: 'Стул' });
    expect(result.productType).toBe('purchased');
  });

  it('должен устанавливать unit=шт по умолчанию', () => {
    const result = CreateProductSchema.parse({ sku: 'SKU-001', name: 'Стул' });
    expect(result.unit).toBe('шт');
  });

  it('должен отклонять пустой sku', () => {
    const result = CreateProductSchema.safeParse({ sku: '', name: 'Стул' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять пустое name', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: '' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять отрицательную basePrice', () => {
    const result = CreateProductSchema.safeParse({ sku: 'SKU-001', name: 'Стул', basePrice: -100 });
    expect(result.success).toBe(false);
  });

  it('должен принимать все поля', () => {
    const data = {
      sku: 'SKU-001',
      name: 'Стул офисный',
      description: 'Удобный стул',
      productType: 'manufactured' as const,
      basePrice: 15000,
      defaultMarkupPercent: 20,
      unit: 'шт',
      weightKg: 8.5,
      hasPassport: true,
      hasDrawing: false,
      ralCode: 'RAL 9010',
    };
    const result = CreateProductSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('ModuleMaterialSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = ModuleMaterialSchema.safeParse({ name: 'Фанера' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать quantity=1 и unit=шт по умолчанию', () => {
    const result = ModuleMaterialSchema.parse({ name: 'Фанера' });
    expect(result.quantity).toBe(1);
    expect(result.unit).toBe('шт');
  });

  it('должен отклонять пустое name', () => {
    const result = ModuleMaterialSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('ProductModuleInputSchema', () => {
  it('должен пропускать минимальный объект', () => {
    const result = ProductModuleInputSchema.safeParse({ name: 'Каркас стола' });
    expect(result.success).toBe(true);
  });

  it('должен принимать вложенные materials', () => {
    const result = ProductModuleInputSchema.safeParse({
      name: 'Каркас',
      materials: [{ name: 'Фанера' }, { name: 'Краска', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Warehouse Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateWarehouseSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateWarehouseSchema.safeParse({ name: 'Основной склад' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять пустое name', () => {
    const result = CreateWarehouseSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Tender Validation
// ═══════════════════════════════════════════════════════════════

describe('CreateTenderSchema', () => {
  it('должен пропускать минимальный валидный объект', () => {
    const result = CreateTenderSchema.safeParse({ title: 'Тендер на поставку мебели' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать статус draft по умолчанию', () => {
    const result = CreateTenderSchema.parse({ title: 'Тест' });
    expect(result.status).toBe('draft');
  });

  it('должен отклонять пустое title', () => {
    const result = CreateTenderSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
