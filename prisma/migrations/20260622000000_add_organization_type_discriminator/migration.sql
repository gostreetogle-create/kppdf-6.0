-- Migration: Cycle 54 (B.2) — add Organization.type discriminator.
--
-- Добавляет поле type ('legal' | 'entrepreneur' | 'individual') в Organization
-- table для Zod DU валидации в src/lib/validations/organization.ts.
-- Default 'legal' для backward-compat: все существующие записи автоматически
-- получают type='legal' (т.к. имеют ИНН/КПП/ОГРН).
-- Index на type для быстрого фильтра (clients UI, отчёты по контрагентам).

-- 1. Add column with default for existing rows
ALTER TABLE "Organization"
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'legal';

-- 2. Add index for type-based queries
CREATE INDEX "Organization_type_idx"
  ON "Organization"("type");

-- 3. Optional safety: constrain values to known set (commented — could enable in future migration)
-- ALTER TABLE "Organization"
--   ADD CONSTRAINT "Organization_type_check"
--   CHECK ("type" IN ('legal', 'entrepreneur', 'individual'));
