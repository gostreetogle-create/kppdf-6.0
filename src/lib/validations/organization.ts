import { z } from 'zod';

/**
 * Cycle 54 (B.2) — Organization Zod DiscriminatedUnion.
 *
 * Discriminator `type` drives validation rules for counterparty forms:
 *   - 'legal'        — ООО/ОАО/ЗАО/ПАО.  ИНН: 10 цифр REQUIRED. КПП: 9 цифр optional. ОГРН: 13 цифр optional.
 *   - 'entrepreneur' — ИП.                  ИНН: 12 цифр REQUIRED. ОГРН: 15 цифр optional. Без КПП.
 *   - 'individual'   — Физ.лицо (без ИП).  ИНН: 12 цифр OPTIONAL. Без КПП/ОГРН.
 *
 * Backward-compat для legacy clients: существующие Organization записи получают
 * type='legal' (default в schema.prisma). Миграция: ALTER TABLE ADD COLUMN ... DEFAULT 'legal'.
 *
 * Update flow использует flat schema с type-aware superRefine, чтобы клиенты могли
 * частично обновлять без обязательного перечисления всех полей.
 */

// ========================================
// Reusable building blocks
// ========================================

/** Цифры только, с проверкой длины. */
const InnDigits = (length: number, label: string) =>
  z
    .string()
    .regex(/^\d+$/, 'ИНН должен содержать только цифры')
    .length(length, `ИНН ${label} \u2014 ${length} цифр`);

/** Цифры только, фиксированная длина. */
const OptDigits = (length: number, label: string) =>
  z
    .string()
    .regex(/^\d+$/, `${label} должен содержать только цифры`)
    .length(length, `${label} \u2014 ${length} цифр`)
    .optional()
    .or(z.literal(''));

/** Общие (не зависящие от типа) поля — spread в каждую DU ветку. */
const CommonOrgFields = {
  shortName: z.string().max(200).optional().default(''),
  legalAddress: z.string().max(500).optional().default(''),
  postalAddress: z.string().max(500).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  email: z.string().email('Некорректный email').max(200).optional().or(z.literal('')).default(''),
  bankName: z.string().max(200).optional().default(''),
  bankBik: z.string().max(20).optional().default(''),
  bankAccount: z.string().max(50).optional().default(''),
  signerName: z.string().max(200).optional().default(''),
  signerPosition: z.string().max(200).optional().default(''),
  contactPerson: z.string().max(200).optional().default(''),
  paymentTermDays: z.number().int().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(20),
  isActive: z.boolean().default(true),
  contactPersonIds: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
};

// ========================================
// CREATE — Zod DiscriminatedUnion
// ========================================

/** DU ветка 1: Юр. лицо (ООО/ОАО/ЗАО/ПАО и аналоги). */
const LegalEntityCreateSchema = z.object({
  type: z.literal('legal'),
  name: z.string().min(1, 'Название организации обязательно').max(500),
  legalForm: z.string().max(50).optional().default(''),
  inn: InnDigits(10, 'юр. лица'),
  kpp: OptDigits(9, 'КПП'),
  ogrn: OptDigits(13, 'ОГРН'),
  ...CommonOrgFields,
});

/** DU ветка 2: Индивидуальный предприниматель (ИП). */
const EntrepreneurCreateSchema = z.object({
  type: z.literal('entrepreneur'),
  name: z.string().min(1, 'ФИО ИП обязательно').max(500),
  legalForm: z.string().max(50).optional().default('ИП'),
  inn: InnDigits(12, 'ИП'),
  ogrn: OptDigits(15, 'ОГРНИП'),
  // ИП не имеет КПП — поле присутствует в Organization model, но не валидируется здесь.
  // Если клиент пришлёт kpp — будет проигнорирован (нет в DU ветке).
  ...CommonOrgFields,
});

/** DU ветка 3: Физ. лицо (без ИП / без юр. статуса). */
const IndividualCreateSchema = z.object({
  type: z.literal('individual'),
  name: z.string().min(1, 'ФИО обязательно').max(500),
  legalForm: z.string().max(50).optional().default(''),
  inn: OptDigits(12, 'ИНН'),
  // Физ.лицо не имеет КПП и ОГРН.
  ...CommonOrgFields,
});

export const CreateOrganizationSchema = z.discriminatedUnion('type', [
  LegalEntityCreateSchema,
  EntrepreneurCreateSchema,
  IndividualCreateSchema,
]);

export type OrganizationType = z.infer<typeof CreateOrganizationSchema>['type'];
export type LegalEntityInput = z.infer<typeof LegalEntityCreateSchema>;
export type EntrepreneurInput = z.infer<typeof EntrepreneurCreateSchema>;
export type IndividualInput = z.infer<typeof IndividualCreateSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

// ========================================
// UPDATE — flat shape + type-aware refinement
// ========================================

