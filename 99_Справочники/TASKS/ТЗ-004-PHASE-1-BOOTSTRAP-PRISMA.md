# ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md — Phase 1 Bootstrap миграций Prisma из kppdf-5.0

> **Тип документа:** Техническое задание (ТЗ) для параллельного ИИ-агента.
> **ID задачи:** ТЗ-004.
> **Приоритет:** 🔴 P0 (блокер для Phase 2 Mantine UI + RBAC-middleware).
> **Статус:** ✅ Готово к запуску (2026-06-27).
> **Автор ТЗ:** Буфер (стратег-ассистент) — главный Архистратор.
> **Заказчик:** параллельный ИИ-агент с ролью **Бизнес-аналитик / DevOps hybrid**.
> **Методология:** [`AGENT-METHOD.md`](../../AGENT-METHOD.md) §2 «Полное погружение» + §5.4 (4 UX-принципа — для README) + §5.6 (Pre-action / Post-action обязательно).
> **Пререквизиты:**
> - ✅ Стек согласован: Next.js 16 + React 19 + Mantine + Tailwind 4 + Prisma 7 + PostgreSQL 16 + Zustand + TanStack Query + react-hook-form + Zod + sharp + pnpm + Husky.
> - ✅ Baseline source: репозиторий `kppdf-5.0` (47 моделей Prisma, 89 API endpoints, 88 Vitest unit-тестов).
> - 🟡 **Рекомендуется дождаться** ТЗ-001 (REGISTRY-OF-RULES) для верификации правил → CI-тестов. Не блокер: можно начать Phase 1 Bootstrap уже сейчас и интегрировать правила позже в Phase 2.
> - 🟡 **Желательно дождаться** ТЗ-002 (Run 1/5 Аналитика КП — 3 STUB с правилами RBAC + biznes + state-машина) для verify соответствия типам. Не блокер.

---

## 0. Контекст

### 0.1 Что такое Phase 1 Bootstrap

Phase 1 Bootstrap = первый этап **записи кода** для KPPDF CRM v6. До этого момента проект существовал только как **теоретическая документация** (19 .md файлов, 32 сущности в схеме, 38 согласованных Q, 15 закрытых СПОР).

Phase 1 Bootstrap имеет 5 шагов:

| # | Шаг | Цель |
|---|---|---|
| 1 | Создать репозиторий `kppdf-6.0` | Изолированный v6 fork |
| 2 | Скопировать baseline из `kppdf-5.0` | 47 моделей, 89 API, 88 тестов |
| 3 | **Применить 3 schema-миграции** | Правки A, E, F из МОДУЛЬ-дока |
| 4 | **Установить новые пакеты** | TanStack Query, RHF, sharp, pnpm, Husky |
| 5 | **Verify baseline** | 88 тестов не сломаны; tsc / eslint / vitest passing |

Phase 2 = написание нового кода для модуля КП (Mantine UI + RBAC-middleware + Zod). Начинается после Phase 1 Bootstrap ✅.

### 0.2 Что в этом ТЗ, чего нет

В этом ТЗ: **Phase 1 Bootstrap (шаги 1-5)** = код, конфиги, миграции, packages, Husky setup.
**НЕ в этом ТЗ:** Phase 2 (модуль КП Mantine UI) — отдельное ТЗ после Phase 1.
**НЕ в этом ТЗ:** REGISTRY-OF-RULES (ТЗ-001 параллельно), Run 1/5 STUB (ТЗ-002 параллельно), LAUNCH-UX (ТЗ-003 параллельно).

### 0.3 Кто работает по этому ТЗ

**Агент** — параллельный ИИ с ролью **DevOps / Бизнес-аналитик hybrid** (новый профиль, не существовал в `LAUNCH-*.md`). Задача требует:
- **DevOps работу**: clone / install / migration / Husky / git operations.
- **Бизнес-аналитику работу**: понимание правок A, E, F (бизнес-логика рамочных договоров, Картотеки сделок).

---

## 1. Миссия

> **Одной фразой:** Создать репозиторий `kppdf-6.0` с baseline из v5 + применить 3 schema-миграции (правки A, E, F из МОДУЛЬ-дока) + установить новые пакеты (TanStack Query, react-hook-form, sharp, pnpm, Husky) + настроить pre-commit gates + убедиться что **baseline 88 тестов проходит** без изменений.

