-- Migration A: ContractItem priceSnapshot + nullable
-- Снапшот цены на момент создания Договора. NULL для рамочных договоров.

-- 1. Добавить колонку priceSnapshot
ALTER TABLE "ContractItem" ADD COLUMN "priceSnapshot" DOUBLE PRECISION;

-- 2. Backfill: unitPrice → priceSnapshot (если unitPrice ещё существует)
UPDATE "ContractItem"
SET "priceSnapshot" = "unitPrice"
WHERE "priceSnapshot" IS NULL AND "unitPrice" IS NOT NULL;

-- 3. Сделать quantity nullable (рамочный договор может не иметь quantity)
ALTER TABLE "ContractItem" ALTER COLUMN "quantity" DROP NOT NULL;

-- 4. Сделать unitPrice nullable (рамочный → NULL)
ALTER TABLE "ContractItem" ALTER COLUMN "unitPrice" DROP NOT NULL;

-- 5. Комментарий для документации
COMMENT ON COLUMN "ContractItem"."priceSnapshot" IS 'Снапшот цены на момент создания Договора. NULL для рамочных договоров.';