/**
 * Update schema:
 * - Все поля optional (partial PUT semantics).
 * - `type` в payload НЕ меняется через этот endpoint (change-type — отдельный endpoint).
 *   Если клиент прислал `type` — он игнорируется (validateBody не упадёт).
 *   ИНН/КПП/ОГРН валидируются только если переданы, по длине.
 */
const UpdateBaseShape = {
  // Note: type intentionally NOT exposed here \u2014 changing counterparty type is
  // scheduled for a separate flow (rare operation). See ADR-004.
  name: z.string().min(1).max(500).optional(),
  shortName: z.string().max(200).optional(),
  legalForm: z.string().max(50).optional(),
  inn: z.string().optional(),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  legalAddress: z.string().max(500).optional(),
  postalAddress: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  bankName: z.string().max(200).optional(),
  bankBik: z.string().max(20).optional(),
  bankAccount: z.string().max(50).optional(),
  signerName: z.string().max(200).optional(),
  signerPosition: z.string().max(200).optional(),
  contactPerson: z.string().max(200).optional(),
  paymentTermDays: z.number().int().min(0).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  contactPersonIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
};

export const UpdateOrganizationSchema = z.object(UpdateBaseShape).superRefine((data, ctx) => {
  // ИНН: цифры + допустимая длина (10 для юр.лица default, 12 для остальных).
  // Не знаем текущий type из payload \u2014 используем type entity из БД (applyTypeAwareValidation
  // уровень route делает это). Здесь только базовый формат.
  if (data.inn && data.inn !== '') {
    if (!/^\d+$/.test(data.inn)) {
      ctx.addIssue({
        code: 'custom',
        message: 'ИНН должен содержать только цифры',
        path: ['inn'],
      });
    } else if (![10, 12].includes(data.inn.length)) {
      ctx.addIssue({
        code: 'custom',
        message: 'ИНН должен быть длиной 10 (юр.лицо) или 12 (ИП/физ.лицо) цифр',
        path: ['inn'],
      });
    }
  }
  // КПП: только 9 цифр, если передан и не пустой
  if (data.kpp && data.kpp !== '' && !/^\d{9}$/.test(data.kpp)) {
    ctx.addIssue({
      code: 'custom',
      message: '\u041a\u041f\u041f \u2014 9 \u0446\u0438\u0444\u0440',
      path: ['kpp'],
    });
  }
  // ОГРН: 13 цифр (юр.лицо) или 15 цифр (ИП)
  if (data.ogrn && data.ogrn !== '') {
    if (!/^\d+$/.test(data.ogrn)) {
      ctx.addIssue({
        code: 'custom',
        message: 'ОГРН должен содержать только цифры',
        path: ['ogrn'],
      });
    } else if (![13, 15].includes(data.ogrn.length)) {
      ctx.addIssue({
        code: 'custom',
        message: 'ОГРН должен быть длиной 13 (юр.лицо) или 15 (ИП) цифр',
        path: ['ogrn'],
      });
    }
  }
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// ========================================
// Exports for downstream code
// ========================================

/**
 * Cycle 54 actual implementation note (2026-06-21).
 * В исходной документации cycle 54 был помечен как ✅ DONE с commit 2e638fb, но
 * discriminator фактически не был внедрён в schema.prisma и Zod валидация
 * была flat (без DU). Текущий коммит воплощает intent spec:
 *   - Organization.type = 'legal' | 'entrepreneur' | 'individual' (default 'legal')
 *   - Zod discriminatedUnion('type', [...]) в CreateOrganizationSchema
 *   - type-aware flat schema + superRefine в UpdateOrganizationSchema
 *   - applyTypeAwareValidation helper для PUT route (DB type-aware refinement)
 */
export function applyTypeAwareValidation(
  parsed: UpdateOrganizationInput,
  dbType: OrganizationType,
  ctx: z.RefinementCtx,
): void {
  if (parsed.inn && parsed.inn !== '') {
    const expected = dbType === 'legal' ? 10 : 12;
    if (parsed.inn.length !== expected) {
      const label =
        dbType === 'legal' ? 'юр. лица' : dbType === 'entrepreneur' ? 'ИП' : 'физ. лица';
      ctx.addIssue({
        code: 'custom',
        message: `\u0418\u041d\u041d ${label} \u2014 ${expected} \u0446\u0438\u0444\u0440`,
        path: ['inn'],
      });
    }
  }
  // КПП только для юр.лиц
  if (parsed.kpp && parsed.kpp !== '' && dbType !== 'legal') {
    if (!/^\d{9}$/.test(parsed.kpp)) {
      ctx.addIssue({
        code: 'custom',
        message: '\u041a\u041f\u041f \u2014 9 \u0446\u0438\u0444\u0440 (только для юр. лиц)',
        path: ['kpp'],
      });
    }
  }
}
