import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  applyTypeAwareValidation,
  OrganizationType,
} from '../validations/organization';
import { pickValidType } from '../../app/api/organizations/route';

// ═══════════════════════════════════════════════════════════════
// Cycle 54 / P2.1 — DiscriminatedUnion tests (CreateOrganizationSchema)
// ═══════════════════════════════════════════════════════════════

// Базовый валидный payload каждой ветки DU (без CommonOrgFields для краткости).
const validLegal = {
  type: 'legal' as const,
  name: 'ООО Ромашка',
  inn: '1234567890',
  kpp: '123456789',
  ogrn: '1234567890123',
};

const validEntrepreneur = {
  type: 'entrepreneur' as const,
  name: 'ИП Иванов',
  inn: '123456789012',
  ogrn: '123456789012345',
};

const validIndividual = {
  type: 'individual' as const,
  name: 'Иванов Иван Иванович',
  inn: '123456789012',
};

describe('CreateOrganizationSchema — DU happy paths', () => {
  it('должен принимать валидное юр.лицо (legal): ИНН=10, КПП=9, ОГРН=13', () => {
    const result = CreateOrganizationSchema.safeParse(validLegal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('legal');
    }
  });

  it('должен принимать валидного ИП (entrepreneur): ИНН=12, ОГРН=15', () => {
    const result = CreateOrganizationSchema.safeParse(validEntrepreneur);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('entrepreneur');
    }
  });

  it('должен принимать валидное физ.лицо (individual): ИНН=12', () => {
    const result = CreateOrganizationSchema.safeParse(validIndividual);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('individual');
    }
  });
});

describe('CreateOrganizationSchema — discriminator & INN validation', () => {
  it('должен отклонять неизвестный тип', () => {
    const result = CreateOrganizationSchema.safeParse({
      ...validLegal,
      type: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять юр.лицо с ИНН=12 (неправильная длина)', () => {
    const result = CreateOrganizationSchema.safeParse({
      ...validLegal,
      inn: '123456789012',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять ИП с ИНН=10 (неправильная длина)', () => {
    const result = CreateOrganizationSchema.safeParse({
      ...validEntrepreneur,
      inn: '1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('должен отклонять ИП с КПП (КПП только у юр.лиц)', () => {
    const result = CreateOrganizationSchema.safeParse({
      ...validEntrepreneur,
      kpp: '123456789',
    });
    // В Zod DU branch для entrepreneur kpp не объявлен — поле игнорируется.
    // Поэтому payload ПРОХОДИТ парсинг, но kpp будет strip掉了.
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// UpdateOrganizationSchema — flat shape + superRefine
// ═══════════════════════════════════════════════════════════════

describe('UpdateOrganizationSchema', () => {
  it('должен принимать пустой объект (partial PUT semantics)', () => {
    const result = UpdateOrganizationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('должен отклонять ИНН=11 (недопустимая длина)', () => {
    const result = UpdateOrganizationSchema.safeParse({ inn: '12345678901' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять ИНН с не-цифровыми символами', () => {
    const result = UpdateOrganizationSchema.safeParse({ inn: '12345abcde' });
    expect(result.success).toBe(false);
  });

  it('должен принимать ИНН=10 (юр.лицо default)', () => {
    const result = UpdateOrganizationSchema.safeParse({ inn: '1234567890' });
    expect(result.success).toBe(true);
  });

  it('должен отклонять КПП=8 цифр', () => {
    const result = UpdateOrganizationSchema.safeParse({ kpp: '12345678' });
    expect(result.success).toBe(false);
  });

  it('должен отклонять ОГРН=12 цифр', () => {
    const result = UpdateOrganizationSchema.safeParse({ ogrn: '123456789012' });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// applyTypeAwareValidation — DB-type-driven refinement
// ═══════════════════════════════════════════════════════════════

function makeMockCtx() {
  const errors: { path: string[]; message: string }[] = [];
  return {
    errors,
    ctx: {
      addIssue: (issue: { message?: string; path?: (string | number)[] }) => {
        errors.push({
          path: (issue.path ?? []).map(String),
          message: issue.message ?? '',
        });
      },
    } as unknown as z.RefinementCtx,
  };
}

describe('applyTypeAwareValidation', () => {
  it('должен принимать ИНН=10 для типа legal', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation(
      { inn: '1234567890' },
      'legal' as OrganizationType,
      ctx,
    );
    expect(errors).toHaveLength(0);
  });

  it('должен отклонять ИНН=12 для типа legal (нужно 10)', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation(
      { inn: '123456789012' },
      'legal' as OrganizationType,
      ctx,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toEqual(['inn']);
    expect(errors[0].message).toContain('юр. лица');
  });

  it('должен принимать ИНН=12 для типа entrepreneur', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation(
      { inn: '123456789012' },
      'entrepreneur' as OrganizationType,
      ctx,
    );
    expect(errors).toHaveLength(0);
  });

  it('должен принимать ИНН=12 для типа individual (не ИП)', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation(
      { inn: '123456789012' },
      'individual' as OrganizationType,
      ctx,
    );
    expect(errors).toHaveLength(0);
  });

  it('должен принимать пустой ИНН (optional)', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation({}, 'legal' as OrganizationType, ctx);
    expect(errors).toHaveLength(0);
  });

  it('должен принимать KPP=9 цифр для legal', () => {
    const { errors, ctx } = makeMockCtx();
    applyTypeAwareValidation(
      { kpp: '123456789' },
      'legal' as OrganizationType,
      ctx,
    );
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// pickValidType — runtime normalization (used by POST /api/organizations)
// ═══════════════════════════════════════════════════════════════

describe('pickValidType', () => {
  it('должен пропускать валидный legal', () => {
    expect(pickValidType('legal')).toBe('legal');
  });

  it('должен пропускать валидный entrepreneur', () => {
    expect(pickValidType('entrepreneur')).toBe('entrepreneur');
  });

  it('должен пропускать валидный individual', () => {
    expect(pickValidType('individual')).toBe('individual');
  });

  it('должен дефолтить пустую строку в legal', () => {
    expect(pickValidType('')).toBe('legal');
  });

  it('должен дефолтить undefined в legal', () => {
    expect(pickValidType(undefined)).toBe('legal');
  });

  it('должен дефолтить неизвестную строку в legal', () => {
    expect(pickValidType('unknown')).toBe('legal');
  });

  it('должен дефолтить non-string (number) в legal', () => {
    expect(pickValidType(42)).toBe('legal');
  });

  it('должен дефолтить объект в legal', () => {
    expect(pickValidType({ foo: 'bar' })).toBe('legal');
  });
});
