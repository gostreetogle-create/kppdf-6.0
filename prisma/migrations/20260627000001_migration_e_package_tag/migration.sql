-- Migration E: add packageTag to Proposal/Contract/ProductionOrder
-- Виртуальная Картотека сделок через SQL WHERE packageTag = X

-- 1. Добавить колонку packageTag в 3 таблицы
ALTER TABLE "Proposal" ADD COLUMN "packageTag" TEXT;
ALTER TABLE "Contract" ADD COLUMN "packageTag" TEXT;
ALTER TABLE "ProductionOrder" ADD COLUMN "packageTag" TEXT;

-- 2. Создать индексы
CREATE INDEX "Proposal_packageTag_idx" ON "Proposal" ("packageTag");
CREATE INDEX "Contract_packageTag_idx" ON "Contract" ("packageTag");
CREATE INDEX "ProductionOrder_packageTag_idx" ON "ProductionOrder" ("packageTag");