**Декомпозиция (5 шагов):**

1. **Подготовка**: клонировать kppdf-5.0 в локальную папку `kppdf-6.0`, переименовать в package.json (name "kppdf-6.0"), установить pnpm.
2. **Migration A (ContractItem снапшот + nullable)**: добавить `priceSnapshot: Decimal?`, убрать `price: Decimal` (или оставить с nullable). Сделать цены **снапшотом на момент конвертации**, чтобы ретро-правки справочника Product не сломали историю.
3. **Migration E (delete DocPackage + add packageTag)**: удалить сущность `DocPackage`, убрать FK `coveredByPackageId` с Proposal/Contract/ProductionOrder, заменить на `packageTag: String?` (indexed).
4. **Migration F (new Comment entity)**: создать `Comment { id, packageTag, authorId, text, createdAt, isArchived }` для истории комментариев Картотеки сделок.
5. **Установка новых пакетов** + **Husky setup** + **Verify baseline** (88 тестов проходят).

---

## 2. Scope IN/OUT

### 2.1 IN — Агент делает

| # | Действие | Где |
|---|---|---|
| 1 | Создать репозиторий `kppdf-6.0` | локально + remote (GitHub) |
| 2 | Clone baseline из `kppdf-5.0` | `git clone git@github.com:kppdf/kppdf-5.0.git kppdf-6.0` (или локальный путь если v5 рядом) |
| 3 | Переименовать package.json → name: `kppdf-6.0` | `package.json` |
| 4 | Установить pnpm | `npm install -g pnpm@9.x` |
| 5 | Применить Migration A (ContractItem снапшот + nullable) | `prisma/migrations/00X_migration_a_price_snapshot/` |
| 6 | Применить Migration E (delete DocPackage + add packageTag) | `prisma/migrations/00X_migration_e_delete_docpackage/` |
| 7 | Применить Migration F (new Comment entity) | `prisma/migrations/00X_migration_f_add_comment/` |
| 8 | Установить production packages | `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `sharp` |
| 9 | Установить dev packages | `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional` |
| 10 | Настроить Husky pre-commit | `.husky/pre-commit` (запуск `tsc --noEmit && eslint && prettier --check`) |
| 11 | Настроить Husky commit-msg | `.husky/commit-msg` (commitlint) |
| 12 | Обновить README.md | отразить стек v6 |
| 13 | Создать `01-LOG.md` | audit trail работы |
| 14 | Создать `02-REPORT.md` | финальный отчёт |
| 15 | Verify baseline | `pnpm tsc --noEmit` + `pnpm vitest run` + `pnpm eslint src` — все 0 ошибок, 88/88 тестов |

### 2.2 OUT — Агент НЕ делает

| # | Что НЕ делает | Почему |
|---|---|---|
| 1 | Не пишет новый UI/React код | Phase 2 Mantine — отдельное ТЗ. |
| 2 | Не редактирует `99_Справочники/*.md` (теория) | Это docs, не код. Текущая сессия docs-only. |
| 3 | Не применяет правку B (workflow rule запрета PAID→Договор) | Это **API Route logic** + Zod validator, не schema migration. Применяется в Phase 2. |
| 4 | Не создаёт новых бизнес-правил | Только миграции по согласованным правкам A/E/F. |
| 5 | Не удаляет v5 baseline | v5引き続き нужен как reference — не трогаем. |
| 6 | Не merge PR (если работа в git branch) | После verify baseline — остановить, PO ревьюит. |
| 7 | Не повышает major версию npm пакетов в baseline | Только добавляем НОВЫЕ пакеты. |

---

## 3. Deliverables — что Агент создаёт

### 3.1 Code artifacts (repo `kppdf-6.0`)

| # | Файл / папка | Назначение |
|---|---|---|
| 1 | `package.json` (изменён) | name: "kppdf-6.0" + новые dependencies |
| 2 | `package.json` scripts | добавить `prepare: "husky"` |
| 3 | `pnpm-lock.yaml` (новый) | вместо `package-lock.json` |
| 4 | `prisma/schema.prisma` (изменён) | обновить 47 моделей + новые поля + удалить DocPackage |
| 5 | `prisma/migrations/00X_migration_a_price_snapshot/migration.sql` | migration A: ContractItem priceSnapshot nullable |
| 6 | `prisma/migrations/00X_migration_e_delete_docpackage/migration.sql` | migration E: drop DocPackage + add packageTag |
| 7 | `prisma/migrations/00X_migration_f_add_comment/migration.sql` | migration F: new Comment table |
| 8 | `prisma/migrations/migration_lock.toml` (новый) | файл блокировки версии Prisma |
| 9 | `.husky/pre-commit` (новый) | tsc + eslint + prettier --check |
| 10 | `.husky/commit-msg` (новый) | commitlint |
| 11 | `.lintstagedrc.json` (новый) | lint-staged конфиг |
| 12 | `commitlint.config.js` (новый) | conventional commits |
| 13 | `README.md` (изменён) | отражает стек v6 (Next.js 16, Mantine, RHF, sharp, pnpm, Husky) |

### 3.2 Audit / report artifacts (в `99_Справочники/TASKS/`)

| # | Файл | Назначение |
|---|---|---|
| 14 | `99_Справочники/TASKS/04-01-LOG.md` | хронология работы Агента |
| 15 | `99_Справочники/TASKS/04-02-REPORT.md` | финальный отчёт для PO |

### 3.3 Hard limits

| Файл | Hard limit | Что делать при превышении |
|---|---|---|
| `prisma/schema.prisma` | без лимита (генерируется) | — |
| Migration `.sql` файлы | 200 строк каждый | разбить logic между ними |
| `04-02-REPORT.md` | 300 строк | сократить таблицы |
| `README.md` | 100 строк | разделить на короткий README + ARCHITECTURE.md |

---

## 4. Inputs — что Агент обязан прочитать

| # | Файл | Зачем |
|---|---|---|
| 1 | [`CHECKLIST.md`](../../CHECKLIST.md) | master-навигатор, особенно §12 «Заметки Архистратора» |
| 2 | [`AGENT-METHOD.md`](../../AGENT-METHOD.md) §2 + §5.6 | метод + обязательный Pre-action/Post-action паттерн |
| 3 | [`99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md`](../СТЕК-ПРЕДПИСАНИЕ.md) | §1 Phase C «Bootstrap», §4 «Итоговые предложения стеков», §5 «Новый стек» — точные версии пакетов |
| 4 | [`99_Справочники/МАСТЕР-АУДИТ-V6.md`](../МАСТЕР-АУДИТ-V6.md) | сводный аудит baseline |
| 5 | [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../SCHEMA-CONSOLIDATED.md) | текущая согласованная схема v6 (32 сущности, 22 enum) — TARGET после миграций |
| 6 | [`99_СПОРНЫЕ-МОМЕНТЫ.md`](../СПОРНЫЕ-МОМЕНТЫ.md) | 15 закрытых СПОР (особенно СПОР-5 «PA→Договор запрещён», СПОР-13 «packageTag = виртуальная Картотека») |
| 7 | `01_КП/00-spr/00-otkrytye-voprosy.md` | 5 baseline OQ КП (PSL-001) |
| 8 | git history: `01_КП/МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md` (распущен PSL-004) | §5 «Снапшот цен», §9 «packageTag виртуальная Картотека», §9 «История комментариев» — формулировки правок A, E, F |

### 4.1 Параллельные ТЗ (НЕ читать, но cross-ref если готовы)

- [`ТЗ-001`](ТЗ-001-КАТАЛОГ-ПРАВИЛ.md) — REGISTRY-OF-RULES — список всех правил. Если готов → использовать как audit для проверки migrations не нарушают правила.
- [`ТЗ-002`](ТЗ-002-RUN-1-5-АНАЛИТИК-КП.md) — Run 1/5 Аналитика КП — STUB с правилами. Если готов → ссылка полезна для RBAC test fixes в Phase 2.
- [`ТЗ-003`](ТЗ-003-LAUNCH-UX-KARKAS-KIT.md) — Karkas-Kit UI спецификация. Если готова → использовать для ARCHITECTURE.md ссылок.

### 4.2 Внешние ресурсы

| Ресурс | Зачем |
|---|---|
| Репозиторий `kppdf-5.0` (git clone) | baseline файлов: src/, prisma/, tests/ — 47 моделей, 89 API, 88 Vitest unit-тестов |
| Документация Prisma 7 | schema.prisma syntax, migration commands |
| Документация TanStack Query v5 | "+ react-query" hook patterns (Phase 2, но установить сейчас) |
| Документация react-hook-form | базовая структура (Phase 2, но установить сейчас) |

---

## 5. Подготовительные работы (Setup)

### 5.1 Алгоритм клонирования

```bash
# Шаг 1: создать новую папку рядом с текущим проектом docs
cd /path/to/kppdf-5.0
git clone . /path/to/kppdf-6.0
cd /path/to/kppdf-6.0

# Шаг 2: очистить git config от v5
git remote set-url origin git@github.com:kppdf/kppdf-6.0.git
git remote add upstream git@github.com:kppdf/kppdf-5.0.git  # на случай backport багфиксов

# Шаг 3: переименовать в package.json
sed -i 's/"name": "kppdf-5.0"/"name": "kppdf-6.0"/g' package.json

# Шаг 4: создать новую ветку для Phase 1
git checkout -b phase-1-bootstrap

# Шаг 5: установить pnpm
npm install -g pnpm@9

# Шаг 6: установить существующие зависимости (cnpm → pnpm translation)
pnpm install

# Шаг 7: verify baseline ДО миграций
pnpm tsc --noEmit  # должно быть 0 ошибок
pnpm vitest run      # 88/88 passes
pnpm eslint src      # 0 ошибок
```

### 5.2 Setup log (в `04-01-LOG.md`)

```markdown
## YYYY-MM-DD HH:MM — Initial setup complete

| Поле | Значение |
|---|---|
| Действие | Clone + rename + pnpm install |
| Команды | git clone, npm install -g pnpm, pnpm install |
| Verify | tsc ✅ / vitest 88/88 ✅ / eslint 0 ✅ |
| Прогресс | 20% |
```

---

## 6. Migration A: ContractItem снапшот цен + nullable (правка A из МОДУЛЬ-дока)

### 6.1 Бизнес-логика правки

`ContractItem` (позиция Договора) должен хранить **снапшот цены** на момент создания Договора, чтобы ретро-правки в справочнике `Product.basePrice` не сломали исторические Договоры. Для **рамочных договоров** (без конкретных сумм) — `priceSnapshot = NULL`.

### 6.2 Prisma schema — BEFORE (из baseline v5)

```prisma
model ContractItem {
  id        Int       @id @default(autoincrement())
  contractId Int
  contract  Contract  @relation(fields: [contractId], references: [id], onDelete: Cascade)
  productId Int
  product   Product   @relation(fields: [productId], references: [id])
  quantity  Decimal   @db.Decimal(18, 3)
  price     Decimal   @db.Decimal(18, 2)
  // ...
  @@index([contractId])
}
```

### 6.3 Prisma schema — AFTER (миграция A)

```prisma
model ContractItem {
  id            Int       @id @default(autoincrement())
  contractId    Int
  contract      Contract  @relation(fields: [contractId], references: [id], onDelete: Cascade)
  productId     Int
  product       Product   @relation(fields: [productId], references: [id])
  quantity      Decimal?  @db.Decimal(18, 3)   // nullable для рамочных
  priceSnapshot Decimal?  @db.Decimal(18, 2)   // ✅ НОВОЕ ПОЛЕ: снапшот цены на момент конвертации; nullable для рамочных
  // УДАЛЕНО: price (теперь только priceSnapshot)
  @@index([contractId])
}
```

### 6.4 SQL миграция (генерируется автоматически через `prisma migrate dev`)

```sql
-- Migration A: ContractItem priceSnapshot + nullable

-- 1. Добавить колонку priceSnapshot
ALTER TABLE "ContractItem" 
  ADD COLUMN "priceSnapshot" DECIMAL(18, 2);

-- 2. Backfill: price (если ещё существует) → priceSnapshot
UPDATE "ContractItem" 
  SET "priceSnapshot" = "price" 
  WHERE "priceSnapshot" IS NULL AND "price" IS NOT NULL;

-- 3. Сделать quantity nullable (рамочный договор может не иметь quantity)
ALTER TABLE "ContractItem" 
  ALTER COLUMN "quantity" DROP NOT NULL;

-- 4. Сделать priceSnapshot nullable (рамочный → NULL)
ALTER TABLE "ContractItem" 
  ALTER COLUMN "priceSnapshot" DROP NOT NULL;

-- 5. Удалить старую колонку price (после backfill)
ALTER TABLE "ContractItem" 
  DROP COLUMN "price";

-- 6. Добавить комментарий для документации
COMMENT ON COLUMN "ContractItem"."priceSnapshot" IS 'Снапшот цены на момент создания Договора. NULL для рамочных договоров.';
```

### 6.5 Где правило в REGISTRY (если ТЗ-001 готов)

После миграции в `REGISTRY-OF-RULES.md`:
- §3 Validation Rules: добавить `INV-КП-CONV-002 «Конвертация создаёт контракт со снапшотом цен (ContractItem.priceSnapshot)»`.
- §5 Cross-Module Triggers: связка с TRI-002.

---

## 7. Migration E: удаление DocPackage + добавление packageTag (правка E из МОДУЛЬ-дока)

### 7.1 Бизнес-логика правки

`DocPackage` (Картотека сделки как отдельная сущность) **избыточен** — это просто виртуальная группировка документов по строковому тегу. Удаляем сущность, добавляем `packageTag: String?` (indexed) на Proposal/Contract/ProductionOrder. Виртуальная Картотека реализуется через SQL `WHERE packageTag = X`.

### 7.2 Prisma schema — изменения

```prisma
// УДАЛЕНО: model DocPackage { ... }

// ИЗМЕНЕНО: Proposal
model Proposal {
  // ... существующие поля ...
  // УДАЛЕНО: coveredByPackageId Int?
  // УДАЛЕНО: coveredByPackage   DocPackage? @relation(...)
  packageTag  String?  // ✅ НОВОЕ ПОЛЕ
  @@index([packageTag])
}

// ИЗМЕНЕНО: Contract
model Contract {
  // ... существующие поля ...
  // УДАЛЕНО: coveredByPackageId Int?
  // УДАЛЕНО: coveredByPackage   DocPackage? @relation(...)
  packageTag  String?  // ✅ НОВОЕ ПОЛЕ
  @@index([packageTag])
}

// ИЗМЕНЕНО: ProductionOrder
model ProductionOrder {
  // ... существующие поля ...
  // УДАЛЕНО: coveredByPackageId Int?
  // УДАЛENО: coveredByPackage   DocPackage? @relation(...)
  packageTag  String?  // ✅ НОВОЕ ПОЛЕ
  @@index([packageTag])
}
```

### 7.3 SQL миграция

```sql
-- Migration E: delete DocPackage + add packageTag to Proposal/Contract/ProductionOrder

-- 1. Добавить колонку packageTag в 3 таблицы
ALTER TABLE "Proposal" ADD COLUMN "packageTag" TEXT;
ALTER TABLE "Contract" ADD COLUMN "packageTag" TEXT;
ALTER TABLE "ProductionOrder" ADD COLUMN "packageTag" TEXT;

-- 2. Backfill из существующего DocPackage (если есть данные)
UPDATE "Proposal" p
SET "packageTag" = dp.label
FROM "DocPackage" dp
WHERE p."coveredByPackageId" = dp.id;

UPDATE "Contract" c
SET "packageTag" = dp.label
FROM "DocPackage" dp
WHERE c."coveredByPackageId" = dp.id;

UPDATE "ProductionOrder" po
SET "packageTag" = dp.label
FROM "DocPackage" dp
WHERE po."coveredByPackageId" = dp.id;

-- 3. Добавить индексы
CREATE INDEX "Proposal_packageTag_idx" ON "Proposal" ("packageTag");
CREATE INDEX "Contract_packageTag_idx" ON "Contract" ("packageTag");
CREATE INDEX "ProductionOrder_packageTag_idx" ON "ProductionOrder" ("packageTag");

-- 4. Удалить старые FK
ALTER TABLE "Proposal" DROP CONSTRAINT IF EXISTS "Proposal_coveredByPackageId_fkey";
ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_coveredByPackageId_fkey";
ALTER TABLE "ProductionOrder" DROP CONSTRAINT IF EXISTS "ProductionOrder_coveredByPackageId_fkey";

-- 5. Удалить старые колонки
ALTER TABLE "Proposal" DROP COLUMN "coveredByPackageId";
ALTER TABLE "Contract" DROP COLUMN "coveredByPackageId";
ALTER TABLE "ProductionOrder" DROP COLUMN "coveredByPackageId";

-- 6. Удалить саму таблицу DocPackage
DROP TABLE IF EXISTS "DocPackage";
```

### 7.4 Side-effects — что ещё нужно обновить в коде

- Удалить импорты `DocPackage` из всех src/ файлов.
- Удалить API endpoints связанные с DocPackage.
- Обновить типы TypeScript.

---

## 8. Migration F: новая сущность Comment (правка F из МОДУЛЬ-дока)

### 8.1 Бизнес-логика правки

История комментариев **Картотеки сделок** = новая сущность `Comment` для каждой заметки по сделке. Связана с `packageTag` (виртуальная Картотека), не с конкретной сущностью (КП / Договор / ЗК). RBAC: только admin + director читают/пишут (см. RBAC-MATRIX §3.2).

### 8.2 Prisma schema — НОВАЯ сущность

```prisma
model Comment {
  id          Int       @id @default(autoincrement())
  packageTag  String                          // индекс для быстрого find по Картотеке
  authorId    Int                             // FK на User
  author      User      @relation(fields: [authorId], references: [id], onDelete: Restrict)
  text        String    @db.Text
  createdAt   DateTime  @default(now())
  isArchived  Boolean   @default(false)       // soft-delete
  @@index([packageTag])
  @@index([authorId])
  @@index([createdAt])
}
```

### 8.3 SQL миграция

```sql
-- Migration F: add Comment table

CREATE TABLE "Comment" (
  "id"          SERIAL PRIMARY KEY,
  "packageTag"  TEXT NOT NULL,
  "authorId"    INTEGER NOT NULL,
  "text"        TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isArchived"  BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT "Comment_authorId_fkey" 
    FOREIGN KEY ("authorId") REFERENCES "User"("id") 
    ON DELETE RESTRICT
);

CREATE INDEX "Comment_packageTag_idx" ON "Comment" ("packageTag");
CREATE INDEX "Comment_authorId_idx" ON "Comment" ("authorId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment" ("createdAt");
```

### 8.4 Side-effects — что добавить в коде

- Добавить `Comment` в `@prisma/client` (через `prisma generate` после migration).
- Создать API endpoints в Phase 2:
  - `GET /api/comments?packageTag=X` — список комментариев Картотеки.
  - `POST /api/comments` — добавить комментарий (admin/director only).
  - `PATCH /api/comments/{id}/archive` — архивировать.
- Добавить RBAC-middleware в Phase 2 (admin/director only по RBAC-MATRIX §3.2).

---

## 9. Установка новых пакетов

### 9.1 Production packages

```bash
pnpm add @tanstack/react-query@^5 @tanstack/react-query-devtools@^5 \
         react-hook-form@^7 @hookform/resolvers@^3 \
         sharp@^0.32
```

**Куда будет использоваться (Phase 2):**
- `@tanstack/react-query` — для всех API списков (proposals, contracts, products) — кэш + invalidation.
- `react-hook-form` + `@hookform/resolvers/zod` — для КП-редактора (50+ полей, инлайн-редактирование).
- `sharp` — серверный CPU-only ресайз загружаемых фото (правка G из МОДУЛЬ-дока).

### 9.2 Dev packages

```bash
pnpm add -D husky@^8 lint-staged@^15 \
           @commitlint/cli@^17 @commitlint/config-conventional@^17
```

### 9.3 Замена npm на pnpm — что делать с `package-lock.json`

```bash
# Удалить старый npm lockfile
rm package-lock.json

# Установить через pnpm
pnpm install

# pnpm-lock.yaml создан автоматически
git add pnpm-lock.yaml
```

### 9.4 Обновить `package.json` scripts (после `pnpm add husky` добавится автоматически)

```json
{
  "scripts": {
    "prepare": "husky",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint",
    "tsc": "tsc --noEmit"
  }
}
```

---

## 10. Husky pre-commit gates setup

### 10.1 Файлы для создания

#### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm tsc --noEmit
pnpm eslint src
```

#### `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit "$1"
```

#### `.lintstagedrc.json` (корень)

```json
{
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{md,json}": [
    "prettier --write"
  ]
}
```

#### `commitlint.config.js` (корень)

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    'subject-max-length': [2, 'always', 72]
  }
};
```

### 10.2 Сделать hook файлы executable

```bash
chmod +x .husky/pre-commit .husky/commit-msg
```

---

## 11. Verify baseline (88 тестов + tsc + eslint)

После применения ВСЕХ миграций и установки пакетов:

```bash
# 11.1 TypeScript полная компиляция
pnpm tsc --noEmit
# Exit 0 + 0 ошибок

# 11.2 Eslint
pnpm eslint src
# Exit 0 + 0 ошибок

# 11.3 Vitest все 88 baseline-тестов проходят
pnpm vitest run
# 88 passed (88 total)

# 11.4 Prisma schema валидна
pnpm prisma validate
# Schema is valid

# 11.5 Prisma migration applied
pnpm prisma migrate status
# All migrations applied
```

### 11.1 Если что-то падает

**Не сломать 88 baseline-тестов** — это hard pass/fail. Если миграция нарушает baseline:

1. **Snap!** Стоп. Не merge.
2. **Найти** какой из 88 тестов ожидает старое поле (`price` вместо `priceSnapshot`).
3. **Варианта 2:**
   - Обновить тест (предпочтительно — test reflects new schema).
   - Откатить миграцию (последнее средство).
4. **Зафиксировать** в `04-01-LOG.md`.

---

## 12. Self-verification checklist

```
✅ Clone + rename:
   – git clone /path/to/kppdf-5.0 /path/to/kppdf-6.0
   – package.json → name: "kppdf-6.0"
   – branch: phase-1-bootstrap
   – pnpm install (без ошибок)

✅ Migration A (priceSnapshot):
   – ALTER TABLE: add priceSnapshot
   – Backfill: price → priceSnapshot
   – Drop old price
   – DROP NOT NULL на priceSnapshot (nullable для рамочных)
   – DROP NOT NULL на quantity
   – COMMENT ON COLUMN

✅ Migration E (delete DocPackage + add packageTag):
   – ALTER TABLE add packageTag к 3 таблицам
   – Backfill из DocPackage (если был)
   – Создать 3 индекса
   – DROP CONSTRAINT FK для 3 таблиц
   – DROP COLUMN coveredByPackageId для 3 таблиц
   – DROP TABLE DocPackage

✅ Migration F (Comment table):
   – CREATE TABLE Comment с 7 полями
   – 3 индекса (packageTag, authorId, createdAt)
   – FK на User с ON DELETE RESTRICT
   – default now() на createdAt, default false на isArchived

✅ Установка новых пакетов:
   – @tanstack/react-query@5.x
   – react-hook-form@7.x
   – @hookform/resolvers@3.x
   – sharp@0.32.x
   – husky@8.x (dev)
   – lint-staged@15.x (dev)
   – @commitlint/cli@17.x (dev)

✅ Husky setup:
   – .husky/pre-commit executable
   – .husky/commit-msg executable
   – .lintstagedrc.json корректный
   – commitlint.config.js корректный
   – package.json scripts: prepare: "husky"

✅ Verify baseline:
   – pnpm tsc --noEmit → 0 errors
   – pnpm eslint src → 0 errors
   – pnpm vitest run → 88 passed
   – pnpm prisma validate → schema valid
   – pnpm prisma migrate status → applied

✅ README.md:
   – Stack: Next.js 16 + React 19 + Mantine + Tailwind 4 + Prisma 7 + PostgreSQL 16
   – State: Zustand + TanStack Query
   – Forms: react-hook-form + Zod
   – Images: sharp
   – Package manager: pnpm (НЕ npm)
   – CI/CD: Husky pre-commit gates

✅ Audit trail:
   – 04-01-LOG.md: каждая команда + результат зафиксирован
   – 04-02-REPORT.md: финальный отчёт с метриками
```

Если хотя бы один пункт НЕ пройден → **НЕ merge**, исправить.

---

## 13. Pre-action + Post-action (cross-ref AGENT-METHOD.md §5.6)

> **Методология проекта:** см. [`AGENT-METHOD.md` §5.6](../../AGENT-METHOD.md#56).

В начале `04-01-LOG.md` Агент ОБЯЗАН создать блок `## IN-WORK CHECKLIST (Pre-action)` (стандартный шаблон см. §5.6.6). Ниже — REGISTRY-специфичные шаги для Phase 1 Bootstrap:

### Шаги (5 фаз):

1. [ ] **Setup**: clone + rename + branch + pnpm install (Phase 1 Bootstrap шаг 1).
2. [ ] **Migration A**: ContractItem priceSnapshot + nullable для рамочного (Phase 1 шаг 2).
3. [ ] **Migration E**: drop DocPackage + add packageTag к 3 таблицам + 3 индекса (Phase 1 шаг 3).
4. [ ] **Migration F**: new Comment table с индексами + FK на User (Phase 1 шаг 4).
5. [ ] **Установка packages**: TanStack Query, RHF, sharp, husky, lint-staged, commitlint (Phase 1 шаг 5).
6. [ ] **Husky setup**: 4 файла + chmod +x + prepare script (Phase 1 шаг 6).
7. [ ] **Verify baseline**: tsc + eslint + vitest 88/88 + prisma validate + prisma migrate status (Phase 1 шаг 7).
8. [ ] **README.md update**: отразить стек v6.
9. [ ] **04-02-REPORT.md**: финальный отчёт для PO.
10. [ ] **Post-action**: обновить 04-01-LOG.md с checkpoint.

### Что НЕ делаю:

- Не редактирую исходные 47 моделей в baseline (только целевые изменения из §6-§8).
- Не пишу новые API endpoints / UI — это Phase 2.
- Не применяю правку B (workflow rule) — это Phase 2 API Route логика.
- Не изменяю `99_Справочники/*.md` — это docs (out of scope этой задачи).
- Не удаляю kppdf-5.0 — reference нужен.

### Что может пойти не так:

- **88 baseline-тестов падают** → стоп. Не merge. Найти какой тест ожидает старое поле и обновить.
- **`pnpm install` падает** на конфликте версий с baseline → проверить Node.js версию (требуется 22+), pnpm версию (9+).
- **DocPackage FK conflict** при migration E → нужна специальная миграция через несколько шагов (drop FK → drop column → drop table, NOT в одной).
- **Husky hooks не работают** в Windows → проверить `.husky/_/husky.sh` путь; может потребоваться Linux-style command или WSL.

---

## 14. Связь с другими ТЗ и roadmap

### 14.1 Параллельные ТЗ (НЕ блокируют, но обогащают)

- **ТЗ-001 REGISTRY-OF-RULES** — когда готов, использовать §1 (RBAC) и §3 (Validation) для verification миграционных checksum. **ТЗ-004 может стартовать до ТЗ-001** — он не зависит от REGISTRY.
- **ТЗ-002 Run 1/5 Аналитика** — когда готов, использовать `RBAC-КП-A-NNN` идентификаторы в комментариях миграционных файлов (или в Phase 2). **ТЗ-004 может стартовать до ТЗ-002**.
- **ТЗ-003 LAUNCH-UX** — `LAUNCH-UX.md` будет использоваться в **Phase 2 Mantine UI**. Не блокер для ТЗ-004.

### 14.2 Roadmap после ТЗ-004

| Фаза | Что | ТЗ |
|---|---|---|
| **Phase 1 Bootstrap DONE** | kppdf-6.0 со всеми 3 миграциями + packages + Husky | Это ТЗ-004 |
| **Phase 2 Mantine UI + RBAC-middleware** | Реализация UI по `LAUNCH-UX.md` + RBAC из REGISTRY | ТЗ-005 (будущее) |
| **Phase 2 API Routes + Zod** | Генерация Zod-схем из REGISTRY §3 + Vitest-tests | ТЗ-006 (будущее) |
| **Phase 2 Run 2..5 Аналитика** | Применить ТЗ-002 подход к 4 модулям | ТЗ-007..010 (будущее) |
| **Phase 3 PROD deploy** | Docker Compose (3 сервиса) на Synology DSM | ТЗ-011 (будущее) |

---

## 15. Версия и автор

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание ТЗ по запросу PO (через Буфер-главный Архистратор). Шаблон ТЗ-001/002/003. 3 миграции + packages + Husky + verify baseline. |

---

> **Статус ТЗ:** ✅ Готово к запуску. Передайте этот файл параллельному ИИ-агенту с указанием «выполни ТЗ-004 (Phase 1 Bootstrap Prisma миграций)». ЭТОТ ТЗ **может стартовать НЕЗАВИСИМО от ТЗ-001/002/003** — все правки A, E, F согласованы в МОДУЛЬ-доке, все версии пакетов согласованы в `СТЕК-ПРЕДПИСАНИЕ.md`. После завершения ТЗ-004 — репозиторий `kppdf-6.0` готов для Phase 2.
