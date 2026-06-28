<<<<<<< HEAD
# LAUNCH-MODELER.md — Package для запуска Моделировщика Prisma (Phase 1 Bootstrap + миграции)

> **Назначение.** Готовый copy-paste пакет для запуска **Моделировщика** (Prisma specialist) в новой сессии Codebuff. Подготовлен 2026-06-27 по паттерну LAUNCH-ARCHITECT/LAUNCH-ANALYST/LAUNCH-AUDITOR. Закрывает дыру в [`CHECKLIST.md` §4 Карта ролей](../CHECKLIST.md) (TBD → ✅).
>
> **Когда использовать.** После того как **Аналитики Run 1..5 завершены** (для всех 5 модулей: КП, Договор, Производство, Склад, Финансы) + **REGISTRY-OF-RULES.md создан** + **baseline schema от `00kppdf-5.0` клонирован**. Моделировщик работает с ТЗ-004 (Phase 1 Bootstrap Prisma) для КП и расширяет schema на 4 не-КП модуля по [`MODULE-DECOMPOSITION-PLAN.md`](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md).
>
> **Trigger:** фраза PO *«Запустить Моделировщик для Phase 1 Bootstrap Prisma / расширения 4 модулей»* или *«Применить ТЗ-004 + ТЗ-011»*.

---

## 0. Что должно произойти (READ THIS FIRST)

