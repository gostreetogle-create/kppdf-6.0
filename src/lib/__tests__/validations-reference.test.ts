import { describe, it, expect } from 'vitest';
import { CreateCertificateSchema, UpdateCertificateSchema } from '../validations/certificate';
import { CreateRppEntrySchema, UpdateRppEntrySchema } from '../validations/rpp-entry';
import { CreateWorkerSchema, UpdateWorkerSchema } from '../validations/worker';
import { CreateWorkTypeSchema, UpdateWorkTypeSchema } from '../validations/work-type';
import { CreateWorkCenterSchema, UpdateWorkCenterSchema } from '../validations/work-center';
import { CreateStorageItemSchema, UpdateStorageItemSchema } from '../validations/storage-item';

// ═══════════════════════════════════════════════════════════════
// Certificate
// ═══════════════════════════════════════════════════════════════

describe('CreateCertificateSchema', () => {
  it('должен требовать title', () => {
    const result = CreateCertificateSchema.safeParse({ number: 'CERT-1' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateCertificateSchema.safeParse({ title: 'Сертификат ISO' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать status=active по умолчанию', () => {
    const result = CreateCertificateSchema.parse({ title: 'Сертификат' });
    expect(result.status).toBe('active');
  });

  it('должен принимать все статусы', () => {
    for (const status of ['active', 'expired', 'revoked']) {
      const result = CreateCertificateSchema.safeParse({ title: 'Сертификат', status });
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный статус', () => {
    const result = CreateCertificateSchema.safeParse({ title: 'Сертификат', status: 'pending' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCertificateSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateCertificateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// RppEntry
// ═══════════════════════════════════════════════════════════════

describe('CreateRppEntrySchema', () => {
  it('должен требовать title', () => {
    const result = CreateRppEntrySchema.safeParse({ number: 'РПП-1' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateRppEntrySchema.safeParse({ title: 'РПП запись' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать status=draft по умолчанию', () => {
    const result = CreateRppEntrySchema.parse({ title: 'РПП' });
    expect(result.status).toBe('draft');
  });

  it('должен отклонять title длиннее 500', () => {
    const result = CreateRppEntrySchema.safeParse({ title: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateRppEntrySchema', () => {
  it('должен быть partial', () => {
    const result = UpdateRppEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Worker
// ═══════════════════════════════════════════════════════════════

describe('CreateWorkerSchema', () => {
  it('должен требовать firstName и lastName', () => {
    const result = CreateWorkerSchema.safeParse({ firstName: 'Иван' });
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateWorkerSchema.safeParse({ firstName: 'Иван', lastName: 'Петров' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать role=worker по умолчанию', () => {
    const result = CreateWorkerSchema.parse({ firstName: 'И', lastName: 'П' });
    expect(result.role).toBe('worker');
  });

  it('должен устанавливать isActive=true по умолчанию', () => {
    const result = CreateWorkerSchema.parse({ firstName: 'И', lastName: 'П' });
    expect(result.isActive).toBe(true);
  });
});

describe('UpdateWorkerSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateWorkerSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// WorkType
// ═══════════════════════════════════════════════════════════════

describe('CreateWorkTypeSchema', () => {
  it('должен требовать name', () => {
    const result = CreateWorkTypeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateWorkTypeSchema.safeParse({ name: 'Сварка' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать hourlyRate=0 по умолчанию', () => {
    const result = CreateWorkTypeSchema.parse({ name: 'Сварка' });
    expect(result.hourlyRate).toBe(0);
  });

  it('должен устанавливать isActive=true по умолчанию', () => {
    const result = CreateWorkTypeSchema.parse({ name: 'Сварка' });
    expect(result.isActive).toBe(true);
  });

  it('должен отклонять отрицательный hourlyRate', () => {
    const result = CreateWorkTypeSchema.safeParse({ name: 'Сварка', hourlyRate: -500 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateWorkTypeSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateWorkTypeSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// WorkCenter
// ═══════════════════════════════════════════════════════════════

describe('CreateWorkCenterSchema', () => {
  it('должен требовать name', () => {
    const result = CreateWorkCenterSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateWorkCenterSchema.safeParse({ name: 'Сварочный цех' });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать capacity=1 по умолчанию', () => {
    const result = CreateWorkCenterSchema.parse({ name: 'Цех' });
    expect(result.capacity).toBe(1);
  });

  it('должен отклонять capacity=0', () => {
    const result = CreateWorkCenterSchema.safeParse({ name: 'Цех', capacity: 0 });
    expect(result.success).toBe(false);
  });

  it('должен отклонять не целой capacity', () => {
    const result = CreateWorkCenterSchema.safeParse({ name: 'Цех', capacity: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateWorkCenterSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateWorkCenterSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// StorageItem
// ═══════════════════════════════════════════════════════════════

describe('CreateStorageItemSchema', () => {
  it('должен требовать warehouseId', () => {
    const result = CreateStorageItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('должен пропускать валидный объект', () => {
    const result = CreateStorageItemSchema.safeParse({
      warehouseId: 'clxyz1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('должен устанавливать quantity=0 по умолчанию', () => {
    const result = CreateStorageItemSchema.parse({ warehouseId: 'clxyz1234567890' });
    expect(result.quantity).toBe(0);
  });

  it('должен устанавливать reservedQty=0 по умолчанию', () => {
    const result = CreateStorageItemSchema.parse({ warehouseId: 'clxyz1234567890' });
    expect(result.reservedQty).toBe(0);
  });

  it('должен устанавливать minQuantity=0 по умолчанию', () => {
    const result = CreateStorageItemSchema.parse({ warehouseId: 'clxyz1234567890' });
    expect(result.minQuantity).toBe(0);
  });

  it('должен отклонять отрицательный quantity', () => {
    const result = CreateStorageItemSchema.safeParse({
      warehouseId: 'clxyz1234567890',
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять не целой quantity', () => {
    const result = CreateStorageItemSchema.safeParse({
      warehouseId: 'clxyz1234567890',
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateStorageItemSchema', () => {
  it('должен быть partial', () => {
    const result = UpdateStorageItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