> **⚠️ ПОРЯДОК ЧТЕНИЯ:**
>
> 1. `[`LAUNCH-MODELER.md`](LAUNCH-MODELER.md)` полностью (этот файл).
> 2. [СТЕК-ПРЕДПИСАНИЕ.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) §1-3 (Phase C миграции).
> 3. [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md) (Phase 1 Bootstrap для КП).
> 4. [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9 (Prisma по 4 модулям).
> 5. SCHEMA-CONSULIDATED.md, RBAC-MATRIX.md.
>
> После прочтения — следуй §1.

---

## 1. Файлы для attach (8 штук, в этом порядке)

### Пакет A — Агентная инфраструктура (3 файла)

| # | Путь | Зачем |
|---|---|---|
| 1 | [`AGENT-ENTRYPOINT.md`](../AGENT-ENTRYPOINT.md) | Точка входа |
| 2 | [`AGENT-ROLES.md`](../AGENT-ROLES.md) §2.3 «Моделировщик» |
| 3 | [`AGENT-METHOD.md`](../AGENT-METHOD.md) §3 «Правило 3.1» + §4.5 STUB |

### Пакет B — Канонический контекст (3 файла)

| # | Путь | Зачем |
|---|---|---|
| 4 | [СТЕК-ПРЕДПИСАНИЕ.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) | Версии пакетов (Prisma 7.8 + PostgreSQL 16) |
| 5 | [SCHEMA-CONSOLIDATED.md](../99_Справочники/SCHEMA-CONSOLIDATED.md) | 32+ сущностей по 5 модулям |
| 6 | [RBAC-MATRIX.md](../99_Справочники/RBAC-MATRIX.md) | 7 ролей × 30 действий |

### Пакет C — Spec для работы (2 файла)

| # | Путь | Зачем |
|---|---|---|
| 7 | [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md) | Конкретные 3 миграции (правки A/E/F) |
| 8 | [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9 | Расширение на 4 не-КП модуля |
=======
# LAUNCH-MODELER.md — Package для запуска Моделировщика данных (Pipeline v6, роль 3, модуль КП)

> **Назначение.** Готовый copy-paste пакет для запуска следующего агента (Моделировщика данных) в **новой сессии Codebuff**. Подготовлен 2026-06-26 после успешного прогона Бизнес-аналитика Run 1/5 (Run 5/5 в работе) для модуля КП. **Это Pipeline v6 прогон Моделировщика** — создание человекочитаемой спецификации Prisma-схемы (32 модели) для разработчика, который напишет `prisma/schema.prisma`.
>
> **Когда использовать.** Строго ПОСЛЕ завершения Run 1..5 Аналитика (когда готовы базовые правила модуля КП) и ДО запуска UX-дизайнера. Открой `codebuff` (новый чат), скопируй промпт из §2 и прикрепи файлы из §1.

---

## 0. Что должно произойти

1. **Открыть новую сессию Codebuff** (CLI: `codebuff` → New Chat).
2. **Прикрепить 9 файлов** из секции `## 1. Файлы для attach` ниже (порядок важен: инфраструктура → справочники → результаты Аналитика).
3. **Вставить copy-paste промпт** из секции `## 2. Промпт для Codebuff` (между ```text ... ```).
4. **Отправить** — Моделировщик начнёт трансляцию бизнес-правил + свода SCHEMA-CONSOLIDATED в строгую Prisma-спецификацию.
5. **Вернуться в ЭТУ сессию** с output'ом Моделировщика → записать **PSL-009** (Pipeline v6 прогон Моделировщика) + commit + push.
6. **Запустить UX-проектировщика** (следующая роль по Правилу 3.1 AGENT-ROLES.md §3), но ТОЛЬКО ПОСЛЕ QA-петли (✅ нет 🔴 P0).

> **Почему именно эта роль сейчас.** Per [`AGENT-ROLES.md` §3 Pipeline](../../AGENT-ROLES.md): «Architect → BusinessAnalyst → **DataModeler** → UX → TechWriter → QA → Coordinator». Моделировщик строго ПОСЛЕ Аналитика потому что он транслирует **пронумерованные правила** и **state-машину** в сущности + поля + FK + ON DELETE. Без правил Аналитика Моделировщик не знает, какие инварианты покрывать (`amount > 0`, `CHECK constraint`, `UNIQUE`, snapshot).

---

## 1. Файлы для attach (9 штук, в этом порядке)

> ⚠️ **Порядок важен** — сначала инфраструктура (роль + ограничения), потом справочники (что уже зафиксировано), потом результаты Аналитика Run 1 (state-машина + правила = вход для схемы).

### Пакет A — Агентная инфраструктура (4 файла, ОБЯЗАТЕЛЬНО)

| # | Путь | Размер | Зачем Моделировщику |
|---|---|---|---|
| 1 | [`AGENT-ENTRYPOINT.md`](../../AGENT-ENTRYPOINT.md) | ~190 строк | Точка входа, slim master + навигация `00 → 01 → 02 → 03 → 04` |
| 2 | [`AGENT-ROLES.md`](../../AGENT-ROLES.md) | ~155 строк | §2.3 **Моделировщик** (зона ответственности: типы, FK, ON DELETE. Чего НЕ делать: бизнес-логика, UX, RBAC) + §3 Pipeline + §1 атомарность |
| 3 | [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md) | ~167 строк | **П7 «Поля с типами»** (`price: Decimal ≥ 0`), **П2 «Цифры, а не слова»**, **П3 «явные зависимости»**, **П5 «кросс-ссылки вместо копий»** + §1.2 «вода запрещена» + §3 таблицы всегда с шапкой |
| 4 | [`AGENT-REVIEW.md`](../../AGENT-REVIEW.md) | ~74 строки | §1.6 hard limit 400 строк (если спецификация 32 моделей огромна → разбей на `99_Справочники/PRISMA-MODELS.md` + `99_Справочники/PRISMA-RELATIONS.md` — см. §4 ниже) |

### Пакет B — Справочники и входной свод схемы (3 файла, ОБЯЗАТЕЛЬНО)

| # | Путь | Размер | Зачем |
|---|---|---|---|
| 5 | [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) | ~400 строк | **🔴 P0 ВХОД.** Свод 32 сущностей + 17 enum-типов (~22 enum-а total) + Counter safe-increment + резерв-контракт + ER-карта + согласованная цепочка инвариантов. Это база для строгой Prisma-спецификации |
| 6 | [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) | ~165 строк | 15 зафиксированных СПОР. Особенно: СПОР-9 `isActive` (originator для soft-delete), СПОР-13 (отдельный `Counter`-таблица), СПОР-14 (только RUB → `currency = 'RUB'` жёстко) |
| 7 | [`99_Справочники/OPEN-QUESTIONS-MASTER.md`](../../99_Справочники/OPEN-QUESTIONS-MASTER.md) | ~280 строк | 38 ✅ ПРИНЯТО решений — проверка непротиворечивости схемы с закрытыми Q |

### Пакет C — Результаты Аналитика Run 1 (2 файла)

> **Когда Run 5/5 Аналитика завершится** (5 других заполненных STUB, см. карту в `LAUNCH-ANALYST.md` §3) — добавить их в attach (тогда attach-list = 11-14 файлов). Поскольку Run 1 — это минимальный пререквизит (RBAC + правила + state), начинаем с него. Если 9 файлов риск OOM (Codebuff иногда сжимает long context) — убрать OPEN-QUESTIONS-MASTER (он только для справки по противоречиям).

| # | Путь | Размер (текущий STUB ~15 → ~80-250 после Run 1) | Зачем |
|---|---|---|---|
| 8 | [`01_КП/04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md) | ~80-400 строк (или split на `04-biznes-pravila-osnovnye.md` + `04-pravila-ceny-i-marzha.md`) | 9 групп инвариантов → Моделировщик проставляет CHECK constraints / UNIQUE / NOT NULL на схеме для каждого правила |
| 9 | [`01_КП/03-zhiznennyj-cikl/03-statusy.md`](../03-zhiznennyj-cikl/03-statusy.md) | ~80-200 строк | 8 статусов КП + ASCII-схема переходов → проверка `Proposal.status` enum + triggers переходов |

**Итого attach:** 9 файлов ≈ ~1700 строк контекста. Безопасно для OOM (typical Codebuff limit ~30k tokens).

> **Дополнительно НЕ прикладывать** (используются ПОСЛЕ): `01_КП/04-pravila/04-rbac.md` (RBAC — это работа Аналитика, не влияет на схему БД), `02_КП/02-tablica-pozicij.md` (поля экрана — работа UX, не Моделировщика), `PROJECT-STATE-LOG.md` (для контекста уже есть в твоей сессии; следующему запуску PSL-009 будет достаточно).
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

```text
<<<<<<< HEAD
Ты — Моделировщик (Prisma specialist). Прочитай [FILES_ATTACHED]
в порядке (Пакеты A → B → C).

🎯 ГЛАВНАЯ ЦЕЛЬ: Создать schema.prisma для kppdf-6.0 на основе
   baseline kppdf-5.0 + применить 3 миграции из ТЗ-004 (правки A/E/F)
   + расширить schema на 4 не-КП модуля согласно MODULE-DECOMPOSITION-PLAN.md §9.

Вход baseline: kppdf-5.0/ (47 моделей). Копируй в kppdf-6.0/.
Выход: schema.prisma (≥600 строк) + 3 миграции (правки A/E/F) +
       4 module-specific extensions.

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ

1. **СТРОГО ЗАПРЕЩЕНО** менять логику бизнес-правил — это работа
   Аналитика. Ты работаешь с СТРУКТУРОЙ БД.

2. **Каждое поле имеет DTO + onDelete правило:**
   - onDelete: Cascade для owned relations (Comment → parent)
   - onDelete: Restrict для business relations (Contract → Client)
   - onDelete: SetNull для soft references

3. **Версии пакетов — STРОГО из СТЕК-ПРЕДПИСАНИЕ.md:**
   - Prisma = 7.8
   - PostgreSQL = 16
   - pnpm = 9.x
   - Не подменять версии.

4. **88 baseline Vitest MUST pass** после миграций.
   `pnpm test` exit code = 0 обязателен.

5. **Husky gates** — pre-commit запускает `tsc --noEmit && eslint
   && prettier --check`. Все 0 ошибок.

6. **Naming convention — camelCase**: User.id, User.createdAt,
   ContractItem.priceSnapshot (НЕ snake_case).

7. **Index добавлены на FK-поля**: projectId, clientId, statusId,
   authorId (как минимум). Для полей с фильтрацией >100 записей.

8. **Soft-delete pattern**: deletedAt DateTime? поле в каждой
   root-entity (per REGISTRY § 5 «Soft-delete Rule»).

Примени ТЗ-0000 (universal closure protocol) перед сдачей:
- 6 фаз: pre-condition → RE-READ → SELF-AUDIT → CROSS-REF → 🔒 FINALIZED →
  CLOSURE-REPORT.
- Создай CLOSURE-REPORT.md рядом с kppdf-6.0/.

ВЫХОД: schema.prisma + 3 миграции + package.json + .husky/ + baseline test result.
Acceptance: `pnpm install && pnpm prisma migrate dev && pnpm test` exit 0.
=======
Ты — Моделировщик данных. Прочитай [FILES_ATTACHED] (Пакеты A → B → C).

Твоя задача: создать строгую человекочитаемую спецификацию
Prisma-схемы (Prisma Schema Specification) для разработчика на базе
SCHEMA-CONSOLIDATED.md + бизнес-правил Аналитика из Run 1
(04-biznes-pravila.md + 03-statusy.md).

ВХОД: 32 модели (включая 4 новые сущности Склада v6), 17 enum-типов
(~22 enum-а total), Counter safe-increment, согласованная цепочка инвариантов
(см. SCHEMA-CONSOLIDATED.md §6).

ВЫХОД: Создай НОВЫЙ файл `99_Справочники/PRISMA-SCHEMA-SPEC.md`
(либо разбей на 2 при превышении 400 строк — см. ниже).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ — НАРУШЕНИЕ = дрейф ролей + нарушение
 атомарности

1. **СТРОГО ЗАПРЕЩЕНО** лезть в файлы ВНЕ Пакет C и расширять
   `SCHEMA-CONSOLIDATED.md`. В частности:
   - НЕ редактируй `99_Справочники/SCHEMA-CONSOLIDATED.md`
     напрямую (это сводный документ; расширения порождают
     новый файл PRISMA-SCHEMA-SPEC.md).
   - НЕ редактируй `99_Справочники/GLOSSARY-MASTER.md`
     (термины — работа Координатора).
   - НЕ редактируй `01_КП/04-pravila/04-rbac.md` (RBAC
     матрица — это работа Аналитика; Моделировщик НЕ
     повторяет её в схеме БД).

2. **Соблюдай агентную границу** per AGENT-ROLES.md §2.3:
   - ✅ Твоё: сущности + типы + FK + ON DELETE + UNIQUE
     constraints + CHECK constraints + миграционный план
     + тестовая стратегия БД.
   - ❌ НЕ Твоё: бизнес-правила как «Условие → Следствие»
     (это Аналитик), RBAC-матрицы (Аналитик), UX-экраны
     (UX), JSON-схема блоков для конструктора шаблонов
     (UX), логика валидации форм (frontend).

3. **Жёсткий формат выхода** — строго в духе AGENT-FORMAT.md
   §2.2 (шаблон раздела):
   - Каждая модель: `# Model EntityName` → `## 0. Контекст` →
     `## 1. Поля` (таблица: Поле | Тип | Обязательное | Default
     | Описание | Snapshot?) → `## 2. Связи (FK)` (таблица: FK
     | Тип | ON DELETE | Источник) → `## 3. Constraints`
     (UNIQUE / CHECK / Index).
   - Без воды. Без «вероятно», «обычно» (анти-паттерн A2).

⚡ ОБЯЗАТЕЛЬНЫЕ EDGE CASES — нарушение = 🔴 P0 в QA-петле:

A. **ON DELETE правила (60+ связей)** — каждая FK явно:
   - Главные родительские (Organization, Product, Warehouse,
     Workshop, Proposal для Contract) → **RESTRICT** (нельзя
     удалить пока используется).
   - Child-элементы (*Item таблицы) → **CASCADE** (при удалении
     родителя удаляются все позиции).
   - Опциональные связующие (approverId, responsibleUserId,
     transferFromWarehouseId, parentContractId для СД) →
     **SET NULL** (запись сохраняется, FK обнуляется).
   - User как `createdById` → **RESTRICT** (кто-то создал —
     нельзя удалить сотрудника без передачи дел).

B. **Soft-delete через `isActive Boolean @default(true)`** —
   per SCHEMA-CONSOLIDATED.md §0.1 — единообразно для ВСЕХ
   бизнес-сущностей. СПОР-9 (24.06.2026 ✅ ПРИНЯТО)
   формализовал обязательность на Organization как
   originator. НЕ удалять через `DELETE` — только менять
   `isActive=false`. Другие сущности (Product, User,
   Organization, OrganizationSigner, Workshop, Warehouse,
   Counter) при необходимости получат тот же паттерн
   по решению PO/Аналитика.

C. **Snapshot-поля** на *Item таблицах явно помечены:
   - ProposalItem: `productSku`, `productName`, `productUnit`
   - ContractItem: `productSku`, `productName`, `productUnit`
   - ProductionTask: `productSku`, `productName`
   - SupplierDeliveryItem / ShipmentItem / WriteOffItem /
     PurchaseOrderItem — аналогично.
   В описании каждого snapshot-поля ОБЯЗАТЕЛЬНО комментарий:
   «[SNAPSHOT] Копируется в момент создания из
   Product.{sku|name|unit}. НЕ обновляется при изменении
   справочника Product».

D. **Counter-table с safe-increment через SELECT FOR UPDATE**
   (см. SCHEMA-CONSOLIDATED.md §4.2):
   - Таблица `Counter`: PK = `id` (String, тип счётчика:
     'proposal' / 'contract' / 'production' / 'order' / etc),
     `year` (Int nullable), `value` (BigInt).
   - В спецификации ОБЯЗАТЕЛЬНО псевдо-код `nextNumber()`
     SELECT FOR UPDATE для разработчика (это единственная
     допустимая вставка кода, ~10 строк TypeScript).

E. **UNIQUE Constraint** на StockRecord:
   - `@@unique([warehouseId, productId])` — одна запись на
     пару (warehouse, product).

F. **Новые сущности Склада v6** (отсутствовали в baseline v5):
   - SupplierDelivery + SupplierDeliveryItem (СД-XXXX)
   - Shipment + ShipmentItem (ОТК-XXXX)
   - WriteOffAct + WriteOffItem (АС-XXXX)
   - PurchaseOrder + PurchaseOrderItem (ЗП-XXXX)
   Все 4 должны быть в спецификации.

G. **Refund — ОТДЕЛЬНАЯ сущность, НЕ отрицательный Payment**:
   - `Refund.amount > 0` (Decimal, всегда положительная,
     вычитается математически из Order.paidAmount).
   - `Refund.originalPaymentId NOT NULL` + `RESTRICT`
     (нельзя удалить Payment у которого есть Refund).
   - `Refund.linkedProductionOrderId?, linkedShipmentId?,
     linkedWriteOffId?` — все `SET NULL` (audit log
     сохраняется).

H. **CHECK constraints для инвариантов Аналитика** —
   для каждого правила из 04-biznes-pravila.md создай
   соответствующее поле + constraint:
   - «цена ≥ 0» → `CHECK (price >= 0)` на ProposalItem.price
   - «скидка ∈ [0, 100]» → `CHECK (discountPercent >= 0 AND
     discountPercent <= 100)` на ProposalItem
   - «amount > 0» для Payment INCOMING / Refund → CHECK.
   - «количество >= 0» → CHECK на всех *Item.quantity.

I. **Enums (17 типов / ~22 enum-а всего по SCHEMA-CONSOLIDATED.md §3)**
   — все перечислить явно: ProposalStatus (6 значений),
   ContractStatus (7), ProductionOrderStatus (8),
   ProductionTaskStatus (6), StockMovementType (4) + Reason (7),
   SupplierDeliveryStatus (6), ShipmentStatus (6),
   WriteOffReason (7) + WriteOffActStatus (5),
   PurchaseOrderStatus (8), PurchaseRequestStatus (4) + Reason (2),
   OrderStatus (5), InvoiceStatus (5) + InvoiceType (3),
   PaymentMethod (3) + PaymentType (2: INCOMING/STORNO),
   UserRole (7), OrganizationRole (3), ProductKind (3),
   ProductType (2). НЕ пропустить ни один.

📋 ТРЕБОВАНИЯ К ВЫХОДНОМУ ФАЙЛУ PRISMA-SCHEMA-SPEC.md:

1. Сводная карта 32 моделей (таблица: модель | префикс
   номера | главные FK | ON DELETE стратегия | источник).
2. Подробные карточки каждой модели (по 5 шагов выше).
3. Индексы и Unique Constraints (отдельной секцией).
4. Миграционный план (SCHEMA-CONSOLIDATED.md §7 +
   baseline v5 → v6 — какие таблицы создаются, какие
   удаляются).
5. Тестовая стратегия БД (88 baseline тестов должны пройти;
   новые модели требуют N новых тестов — минимум 1 на
   каждую FK + ON DELETE комбинацию).

HARDCAP 80-250 СТРОК TARGET / 400 HARD LIMIT:
- Если PRISMA-SCHEMA-SPEC.md превышает 400 строк →
  разбей на 2 файла (рекомендуемый сплит):
  • `99_Справочники/PRISMA-MODELS.md` — только карточки
    моделей (32 модели, ~12 строк каждая = 384 строки +
    вводный контекст ~30 строк = ~415 строк — на грани;
    альтернативно группировать по доменам:
    `PRISMA-MODELS-KP.md` (КП: Proposal+ProposalItem+
    DocumentTemplate+Counter), `PRISMA-MODELS-DOGOVOR.md`
    (Договор), и т.д. — 5 файлов).
  • `99_Справочники/PRISMA-RELATIONS.md` — только FK +
    ON DELETE + UNIQUE + CHECK + миграции + safe-increment
    псевдо-код.

Формат: применяй AGENT-REVIEW.md §1-5 чек-лист перед сдачей.
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb
```

---

<<<<<<< HEAD
## 3. Ожидаемый формат ответа

```markdown
## Phase 1 Bootstrap Prisma Report

| Deliverable | Статус |
|---|---|
| kppdf-6.0/ cloned | ✅ |
| schema.prisma (≥600 lines) | ✅ |
| Migration #1 (правка A) | ✅ |
| Migration #2 (правка E) | ✅ |
| Migration #3 (правка F) | ✅ |
| package.json (4 prod deps) | ✅ |
| Husky gates | ✅ |
| `pnpm install` | ✅ exit 0 |
| `pnpm prisma migrate dev` | ✅ exit 0 |
| `pnpm tsc --noEmit` | ✅ exit 0 |
| `pnpm test` (88 baseline) | ✅ 88/88 |
| `pnpm eslint` | ✅ exit 0 |

## Cross-References integrity

- Все 32+ сущности из SCHEMA-CONSOLIDATED.md покрыты в schema.prisma
- Все RBAC-правила из RBAC-MATRIX.md имеют соответствующие field-
  level permissions
```

---

## 4. Пост-обработка

### Шаг A: Verify hard limits

```bash
cd 'kppdf-6.0'
wc -l prisma/schema.prisma
# Target: 600-1500. Hard: 2000.
```

### Шаг B: Commit + push

```bash
git add prisma/ package.json .husky/ tsconfig.json
git commit -m "feat(db): Phase 1 Bootstrap Prisma — kppdf-6.0 schema + 3 migrations

- schema.prisma: 32+ entities from SCHEMA-CONSULIDATED
- Migration #1: правка A (ContractItem.priceSnapshot nullable)
- Migration #2: правка E (drop DocPackage + packageTag)
- Migration #3: правка F (new Comment entity)
- Husky gates: tsc + eslint + prettier pre-commit
- 88 baseline Vitest pass

Refs: STACK-PRESCRIPTION, ТЗ-004, MODULE-DECOMPOSITION-PLAN §9"
```

### Шаг C: Trigger Phase 2 UI

Запустить следующую роль — **UX-дизайнер** через `LAUNCH-UX-DESIGNER.md` (TODO — создать по образцу).

---

## 5. Контроль качества

✅ CHECK 1: `pnpm test` 88/88. Baseline не сломан.
✅ CHECK 2: `pnpm tsc --noEmit` clean.
✅ CHECK 3: `pnpm prisma validate` OK.
✅ CHECK 4: Все 32+ сущности в schema.prisma.
✅ CHECK 5: ТЗ-0000 применён (CLOSEURE-REPORT.md создан).

---

## 6. Связанные документы

- [STACK-PRESCRIPTION.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) (миграции Phase C)
- [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md)
- [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9
- [LAUNCH-ARCHITECT.md](LAUNCH-ARCHITECT.md) — образец структуры

---

## 7. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание пакета. Mirror LAUNCH-ARCHITECT/ANALYST/AUDITOR структура. Закрывает дыру §4 «TBD — создать когда понадобится». |
=======
## 3. Зоны особого внимания (Фокус Моделировщика)

QA-петля (по Правилу 3.1) будет проверять эти места прицельно — самые частые источники ошибок:

### 3.1 Целостность дерева удалений (60+ FK стратегий)

**Что проверять:**
- `Contract.parentProposalId` → **RESTRICT** (см. SCHEMA-CONSOLIDATED.md §2). Нельзя удалить КП, пока из него создан Договор.
- `ProductionOrder.parentProposalId` → **RESTRICT** (строгий FK!). Нельзя удалить КП с активным ЗК.
- `ProposalItem.proposalId` → **CASCADE** (child-элемент).
- `ContractItem.contractId` → **CASCADE**.
- `ProductionTask.productionOrderId` → **CASCADE**.
- Расхождения: `Reservation.proposalId` → **CASCADE** (при удалении КП резерв снимается), но `Invoice.orderId` → **CASCADE** (при удалении Order все Invoice удаляются), `Payment.orderId` → **RESTRICT** (нужно сначала отсторнировать все платежи).

### 3.2 Snapshot vs Relational (развязка справочника и исторических данных)

**Что проверять:**
- Товар в `Product.price` может измениться в любой момент. `ProposalItem.price` / `ContractItem.priceWithoutVat` / `ProductionTask.quantityPlanned` ОБЯЗАНЫ сохранять историческое значение на момент создания.
- В комментариях к snapshot-полям — явное `[SNAPSHOT] Копируется при создании из Product.{X}. НЕ обновляется при изменении справочника`.
- Это позволяет отчётам за прошлые периоды показывать корректные цены.

### 3.3 Развязка Refund и Payment (финансовая целостность)

**Что проверять:**
- `Payment.amount > 0` для `type='INCOMING'` + CHECK constraint.
- `Payment.amount < 0` для `type='STORNO'` (компенсирующая корректировка опечатки бухгалтера) + CHECK constraint.
- `Refund.amount > 0` (Decimal, всегда положительная) + CHECK constraint. Вычитается математически: `Order.paidAmount = Σ INCOMING.amount - Σ STORNO.amount - Σ Refund.amount`.
- `Refund.originalPaymentId` → **NOT NULL + RESTRICT** (нельзя удалить Payment если есть Refund на него — защита от потери audit trail возврата).
- **Частая ошибка:** отрицательный `Refund.amount` или nullable `originalPaymentId` → должно быть `🔴 P0` в QA.

### 3.4 Counter safe-increment (race condition protection)

**Что проверять:**
- Таблица `Counter` существует с `id: String` (тип счётчика, не UUID) + `year: Int?` + `value: BigInt`. **НЕ использовать UUID PK для Counter** — это снижает race conditions на горячем пути (см. SCHEMA-CONSOLIDATED.md §4.1).
- Псевдо-код `nextNumber(type, year)` через `SELECT FOR UPDATE` присутствует в спецификации (10 строк TypeScript) для разработчика.
- В PostgreSQL serializable isolation level разработчик ОБЯЗАН понимать, что `SELECT FOR UPDATE` блокирует параллельные транзакции.

### 3.5 Soft-delete паттерн (единообразие)

**Что проверять:**- `Organization.isActive Boolean @default(true)` per SCHEMA-CONSOLIDATED.md §0.1 (soft-delete uniform pattern для бизнес-сущностей). СПОР-9 originator — добавил `isActive` на Organization.
   - `Proposal`/`Contract`/`Order` НЕ используют `isActive` (они удаляются через `status = 'ARCHIVED'` / `'TERMINATED'` / `'CANCELLED'`/ `='DRAFT'`-пометка). Различие паттернов — это НЕ противоречие, а семантика: справочники vs документы.
   - В комментарии — ссылка на СПОР-9 (24.06.2026 ✅) + SCHEMA-CONSOLIDATED §0.1.

---

## 4. Ожидаемый формат output'а Моделировщика (создание новых файлов)

Моделировщик должен вернуть **обзор изменений** (read-only отчёт по 3 STUB Аналитика + создание 1-5 новых файлов Prisma-спецификации):

```markdown
## Изменения Моделировщика данных — Pipeline v6 (PSL-009)

| Файл | Было | Стало | Что внутри |
|---|---|---|---|
| 99_Справочники/PRISMA-MODELS.md | NEW | X строк | 32 сущности, 17 enum-типов (~22 enum-а), типы полей, snapshot-комментарии |
| 99_Справочники/PRISMA-RELATIONS.md | NEW | Y строк | 60+ FK, ON DELETE правила, UNIQUE индексы, Миграционный план, safe-increment псевдо-код |

## Ключевые архитектурные решения
- `Organization.isActive @default(true)` — soft-delete (СПОР-9).
- `ProposalItem.productSku` помечен [SNAPSHOT] в 6 Item-таблицах.
- `StockRecord @@unique([warehouseId, productId])` — UNIQUE constraint.
- Counter через SELECT FOR UPDATE с псевдо-кодом nextNumber().

## Покрытие СПОР и OQ

| Источник | Где закрыто в схеме | Статус |
|---|---|---|
| СПОР-9 isActive на Organization | `Organization.isActive @default(true)` | ✅ закрыто |
| СПОР-13 Counter отдельная таблица | `Counter.id PK String` + safe-increment | ✅ закрыто |
| СПОР-14 RUB жёстко | `Contract.currency @default('RUB')` + CHECK | ✅ закрыто |
| OQ-23 «где хранить количество для ITEM/SERVICE/WORK» | `ProductionTask.productId` nullable для SERVICE/WORK | ✅ закрыто |

## Hard limit
- PRISMA-MODELS.md: X строк (target ≤250) ✅
- PRISMA-RELATIONS.md: Y строк (target ≤250) ✅
```

**Если Моделировщик создаёт НЕ документы Prisma-спецификации** (например, правит `SCHEMA-CONSOLIDATED.md` напрямую или создаёт TypeScript-файлы) — СТОП. Это нарушение Ограничения #1. Попросить переделать in-place через правильную структуру.

**Если Моделировщик выходит за рамки схемы БД** (правит RBAC-матрицу 04-rbac.md или правит UX-поля) — СТОП. Это нарушение последовательности pipeline.

---

## 5. Пост-обработка (в ЭТОЙ сессии)

Когда Моделировщик вернёт обзор изменений:

### Шаг A: Проверка объёма через `git diff --stat`

```bash
cd 'D:\invSportiN\Сайт\kppdf-6.0'
git status
# Ожидаемо: новые файлы PRISMA-MODELS.md + PRISMA-RELATIONS.md (или 1 файл PRISMA-SCHEMA-SPEC.md)
# + ничего другого.
# Если в status попали изменения в 04-rbac.md / SCHEMA-CONSOLIDATED.md / 02-tablica-pozicij.md —
# Моделировщик вышел за scope.
```

### Шаг B: Проверка hard limit через `wc -l`

```bash
wc -l '99_Справочники/PRISMA-SCHEMA-SPEC.md' '99_Справочники/PRISMA-MODELS.md' '99_Справочники/PRISMA-RELATIONS.md'
# Каждый ≤ 400 строк. Если > 400 → split обязателен.
```

### Шаг C: Записать **PSL-009** в `PROJECT-STATE-LOG.md` (Pipeline v6 прогон Моделировщика)

```markdown
### PSL-009 — Pipeline v6 прогон Моделировщика данных: Prisma Schema Spec

| Поле | Значение |
|---|---|
| **Дата** | YYYY-MM-DD |
| **ID** | PSL-009 |
| **Тип** | schema |
| **Модуль** | Универсально (все 32 сущности, не только КП) |
| **Автор** | PO / Моделировщик данных / Claude Sonnet-4.5 |
| **Связанные OQ** | OQ-9 (стек — Prisma ✅), СПОР-9 (isActive ✅), СПОР-13 (Counter ✅), СПОР-14 (RUB ✅) |
| **Описание** | Моделировщик переварил `99_Справочники/SCHEMA-CONSOLIDATED.md` и 2 STUB Аналитика Run 1 (04-biznes-pravila + 03-statusy) в строгую спецификацию БД. Созданы `99_Справочники/PRISMA-SCHEMA-SPEC.md` (или split на `PRISMA-MODELS.md` + `PRISMA-RELATIONS.md` при превышении hard limit). Проставлены ON DELETE правила (60+ FK), snapshot-маркеры в Item-таблицах, UNIQUE-констрейнты (StockRecord @@unique[warehouseId, productId]), safe-increment псевдо-код Counter, CHECK constraints из инвариантов Аналитика, миграционный план Phase 1 Bootstrap (30 таблиц + Counter), тестовая стратегия (88 baseline + новые модели). |
| **Причина** | Pipeline v6 — передача эстафеты от Аналитика (Run 1/5) к Моделировщику. Подготовка точной базы данных для работы UX-проектировщика (чтобы UX знал, какие поля реально доступны для вывода на экран, а какие требуют загрузки по FK). Пререквизит для Run 2..5 Аналитика, QA-петли (Правило 3.1) и Phase 1 Bootstrap миграций Prisma. |
| **Затронутые файлы** | - `99_Справочники/PRISMA-SCHEMA-SPEC.md` (NEW, ~250-400 строк)<br>- [если split] `99_Справочники/PRISMA-MODELS.md` (NEW, ~200-300 строк)<br>- [если split] `99_Справочники/PRISMA-RELATIONS.md` (NEW, ~200-300 строк)<br>- `PROJECT-STATE-LOG.md` (эта запись)<br>- `CHECKLIST.md` §4 (строка LAUNCH-MODELER ✅ заполнена) |
```

### Шаг D: Коммит + push в `origin/main`

```bash
git add .
git commit -m "build(schema): Pipeline v6 - DataModeler PRISMA Schema Spec (PSL-009)

- Created precise Prisma specifications for 32 models
  (including 4 new Warehouse v6 entities: SD, OTK, AS, ZP)
- Defined EXPLICIT ON DELETE strategies for 60+ FKs
  (RESTRICT for parents, SET NULL for optional, CASCADE for children)
- Marked [SNAPSHOT] fields on all *Item tables (productSku, productName, productUnit)
- Added soft-delete isActive via Organization (SPOR-9)
- Implemented Counter safe-increment via SELECT FOR UPDATE
  pseudocode for developer (SPOR-13)
- UNIQUE constraint @@unique[warehouseId, productId] on StockRecord
- CHECK constraints for Analyst invariants
  (price >= 0, discountPercent 0..100, amount > 0 for Payment/Refund)
- Refund as SEPARATE entity (NOT negative Payment) with
  originalPaymentId NOT NULL + RESTRICT
- Migration plan Phase 1 Bootstrap: 30 tables + Counter
- Testing strategy: 88 baseline tests + new per FK combination

Refs: PSL-004 (Architect decomposition), PSL-005 (Analyst launch-package),
      LAUNCH-ANALYST.md §3 (multi-run map), SCHEMA-CONSOLIDATED.md (input),
      AGENT-ROLES §2.3 (Data Modeler responsibility)."

git push origin main
```

### Шаг E: QA-петля ОБЯЗАТЕЛЬНАЯ (Правило 3.1)

> ⚠️ **НЕ запускать UX-проектировщика напрямую.** Per [`AGENT-ROLES.md` §3 Правило 3.1](../../AGENT-ROLES.md): «После правок — ОБЯЗАТЕЛЬНАЯ петля через QA-валидатор для перепроверки». Поэтому после PSL-009 — подготовь **`LAUNCH-QA-MODELER.md`** (mirror структуры `LAUNCH-QA-KP.md`, но для QA-проверки Prisma-спецификации). QA-валидатор должен подтвердить:
>
> - Все 32 модели описаны без пропусков
> - Все 60+ FK имеют явное ON DELETE правило
> - Snapshot-поля помечены в 6 Item-таблицах
> - Counter safe-increment через SELECT FOR UPDATE присутствует
> - Refund vs Payment развязка корректна
> - 17 enum-типов (~22 enum-а) полные, без пропусков значений
> - Миграционный план согласован с baseline v5 → v6
>
> QA должен подтвердить «🔴 P0 больше нет» перед переходом к UX-проектировщику (`LAUNCH-UX.md` — нужно подготовить зеркально этому пакету).

---

## 6. Контроль качества запуска (CHECK-лист)

✅ **CHECK 1: OOM не произошёл.** Если Моделировщик вернул обрезанный/пустой ответ → split на 2 прогона (PRISMA-MODELS в Run 3-KP-1, PRISMA-RELATIONS в Run 3-KP-2).

✅ **CHECK 2: Только новые файлы Prisma-спецификации.** `git status` показывает: 1 файл `PRISMA-SCHEMA-SPEC.md` ИЛИ 2 split-файла `PRISMA-MODELS.md` + `PRISMA-RELATIONS.md`. Если в status попали `04-rbac.md` / `SCHEMA-CONSOLIDATED.md` / `02-tablica-pozicij.md` → Моделировщик вышел за scope.

✅ **CHECK 3: Поля с типами по П7 AGENT-FORMAT.md.** Каждое поле имеет явный тип (`String` / `Boolean` / `Int` / `BigInt` / `Decimal` / `DateTime` / `Json` / enum-ссылка) + nullable marker (`?`).

✅ **CHECK 4: ON DELETE стратегия на каждом FK.** Все 60+ FK имеют явное `RESTRICT` / `SET NULL` / `CASCADE`. Без указания = 🔴 P0.

✅ **CHECK 5: Snapshot-поля помечены.** В 6 Item-таблицах (`ProposalItem`, `ContractItem`, `ProductionTask`, `SupplierDeliveryItem`, `ShipmentItem`, `WriteOffItem`, `PurchaseOrderItem`) поля `productSku`/`productName`/`productUnit` имеют комментарий `[SNAPSHOT]`.

✅ **CHECK 6: UNIQUE constraint на StockRecord.** `@@unique([warehouseId, productId])` явно указан.

✅ **CHECK 7: Counter safe-increment через SELECT FOR UPDATE.** Псевдо-код `nextNumber()` присутствует в спецификации (~10 строк TypeScript), плюс комментарий «serializable isolation level» для разработчика.

✅ **CHECK 8: Refund vs Payment развязка.** `Refund.amount > 0` (CHECK), `Refund.originalPaymentId NOT NULL` + `RESTRICT`. `Payment.amount > 0` для `INCOMING` + `Payment.amount < 0` для `STORNO` (CHECK).

✅ **CHECK 9: 17 enum-типов (~22 enum-а) полные, без пропусков значений.** Все перечисленные в Edge case I + SCHEMA-CONSOLIDATED.md §3 — полный список 17 типов / 22 enum значений.

✅ **CHECK 10: Hard limit соблюдён.** `PRISMA-SCHEMA-SPEC.md` (если 1 файл) ≤ 400 строк ИЛИ каждый из `PRISMA-MODELS.md` + `PRISMA-RELATIONS.md` ≤ 400 строк. Если нет → split обязателен.

✅ **CHECK 11: СПОР/OQ резолюции соблюдены.** Ни одно решение Моделировщика не нарушает резолюции 15 СПОР + 38 Q: СПОР-9 (isActive), СПОР-11 (CONVERTED финальный), СПОР-13 (Counter), СПОР-14 (RUB жёстко), СПОР-15 (одна ставка НДС → `vatRate` enum если добавится).

---

## 7. Связанные документы

### 7.1 Запуск по Pipeline

- [`01_КП/LAUNCH-ANALYST.md`](LAUNCH-ANALYST.md) — пакет предыдущей роли (Аналитик Run 1/5 → Run 5/5)
- [`01_КП/LAUNCH-QA-KP.md`](LAUNCH-QA-KP.md) — пакет QA-валидатора для результатов Аналитика (READ-only роль, breaking-test обязателен)
- [`01_КП/LAUNCH-ARCHITECT.md`](LAUNCH-ARCHITECT.md) — пакет Архитектора (декомпозиция МОДУЛЬ-КП в 20 STUB, PSL-004)
- `01_КП/LAUNCH-UX.md` — **TBD** (нужно подготовить, зеркальная структура этого пакета для UX-роли; следующая после QA-петли)
- `99_СПРАВОЧНИКИ/LAUNCH-QA-MODELER.md` — **TBD** (нужно подготовить для QA-петли после Моделировщика; mirror LAUNCH-QA-KP.md, проверяет 32 модели + ON DELETE правила)

### 7.2 Агентская инфраструктура

- [`AGENT-ROLES.md` §2.3](../../AGENT-ROLES.md) — зона ответственности Моделировщика (тип + FK + ON DELETE; НЕ бизнес-правила / UX / RBAC)
- [`AGENT-ROLES.md` §3 Правило 3.1](../../AGENT-ROLES.md) — полный цикл pipeline с QA-петлёй
- [`AGENT-METHOD.md` §5.2.1-5.2.2](../../AGENT-METHOD.md) — STUB-исключение (СТРОГО ЗАПРЕЩЕНО трогать 04-rbac.md и другие STUB Аналитика после Run 1)
- [`AGENT-FORMAT.md` §1 Принцип П7](../../AGENT-FORMAT.md) — поля с типами обязательны
- [`AGENT-FORMAT.md` §3](../../AGENT-FORMAT.md) — таблицы всегда с шапкой (для `Модель | Поле | Тип | ON DELETE` таблиц)
- [`AGENT-FORMAT.md` §5 анти-паттерны A1-A11](../../AGENT-FORMAT.md) — без кода (допускается только Counter safe-increment псевдо-код, ~10 строк) / без воды / без длинных вводных
- [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md) — hard limit 400 строк + правила split
- `AGENT-PROMPTS.md` §3 «Моделировщик данных» — канонический шаблон промпта (базовая 4-строчная версия; здесь расширена в §2)

### 7.3 Входы (что читать)

- [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) — **🔴 P0 ВХОД** (32 сущности, 17 enum-типов / ~22 enum-а, 60+ FK, safe-increment, миграционный план)
- [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — 15 зафиксированных СПОР (особенно СПОР-9, СПОР-13, СПОР-14)
- [`99_Справочники/OPEN-QUESTIONS-MASTER.md`](../../99_Справочники/OPEN-QUESTIONS-MASTER.md) — 38 ✅ ПРИНЯТО решений (проверка непротиворечивости)
- [`01_КП/04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md) — 9 групп инвариантов Аналитика Run 1 → покрываются CHECK constraints в схеме
- [`01_КП/03-zhiznennyj-cikl/03-statusy.md`](../03-zhiznennyj-cikl/03-statusy.md) — 8 статусов КП → проверка `Proposal.status` enum

### 7.4 PSLs и журнал

- [`PROJECT-STATE-LOG.md` §0](../../PROJECT-STATE-LOG.md) — шаблон записи PSL-NNN
- [`PROJECT-STATE-LOG.md` §1](../../PROJECT-STATE-LOG.md) — сюда пишется PSL-009 после прогона Моделировщика (выше актуальных записей)
- [`CHECKLIST.md` §3](../../CHECKLIST.md) — обновится: «Последняя запись PSL: PSL-009» после успешного прогона
- [`CHECKLIST.md` §4](../../CHECKLIST.md) — таблица ролей (строка «Моделировщик» теперь указывает на готовый `LAUNCH-MODELER.md` ✅)

---

## 8. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Создание launch-пакета для роли «Моделировщик данных» (Pipeline v6, роль 3). Зеркалирует структуру `LAUNCH-ANALYST.md` (8 разделов), учитывает специфику Prisma-схемы: 32 модели, 60+ FK ON DELETE, snapshot-поля, Counter safe-increment, Refund vs Payment развязку, 17 enum-типов (~22 enum-а total). Минимальный attach-list (9 файлов). 5 фокусных блоков + 9 edge cases (A-I: ON DELETE, soft-delete uniform, snapshot, Counter safe-increment, UNIQUE StockRecord, 4 новые сущности Склада v6, Refund vs Payment, CHECK constraints, Enums). 11 CHECK-листов самопроверки. Пост-обработка с обязательной QA-петлёй (Правило 3.1) перед переходом к UX (`LAUNCH-UX.md` — нужно подготовить). **Принят `⚠️ HARD LIMIT OVERRIDE`** (PSL-003 аналогия для BIG-BOOK.md): 455 строк > 400 hard limit, оправдан уникальностью (32 модели + 9 edge cases не делятся на 2 файла без потери контекста). |
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb
