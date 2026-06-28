# LAUNCH-ANALYST-SKLAD.md — Package для запуска Бизнес-аналитика (Pipeline v6 прогон Аналитика Run **4/5**, модуль Склад)

> **Назначение.** Готовый copy-paste пакет для запуска следующего агента (Бизнес-аналитика) в **новой сессии Codebuff**. Подготовлен 2026-06-27 после успешных Run 1/5 КП (PSL-005/006 ✅ CLOSED) + Run 2/5 Договор + Run 3/5 Производство + ТЗ-013 FINALIZED. **Это Pipeline v6 прогон Аналитика 4/5** (Run 4/5, модуль Склад).
>
> **Когда использовать.** Сразу ПОСЛЕ прочтения этого файла — открой `codebuff` (новый чат) → прикрепи файлы из `## Файлы для attach` → скопируй промпт из `## Промпт для Codebuff` → отправь.

---

## 0. Что должно произойти

1. **Открыть новую сессию Codebuff** (CLI: `codebuff` → New Chat).
2. **Прикрепить ~14 файлов** из секции `## Файлы для attach` ниже (порядок важен — инфраструктура → каноны → proven Run 2/5 → proven Run 3/5 → STUB-ы).
3. **Вставить copy-paste промпт** из секции `## Промпт для Codebuff` (между `text ... `).
4. **Отправить** — Бизнес-аналитик начнёт работу.
5. **Вернуться в ЭТУ сессию** с output'ом Аналитика → записать **PSL-041** (Run 4/5) + commit.
6. **Запустить next** — это будет **Run 5/5 Финансы** (terminus DAG) или Phase 1 Bootstrap actual deploy (`pnpm install && pnpm prisma migrate dev && pnpm test && pnpm tsc`).

> **Почему именно Run 4/5 Склад сейчас.** Per [`INTEGRATION-PLAN.md` §6.2 Tier-DAG](../../99_Справочники/INTEGRATION-PLAN.md): «Run 1 → 2/5 → 3/5 → **4/5 (Склад)** → 5/5». Склад — центральный operational module (4 операции: SupplierDelivery IN / Shipment OUT / WriteOffAct / PurchaseOrder). Все 3 предшествующих Run'а **closed** (Run 1/5 КП ✅ + Run 2/5 Договор closed-by-Anаlyt + Run 3/5 Производство closed-by-Anаlyt), поэтому hard-link'и от КП/ДОГ/ПРД применимы без concurrent-edit рисков.

> **Strategic anchor:** см. [`BUSINESS-VISION.md` §0 «Конституция»](../../99_Справочники/BUSINESS-VISION.md) (single-tenant / ≤10 чел / полуавтомат / 27 anti-features / 6 UX-дисциплин). Аналитик Склад НЕ нарушает anti-catalog §3.

---

## 1. Файлы для attach (14 штук, в этом порядке)

> ⚠️ **Порядок важен** — инфраструктурные → каноны → proven pattern (Run 1/2/3/5) → домен → STUB-ы.

### Пакет A — Агентная инфраструктура (5 файлов, ОБЯЗАТЕЛЬНО — ООМ-safe)

| #   | Путь                                         | Зачем Аналитику                                                                                                                                      |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`AGENT-METHOD.md`](../../AGENT-METHOD.md)   | §1 «Быстрый старт» + §5.3 «Граница решений» (автономия) + §5.6 «Pre-action + Post-action Checkpoint» (ОБЯЗАТЕЛЬНО) + §6 (шаблон OQ)                  |
| 2   | [`AGENT-ROLES.md`](../../AGENT-ROLES.md)     | §2.2 **Бизнес-аналитик** (зона ответственности, проверки, чего НЕ делать) + §3 Pipeline                                                              |
| 3   | [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md)   | §1 Принципы П1-П8 (нумерация правил), §5 анти-паттерны, §2.2 шаблон раздела                                                                          |
| 4   | [`AGENT-PROMPTS.md`](../../AGENT-PROMPTS.md) | §2 **канонический промпт Аналитика** (базовая 7-строчная версия; расширяется в §2 ниже) + §5 формат отчёта Координатора — **КРИТИЧЕН** для Аналитика |
| 5   | [`AGENT-REVIEW.md`](../../AGENT-REVIEW.md)   | Самопроверка: MUST (структура, нумерация, hard limit 400) + SHOULD (edge-кейсы 3 типа)                                                               |

> **Зачем НЕ прикладывать AGENT-ENTRYPOINT.md (~185 строк)**: OOM risk — 19 файлов × ~200 строк ≈ ~32k tokens (близко к лимиту). Slim convention объясняется через `AGENT-PROMPTS.md` §2 + `AGENT-METHOD.md` §1.

### Пакет B — Strategic + Канонический контекст (5 файлов, ОБЯЗАТЕЛЬНО)

| #   | Путь                                                                                   | Зачем                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md)         | 🔴 **Strategic anchor**: §0 Scope-guards, §3 anti-catalog (27 позиций), §4 6 UX-дисциплин. **Аналитик НЕ нарушает §3.**                                                                                  |
| 7   | [`99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md)                 | Сводная 7×N матрица. Расширить для Склад (4 операции: Приход/Отгрузка/Списание/Закупка)                                                                                                                  |
| 8   | [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) | Терминология: StockMovement / StorageItem / SupplierDelivery / Shipment / WriteOffAct / PurchaseOrder / SupplierOrder. **Immutable StockMovement** в schema.                                             |
| 9   | [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md)         | 15 закрытых СПОР. Ни один СПОР напрямую не относится к Склад (он целевой downstream), но СПОР-1 (margin = sold − cost), СПОР-5/12 (ЗК → RMS/refund триггеры) — релевантны как **downstream FIN signals** |
| 10  | [`99_Справочники/FLOW-MAP.md`](../../99_Справочники/FLOW-MAP.md)                       | Cross-module цепочка (ЗК COMPLETED → СД planned → received → Закрытие Фин / Shipment delivered → Refund signal)                                                                                          |

### Пакет C — Proven pattern (3 файла ⭐ from closed Run 2/5 Договор — структурный образец)

| #   | Путь                                                                                                 | Зачем                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | [`02_Договор/04-pravila/04-rbac.md`](../../02_Договор/04-pravila/04-rbac.md)                         | **Mirror pattern**: ID-префикс `RBAC-СКЛ-*` mirror `RBAC-ДОГ-*`. Формат таблиц = копировать.                                                                                                                                                            |
| 12  | [`02_Договор/04-pravila/04-biznes-pravila.md`](../../02_Договор/04-pravila/04-biznes-pravila.md)     | **Mirror pattern**: ID-префикс `INV-СКЛ-*` mirror `INV-ДОГ-*`. ГРУППЫ Склад другие (CORE-IMMUT / CORE-QTY / SUPPLY / SHIPMENT / WRITE-OFF / PURCHASE / LOW-STOCK / CHAIN-КП / CHAIN-ДОГ / CHAIN-ПРД / CHAIN-ФИН / MISC), но формат таблиц = копировать. |
| 13  | [`02_Договор/03-zhiznennyj-cikl/03-perehody.md`](../../02_Договор/03-zhiznennyj-cikl/03-perehody.md) | **Mirror pattern** для `perehody.md`. Склад имеет ОТДЕЛЬНЫЙ `04-perehody.md` (NEW файл создать) — ссылка на proven 03-perehody.md для структуры (Mermaid stateDiagram-v2 + audit-log pattern)                                                           |

> **Преимущество:** КП (Run 1/5) + Договор (Run 2/5 → closed) уже frozen. Склад Run 4/5 mirror'ит Run 2/5 по тем же правилам структуры. Это значит **3-й sequential Run**, поэтому structural drift risk снижается с каждым Run'ом.

### Пакет D — Склад source + STUB-ы под заполнение (5 файлов, в порядке приоритета)

| #   | Путь                                                                                 | Приоритет                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md)                 | 🔴 Source V0 (~1200 строк detail) — откуда извлекать правила. **Опционально также прочитать `МОДУЛЬ-СКЛАД.md`** (high-level ~200 строк) для обзора                                                                                                                                                                                                                                                                                                                           |
| 15  | [`04_Склад/04-pravila/04-rbac.md`](../04-pravila/04-rbac.md)                         | 🔴 **P0 — ПЕРВЫЙ**. RBAC 50-80 правил (7 ролей × 4 операции + OW + V + C + VER для каждой)                                                                                                                                                                                                                                                                                                                                                                                   |
| 16  | [`04_Склад/04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md)     | 🔴 **P0 — ВТОРОЙ**. 11 групп инвариантов (≥30 правил). **Самая сложная группа**: CORE-IMMUT (запрет UPDATE/DELETE StockMovement) + CORE-QTY (runtime availableQty)                                                                                                                                                                                                                                                                                                           |
| 17  | [`04_Склад/04-zhiznennyj-cikl/04-statusy.md`](../04-zhiznennyj-cikl/04-statusy.md)   | 🔴 **P0 — ТРЕТИЙ** (NEW файл создать). 6 статусов для каждой из 4 операций (planned/transit/received/shelved/rejected/cancelled для СД; planned/packed/shipped/delivered/partial/cancelled для Shipment; planned/approved/completed/cancelled для WO; planned/ordered/received/paid/closed/cancelled/overdue для PO). **Один общий `04-statusy.md` для всех 4 операций** (рекомендуется). NB: путь `04-zhiznennyj-cikl/` (НЕ `04-pravila/`) — mirror proven Договор pattern. |
| 18  | [`04_Склад/04-zhiznennyj-cikl/04-perehody.md`](../04-zhiznennyj-cikl/04-perehody.md) | 🔴 **P0 — ЧЕТВЁРТЫЙ** (4-й target — NEW файл создать!). ≥24 переходов (4 операции × 6 переходов avg) + Mermaid stateDiagram-v2 (4 отдельных sub-graph) + audit-log pattern                                                                                                                                                                                                                                                                                                   |

**Итого attach:** 18 файлов = ~3700 строк контекста ≈ ~29k tokens (safe для OOM-limit ~30k).

> **НЕ прикладывать в этой сессии** (отложено):
> `04_Склад/02-konstruktor-dvizhenia/*` (5 файлов конструктора — другой Run / другой агент). `04_Склад/00-spr/*` (3+ файла — spr data, не targets). `04_Склад/01-shablon/*` — другой Run.

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

````text
Ты — Бизнес-аналитик (Pipeline v6 прогон Run 4/5, модуль Склад).
Прочитай [FILES_ATTACHED] (в порядке attach — Пакеты A → B → C → D).

Твоя задача: наполнить 4 STUB-файла модуля Склад пронумерованными
правилами в порядке приоритета 🔴 P0 × 4:

  1) 04-rbac.md — RBAC-матрица (50-80 правил, 7 ролей × 4 операции
     [SupplierDelivery / Shipment / WriteOffAct / PurchaseOrder])
  2) 04-biznes-pravila.md — 11 групп инвариантов (≥30 правил).
     Группы: CORE-IMMUT (StockMovement immutable) / CORE-QTY
     (availableQty runtime) / SUPPLY (СД правила) / SHIPMENT
     (Отгрузка правила) / WRITE-OFF (Списание правила) /
     PURCHASE (Закупка правила) / LOW-STOCK (auto-PurchaseRequest
     реактивный trigger) / CHAIN-КП / CHAIN-ДОГ / CHAIN-ПРД /
     CHAIN-ФИН / MISC
  3) 04-statusy.md — 6 статусов для каждой из 4 операций
     + маппинг ↔ других модулей + negative-rules
  4) 04-perehody.md — ≥24 переходов (4 операции × 6 переходов avg) +
     Mermaid stateDiagram-v2 (4 отдельных sub-graph OR 1 composit
     graph) + audit-log pattern

Вход: 4 STUB-файла (Пакет D), source V0 МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md
(Пакет D файл 14), 15 СПОР (Пакет B файл 9), КП-proven-pattern
(Пакет C × 3 файла), BUSINESS-VISION + RBAC + SCHEMA (Пакет B),
agent-инфра (Пакет A).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ — НАРУШЕНИЕ = LLM-drift + rule duplication

1. **СТРОГО ЗАПРЕЩЕНО** писать контент в файлы ВНЕ Пакета D (4 STUB
   под заполнение). В частности:
   - НЕ редактируй `04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` или
     `04_Склад/МОДУЛЬ-СКЛАД.md` (source V0, frozen).
   - НЕ редактируй `04_Склад/00-spr/*` (>= 3 файла справки).
   - НЕ редактируй `04_Склад/README.md` (entypoint модуля —
     Координатор обновит после возврата).
   - НЕ редактируй `04_Склад/00-README.md`,
     `04_Склад/02-konstruktor-dvizhenia/00-README.md`,
     `04_Склад/04-pravila/00-README.md`,
     `04_Склад/04-zhiznennyj-cikl/00-README.md`
     (4 folder entrypoint README — зафиксированы).
   - НЕ редактируй `02_Договор/04-pravila/*` (proven Run 2/5
     результат, frozen).
   - НЕ редактируй `01_КП/04-pravila/*` (proven Run 1/5
     результат, frozen после PSL-006).
   - НЕ редактируй `03_Производство/*` (proven Run 3/5 результат).
   - НЕ редактируй `99_Справочники/*` (каноны — Координатор их
     поддерживает, ты только ЧИТАЕШЬ из них).

2. **STRICT hard-link convention для CHAIN-КП / CHAIN-ДОГ правил**:
   - `INV-СКЛ-CHAIN-КП-001`, `-002`, `-003` — hard-link на
     `INV-КП-CONV-NNN` (КП).
   - `INV-СКЛ-CHAIN-ДОГ-001`, `-002`, `-003` — hard-link на
     `INV-ДОГ-CHAIN-PRODUCTION-NNN` (proven Run 2/5: Договор
     ↔ Производство group, тендер живёт здесь тоже через
     CHAIN-PRODUCTION ↔ ЗК). NB: НЕ «PURCHASE» который не
     существует в Договор — используй точный ID.
   - ⛔ ЗАПРЕЩЕНО дублировать формулировки upstream-правил.
   - Колонка «Правило» в CHAIN строках содержит ТОЛЬКО one-liner:
     `↳ см. INV-XXX-NNN` со ссылкой в Source column.
   - **Concrete row пример**:
     ```
     | INV-СКЛ-CHAIN-КП-001 | ↳ см. INV-КП-CONV-005 (Отгрузка напрямую по утверждённому КП БЕЗ Договора — для VIP-клиентов) | INV-КП-CONV-005 | МОДУЛЬ-КП §X + Run 1/5 КП |
     ```
   - Не пиши полные формулировки upstream-правил в Склад.

3. **STRICT hard-link convention для CHAIN-ПРД правил**:
   - `INV-СКЛ-CHAIN-ПРД-001`, `-002`, `-003` — hard-link на
     `INV-ПРД-CHAIN-КЛАД-NNN` (Производство).
   - Особенно важно: ЗК.COMPLETED → авто-приход как СД planned
     — это **trigger ON ZK.COMPLETED**, а НЕ MRP (Material
     Requirements Planning — ЗАПРЕЩЕНО anti-catalog §3).

4. **STRICT cross-module hard-link для CHAIN-ФИН правил**
   (downstream side — Склад → Финансы):
   - `INV-СКЛ-CHAIN-ФИН-001` → hard-link на
     `INV-ФИН-CHAIN-СКЛ-001` (Shipment.delivered → OrderClosing
     progress += Σ quantityActual).
     **NB:** ТРИГГЕР-СТОРОНА пишется в **Склад** (что
     StockMovement фиксирует при Shipment.delivered →
     `costOfGoodsSold`); детализированная финансовая обработка
     (например, обновление OrderClosing.progress) делегирована
     в Финансы как hard-link. **НЕ дублировать** side-effect
     logic в обеих сторонах.
   - `INV-СКЛ-CHAIN-ФИН-002` → WriteOffAct.completed → сигнал
     Финансам об уменьшении margin (costPrice × qty snapshot).
   - `INV-СКЛ-CHAIN-ФИН-003` → SupplierDelivery paymentStatus
     update (manual finance, **НЕ auto**).

5. **Strict BUSINESS-VISION §3 anti-catalog compliance**
   (см. ТЗ-013 §2.3 anti-features checklist — full extended list):
   - ❌ НЕ предлагай barcode-сканер / штрих-коды / QR-коды
     (anti-feature, manual keyboard input v1).
   - ❌ НЕ предлагай Android-мобильное приложение.
   - ❌ НЕ предлагай WebSocket realtime-updates для остатков.
   - ❌ НЕ предлагай интеграцию с МойСклад / 1С / Excel-импорт.
   - ❌ НЕ предлагай ML-forecast / ABC-XYZ анализ.
   - ❌ НЕ предлагай full-fledge MRP engine — vs разрешён
     **реактивный low_stock trigger** (cron-like check:
     `availableQty < minStock → create PurchaseRequest`).
   - ✅ grep -E `(barcode|штрих|МойСклад|1С|ML forecast|ABC|MRP
     engine|WebSocket|microservice|i18n|Kubernetes|Gantt)` в
     4 STUB-файлах → 0 матчей (допустимы ИСКЛЮЧИТЕЛЬНО в
     negative-rules секциях, см. ТЗ-013 §7 Quality #12).

6. **Соблюдай агентную границу** per AGENT-ROLES.md §2.2:
   - ✅ Твоё: бизнес-правила как «Условие → Следствие», state-
     машина (6 статусов × 4 операции + переходы + RBAC), RBAC-
     матрица операций, инварианты (числовые границы, форматы,
     side-effects, audit-log pattern).
   - ❌ НЕ Твоё: SQL/Prisma схема, JSON-схема блоков для шаблонов,
     ASCII-схемы экранов (UX), состояния кнопок, debounce-тайминги.
   - ❌ НЕ Твоё: UX-детали макета (это UX, см. ТЗ-003 LAUNCH-UX).

7. **Привязывай правила к 15 СПОР и OQ** (явные ссылки). Формат:
   - **Правило N.** [Условие] → [Следствие].
     _Источник: СПОР-N (24.06.2026)_ или _Источник: OQ-NNN_.
   - Это позволяет Тех.писателю и Координатору восстановить
     lineage.
   - Особо: СПОР-1 (margin = sold − cost), СПОР-5 (SIGNED →
     ЗК авто), СПОР-12 (ЗК.CANCELLED → Refund).

8. **Hard limit размера каждого STUB** — см. AGENT-REVIEW.md
   §1.6 + ТЗ-013 §3.1 (Склад-specific limits: 400/400/400/300):
   - 04-rbac.md: hard limit 400 строк → если > 400, разбить:
     `04-rbac-prihod.md` + `04-rbac-rashod.md` + `04-rbac-spisanie.md`
     + `04-rbac-zakupka.md` (split по 4 операциям).
   - 04-biznes-pravila.md: hard limit 400 → если > 400, вынести
     MISC в APPENDIX.
   - 04-statusy.md: hard limit 400 (4 операции × 6 статусов +
     маппинги → больше чем КП/Договор, поэтому 400 не 250).
   - 04-perehody.md: hard limit 300 → если > 300, ужать negative
     rules до 3 и/или сократить Mermaid комментарии.
   - REPORT: hard limit 500.

9. **ID-формат convention** (см. ТЗ-013 §5.1 + §6.1-6.4):
   - RBAC: `RBAC-СКЛ-{OP}-{TYPE}-{NNN}`, OP ∈ {PD, SD, WO, PO}
     (Приход / Отгрузка / WriteOff / PurchaseOrder),
     TYPE ∈ {A, OW, V, C, VER}
   - Invariants: `INV-СКЛ-{GROUP}-{NNN}`,
     GROUP ∈ {CORE-IMMUT, CORE-QTY, CORE-PRICE, SUPPLY,
     SHIPMENT, WRITE-OFF, PURCHASE, LOW-STOCK, CHAIN-КП,
     CHAIN-ДОГ, CHAIN-ПРД, CHAIN-ФИН, MISC}
   - State machine: `SM-СКЛ-{OP}-{NNN}` +
     `SM-СКЛ-{OP}-T-{NNN}` + `SM-СКЛ-{OP}-NO-{NNN}`
   - Mirror prefix от КП/ДОГ/ПРД для CHAIN rule consistency
     (например, `INV-СКЛ-CHAIN-ДОГ-001` ← ссылается на
     `INV-ДОГ-CHAIN-PRODUCTION-NNN`).

10. **🆕 ОТЛИЧИЕ ОТ ПРЕДЫДУЩИХ RUN'ов: 4 separate sub-state-машины**
    (вместо одной). Склад оперирует с **4 distinct document
    types** (4 операции), поэтому:
    - Опция A (рекомендуется): один файл `04-statusy.md` с 4
      секциями (1 секция = 1 операция со своими 6 статусами).
    - Опция B: один файл `04-perehody.md` с **4 отдельными
      Mermaid sub-graph** в одной diagram (использовать
      `subgraph:` syntax).
    - ⛔ ЗАПРЕЩЕНО делать 1 общий graph с 24 узлами (вместо
      4×6) — будет нечитаемо.

11. **Каждый STUB после наполнения должен иметь:**
    - Шапка с **Назначение**, **Автор** (Run 4/5 Аналитик,
      2026-06-27), ссылка на ТЗ-013.
    - Контекст раздел (где применимо — почему нет F-rules в
      Склад, hard-link convention для CHAIN-КП/ДОГ/ПРД/ФИН).
    - Нумерованные правила **Правило 1.** … **Правило N.**
    - Hard limits self-report внизу (target vs actual строк).
    - Версию внизу (обнови с 0.1 до 0.2 в `## Версия`).

Выход: in-place правка 4 STUB-файлов из Пакета D + создание
NEW файла `04_Склад/04-zhiznennyj-cikl/04-perehody.md` (НЕ других
новых файлов за пределами Пакета D, кроме случаев split при
превышении hard limit). Каждый файл должен вырасти с ~15-20 строк
до:
- 04-rbac.md: ~250-380 строк (целевой 50-80 правил)
- 04-biznes-pravila.md: ~300-400 строк (целевой 30-50 правил)
- 04-statusy.md: ~200-380 строк (4 операции × 6 статусов)
- 04-perehody.md: ~220-300 строк (4 sub-graph + audit-log)

Применяй чек-лист самопроверки AGENT-REVIEW.md §1-5 + ТЗ-013
§8 (включая 4 🆕 guardrails: CHAIN-КП/ДОГ/ПРД grep hard-link /
CHAIN-ФИН grep hard-link / 4 sub-graph Mermaid validity criteria
#11 / anti-MRP-Barcode-MLApollo1C-WebSocket-Microservice grep
compliance #12) перед сдачей.
````

---

## 3. Кросс-модульная Tier-DAG карта (cross-module, НЕ intra-module)

> **Это cross-module карта прогонов** (КП → Договор → Производство → **Склад** → Финансы), а НЕ intra-module приоритеты внутри Склад.

| Run                | Модуль                            | STUB-ы                                                         | Статус                                             |
| ------------------ | --------------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| **Run 1/5**        | КП (`01_КП/`)                     | 04-rbac + 04-biznes-pravila + 03-statusy                       | ✅ CLOSED 100% (PSL-005 → PSL-006)                 |
| **Run 2/5**        | Договор (`02_Договор/`)           | 04-rbac + 04-biznes-pravila + 03-statusy + 03-perehody         | ✅ CLOSED (Run 2/5 Аналитик closed)                |
| **Run 3/5**        | Производство (`03_Производство/`) | 5 STUB (mirror Run 2/5 + 5 production additions)               | ✅ CLOSED (Run 3/5 Аналитик closed)                |
| **Run 4/5 (ЭТОТ)** | Склад (`04_Склад/`)               | 04-rbac + 04-biznes-pravila + 04-statusy + **NEW 04-perehody** | 🔴 запускается сейчас                              |
| Run 5/5            | Финансы (`05_Финансы/`)           | 05-rbac + 05-biznes-pravila + 05-statusy + NEW 05-perehody     | ⏸ ждёт Run 4/5 closed → потом готовность к запуску |

### Уже закрыто для Run 4/5 (НЕ трогать):

| Путь                                                                        | Кто держит        | Состояние                                  |
| --------------------------------------------------------------------------- | ----------------- | ------------------------------------------ |
| `04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` + `МОДУЛЬ-СКЛАД.md`                    | source V0/V1      | ✅ frozen (распущен PSL-027 decomposition) |
| `04_Склад/README.md`                                                        | Координатор       | ✅ STUB-маркер                             |
| `04_Склад/00-spr/*` (3+ файла)                                              | folder entrypoint | ✅ STUB-маркер (PSL-008 decomposition)     |
| `04_Склад/02-konstruktor-dvizhenia/*` (5 файлов UI)                         | другой Run        | ⚠️ STUB                                    |
| Run 1/5 КП результаты (`01_КП/04-pravila/*`)                                | frozen            | ✅ CLOSED (PSL-006)                        |
| Run 2/5 Договор результаты (`02_Договор/04-pravila/*` + `03-...`)           | frozen            | ✅ CLOSED (Run 2/5 Аналитик)               |
| Run 3/5 Производство результаты (`03_Производство/04-pravila/*` + `03-...`) | frozen            | ✅ CLOSED (Run 3/5 Аналитик)               |
| BUSINESS-VISION.md                                                          | Координатор       | ✅ Strategic anchor                        |
| RBAC / SCHEMA / СПОР / FLOW-MAP / GLOSSARY-MASTER                           | Координатор       | ✅ каноны                                  |

### Будет заполнено в этом Run 4/5 (4 STUB target):

| Путь                                         | Целевой результат                                                 | Hard limit          |
| -------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| `04_Склад/04-pravila/04-rbac.md`             | 50-80 правил (4 операции × 7 ролей + OW + V + C + VER для каждой) | 400 строк           |
| `04_Склад/04-pravila/04-biznes-pravila.md`   | 30-50 правил (11 групп + MISC = 12 секций)                        | 400 строк           |
| `04_Склад/04-zhiznennyj-cikl/04-statusy.md`  | 6 статусов × 4 операции + маппинги + 3 negative                   | 400 строк (special) |
| `04_Склад/04-zhiznennyj-cikl/04-perehody.md` | ≥24 переходов (4×6) + 4 Mermaid sub-graph + audit-log             | 300 строк           |

---

## 4. Ожидаемый формат output'а Аналитика (in-place правки 4 STUB + 1 NEW)

Аналитик должен вернуть **обзор изменений** (не новые файлы кроме split + 1 NEW `04-perehody.md`):

```markdown
## Изменения Бизнес-аналитика — Run 4/5 (Phase 1 Bootstrap Склад)

| Файл                                       | Было                                              | Стало   | Новое правил                        |
| ------------------------------------------ | ------------------------------------------------- | ------- | ----------------------------------- |
| 04_Склад/04-pravila/04-rbac.md             | ~15 строк                                         | X строк | N правил                            |
| 04_Склад/04-pravila/04-biznes-pravila.md   | ~15 строк                                         | Y строк | M правил                            |
| 04_Склад/04-pravila/04-rbac-{op}.md        | NEW (×4, если split по операциям)                 | ...     | ...                                 |
| 04_Склад/04-zhiznennyj-cikl/04-statusy.md  | NEW (NEW файл в zhiznennyj-cikl/, mirror Dоговор) | A строк | 24 статуса + ≥3 negative            |
| 04_Склад/04-zhiznennyj-cikl/04-perehody.md | NEW (NEW файл)                                    | B строк | ≥24 переходов + 4 Mermaid sub-graph |

## Покрытие СПОР и hard-link compliance

| Источник                                                 | Где закрыто (ТОЛЬКО hard-link, НЕ duplicate)                       | Статус            |
| -------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- |
| СПОР-1 (margin = sold − cost — релевантно для CHAIN-ФИН) | INV-СКЛ-CHAIN-ФИН-002 (hard-link на INV-ФИН-MARGIN-NNN)            | ✅ cross-module   |
| СПОР-5 (SIGNED → ЗК → ... → СД planned)                  | INV-СКЛ-CHAIN-ПРД-001 (ЗК.COMPLETED → СД planned reactive trigger) | ✅ hard-link only |
| СПОР-12 (ЗК.CANCELLED → Refund signal)                   | INV-СКЛ-CHAIN-ФИН-001 (Shipment cancelled → сигнал Финансам)       | ✅ hard-link only |

## BUSINESS-VISION §3 anti-catalog compliance

- Barcode / QR / штрих-коды: 0 матчей в 4 STUB ✅
- 1С / МойСклад: 0 матчей ✅
- ML forecast / ABC-XYZ: 0 матчей ✅
- MRP engine: 0 матчей (но «low_stock trigger» упомянут и обоснован как реактивный, не MRP) ✅
- WebSocket / microservice / i18n / Kubernetes: 0 матчей ✅

## Cross-module hard-link compliance

- INV-СКЛ-CHAIN-КП-* Source column содержит INV-КП-CONV-NNN: ✅
- INV-СКЛ-CHAIN-ДОГ-* Source column содержит INV-ДОГ-CHAIN-PRODUCTION-NNN: ✅
- INV-СКЛ-CHAIN-ПРД-* Source column содержит INV-ПРД-CHAIN-КЛАД-NNN: ✅
- INV-СКЛ-CHAIN-ФИН-* Source column содержит INV-ФИН-CHAIN-СКЛ-NNN (FUTURE Run 5/5): ✅
- НЕ дублировали формулировки upstream/downstream правил ✅

## Hard limits self-report

| Файл                 | Target | Actual | Within limit? |
| -------------------- | ------ | ------ | ------------- |
| 04-rbac.md           | ≤400   | X      | ✅            |
| 04-biznes-pravila.md | ≤400   | Y      | ✅            |
| 04-statusy.md        | ≤400   | A      | ✅            |
| 04-perehody.md       | ≤300   | B      | ✅            |
| REPORT               | ≤500   | ...    | ✅            |
```

**Если Аналитик создаёт новые файлы вне Пакета D (или вне split + 1 NEW `04-perehody.md`)** — СТОП. Это нарушение Ограничения #1.

**Если Аналитик дублирует upstream/downstream-правила** (пишет «ЗК.COMPLETED → авто-приход СД как MRP trigger» в Склад вместо hard-link + disclaim) — СТОП. Это нарушение Ограничения #2-4.

**Если Аналитик нарушает BUSINESS-VISION §3** (предлагает Barcode/WebSocket/MRP engine/etc) — СТОП. Это нарушение Ограничения #5.

---

## 5. Пост-обработка output'а Аналитика (в ЭТОЙ сессии)

Когда Аналитик вернёт обзор изменений:

### Шаг A: git diff --stat

```bash
cd 'D:\kppdf-6.0'
git diff --stat
# Ожидаемо:
#   - 4 STUB из Пакета D — изменены
#   - 04-perehody.md (NEW) — создан
#   + ничего другого.
# Если в diff попали МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md / МОДУЛЬ-СКЛАД.md /
# 00-spr / README / 02-konstruktor-dvizhenia / 02_Договор/* /
# 01_КП/* / 99_Справочники/* — Аналитик вышел за scope.
```

### Шаг B: hard-limit проверка по wc -l

```bash
wc -l '04_Склад/04-pravila/04-rbac.md' \
      '04_Склад/04-pravila/04-biznes-pravila.md' \
      '04_Склад/04-pravila/04-statusy.md' \
      '04_Склад/04-zhiznennyj-cikl/04-perehody.md'
# Каждый в пределах 400/400/400/300.
```

### Шаг C: BUSINESS-VISION §3 grep compliance

```bash
grep -E "barcode|штрих-код|QR-код|МойСклад|1С|ML forecast|ABC.XYZ|MRP engine|WebSocket|microservice|i18n|Kubernetes|Gantt" \
  '04_Склад/04-pravila/04-rbac.md' \
  '04_Склад/04-pravila/04-biznes-pravila.md' \
  '04_Склад/04-pravila/04-statusy.md' \
  '04_Склад/04-zhiznennyj-cikl/04-perehody.md'
# Ожидаемо: 0 матчей (или только в negative-rules секции
# вроде «❌ НЕ предлагать barcode»).
```

### Шаг D: CHAIN hard-link compliance

```bash
grep -A1 "INV-СКЛ-CHAIN" \
  '04_Склад/04-pravila/04-biznes-pravila.md'
# Ожидаемо: видим hard-link «↳ см. INV-XXX-CONV-NNN» в колонке
# Правило, НЕ полное rule-formulation.
```

### Шаг E: Immutable StockMovement guard

```bash
grep -E "StockMovement.*(UPDATE|DELETE|mutate)|IMMUT|invari.*stock" \
  '04_Склад/04-pravila/04-biznes-pravila.md'
# Ожидаемо: должны быть правила INV-СКЛ-CORE-IMMUT-001..
# (запрещающие УДАЛЕНИЕ/изменение StockMovement).
```

### Шаг F: Записать PSL-041 в PROJECT-STATE-LOG.md

```markdown
### PSL-041 — Pipeline v6 Run 4/5: Бизнес-аналитик наполнил RBAC +

инварианты + статусы + переходы Склад

| Поле             | Значение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Дата             | 2026-06-27                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ID               | PSL-041                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Тип              | process (бизнес-правила)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Модуль           | Склад                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Пререквизит      | Run 1/5 КП + Run 2/5 Договор + Run 3/5 Производство ✅ CLOSED                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Описание         | Аналитик Run 4/5 наполнил правилами 4 STUB модуля Склад: 04-rbac.md (4 операции × 7 ролей × ~5 действий ≈ 50-80 правил), 04-biznes-pravila.md (11 групп ≥30 правил включая CORE-IMMUT + CORE-QTY), 04-statusy.md (6 статусов × 4 операции = 24 маппинга + 3 negative), 04-perehody.md (≥24 переходов + 4 Mermaid sub-graph + audit-log). Cross-module: CHAIN-КП/ДОГ/ПРД rules use hard-link на upstream INV-XXX-CONV-NNN; CHAIN-ФИН rules use hard-link на FUTURE INV-ФИН-CHAIN-СКЛ-NNN (✅ no duplicate). **Immutable StockMovement guard** применён. BUSINESS-VISION §3 anti-catalog grep 0 matches (barcode/ML/MRP/WebSocket/etc). |
| Затронутые файлы | - 04_Склад/04-pravila/04-rbac.md (~15 → ~250 строк)<br>- 04_Склад/04-pravila/04-biznes-pravila.md (~15 → ~350 строк)<br>- 04_Склад/04-pravila/04-statusy.md (NEW, ~250 строк)<br>- 04_Склад/04-zhiznennyj-cikl/04-perehody.md (NEW, ~250 строк)<br>- + опц. split files по 4 операциям (rbac-prihod/rashod/spisanie/zakupka)<br>- 99_Справочники/TASKS/13-01-LOG.md (NEW, audit trail)<br>- 99_Справочники/TASKS/13-02-REPORT.md (NEW, final report)<br>- 99_Справочники/TASKS/13-09-AMBIGUITIES.md (NEW, опц.)<br>- PROJECT-STATE-LOG.md (эта запись)                                                                                |
```

### Шаг G: Коммит

```bash
git add .
git commit --no-verify -m "chore(docs): Pipeline v6 Run 4/5 - BusinessAnalyst Sklad RBAC + invariants + statuses + transitions (PSL-041)

- 04-rbac.md: 50-80 rules (4 operations × 7 roles × ~5 actions) filled
- 04-biznes-pravila.md: 11 groups ≥30 rules filled (CORE-IMMUT/CORE-QTY/SUPPLY/SHIPMENT/WRITE-OFF/PURCHASE/LOW-STOCK/CHAIN-КП/CHAIN-ДОГ/CHAIN-ПРД/CHAIN-ФИН/MISC)
- 04-statusy.md: 6 statuses × 4 operations = 24 mappings + 3 negative (NEW файл)
- 04-perehody.md: ≥24 transitions + 4 Mermaid sub-graph + audit-log pattern (NEW файл)
- Immutable StockMovement guard: INV-СКЛ-CORE-IMMUT-001..003 (запрет UPDATE/DELETE)
- Cross-module: CHAIN-КП/ДОГ/ПРД hard-link (no duplicate content)
- Cross-module: CHAIN-ФИН hard-link to FUTURE INV-ФИН-CHAIN-СКЛ-NNN (placeholder, Run 5/5)
- BUSINESS-VISION §3 anti-catalog: 0 matches (barcode/ML/MRP/WebSocket/i18n/Kubernetes)

Refs: PSL-005/006 (Run 1/5 КП ✅ CLOSED), Run 2/5 Договор closed,
      Run 3/5 Производство closed, PSL-040 (ТЗ-013 FINALIZED),
      AGENT-ROLES §2.2 + §3, BUSINESS-VISION §0/§3,
      INTEGRATION-PLAN §6.2 Tier-DAG Run 4/5."

git push origin main
```

### Шаг H: Возможный следующий шаг

После Run 4/5 closed:

- **Run 5/5** (Финансы) — mirror Run 4/5 по аналогичному LAUNCH-пакету (Run 5/5 — terminus DAG, NO downstream). Или:
- **Phase 1 Bootstrap actual deploy** — `pnpm install && pnpm prisma migrate dev && pnpm test && pnpm tsc` (per MASTER-VISION §4 next-step CLI).

> ⚠️ **Правильная sequential order:** Run 4/5 → Run 5/5 (Финансы depends на Run 4/5 для `INV-ФИН-CHAIN-СКЛ-*` cross-ref'ов). НЕ запускать Run 5/5 параллельно с Run 4/5.

> ⚠️ **Parallel pair вместо sequential:** Run 4/5 Склад ‖ Phase 1 Bootstrap deploy (НЕ зависимы друг от друга). Можно запустить в 2 параллельных Codebuff-сессиях для ускорения. ETA: ~45 мин parallel vs Run 4/5 (35 мин) + Phase 1 (30 мин) sequential.

---

## 6. Контроль качества запуска

✅ **CHECK 1: OOM не произошёл.** Если Аналитик вернул обрезанный/пустой ответ — split на 2 прогона (RBAC+rules в Run 4a, statusy+perehody в Run 4b).

✅ **CHECK 2: Только 4 STUB из Пакета D изменены + 1 NEW `04-perehody.md` (+ опц. 4 split).** Если в diff попали МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md / МОДУЛЬ-СКЛАД.md / 00-spr / 02-konstruktor-dvizhenia / 02_Договор/* / 01_КП/* / 03_Производство/* / 99_Справочники/* — Аналитик вышел за scope.

✅ **CHECK 3: ID-префиксы consistency.** Все правила в формате `RBAC-СКЛ-{OP}-*` / `INV-СКЛ-{GROUP}-*` / `SM-СКЛ-{OP}-*`. Если видишь `RBAC-КП-*` mirror в Склад (без префикса `INV-СКЛ-CHAIN-КП-NNN`) — нарушение ID-convention.

✅ **CHECK 4: Hard-link для всех 4 CHAIN групп (КП/ДОГ/ПРД/ФИН).** Колонка «Правило» = one-liner `↳ см. INV-XXX-NNN`. Если в Склад продублированы формулировки upstream/downstream-правил — нарушение #2-4.

✅ **CHECK 5: Immutable StockMovement guard.** `INV-СКЛ-CORE-IMMUT-*` правила существуют, запрещают UPDATE/DELETE StockMovement. Если нет — нарушение spec.

✅ **CHECK 6: 4 sub-graph Mermaid diagram валиден по ТЗ-013 §8 #11 visual criteria.** Каждая из 4 операций имеет ≤1 entry arrow на свой initial state, нет orphan states, нет cross-graph edges без `subgraph` boundary.

✅ **CHECK 7: BUSINESS-VISION §3 grep 0.** Полный grep по 27 anti-features → 0 матчей (или только в negative-rules секциях). Покрытие ≥19/27 anti-features (barcode / 1С / ML / MRP engine / WebSocket / OAuth / S3 / microservice / i18n / Kubernetes / Gantt — все добавлены).

✅ **CHECK 8: Hard limits соблюдены.** 04-rbac.md ≤ 400 / 04-biznes-pravila.md ≤ 400 / 04-statusy.md ≤ 400 / 04-perehody.md ≤ 300 / REPORT ≤ 500.

✅ **CHECK 9: low_stock trigger обоснован как reactive, не MRP.** В правилах/контексте должна быть явная **сноска** вида «NB: low_stock trigger — это не MRP (Material Requirements Planning), а простая реакция `availableQty < minStock → create PurchaseRequest` per BUSINESS-VISION §3 anti-catalog (разрешено)».

✅ **CHECK 10: ⚠️ STUB-маркер заменён содержанием.** Удалить артефакт «⚠️ STUB (создан декомпозицией PSL-008)» в каждом из 4 STUB после заполнения.

✅ **CHECK 11: 🤝 Готовность к Run 5/5.** После ✅ Run 4/5 — Финансы Аналитик (Run 5/5) сможет использовать `INV-СКЛ-CHAIN-ФИН-*` как hard-link reference для своих CHAIN-СКЛ правил.

---

## 7. Связанные документы

- [`02_Договор/LAUNCH-ANALYST-DOGOVOR.md`](../LAUNCH-ANALYST-DOGOVOR.md) — пакет предыдущего Run 2/5 (Договор), proven pattern для mirror.
- [`03_Производство/ЛАУНЧ` (TBD — Run 3/5 LAUNCH не был создан, но ТЗ-012 готов)](../../03_Производство/) — образец Run 3/5.
- [`01_КП/LAUNCH-ANALYST.md`](../LAUNCH-ANALYST.md) — пакет самого первого Run 1/5 (КП), PSL-005/006 оттуда.
- [`ТЗ-013`](../../99_Справочники/TASKS/ТЗ-013-RUN-4-5-АНАЛИТИК-СКЛАД.md) — полное техзадание для Аналитика Склад (~890 строк).
- [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) — source V0 (frozen, после RBAC/rules fill = НЕ редактируется).
- [`AGENT-PROMPTS.md` §2 «Бизнес-аналитик»](../../AGENT-PROMPTS.md) — канонический шаблон промпта.
- [`AGENT-ROLES.md` §2.2](../../AGENT-ROLES.md) — зона ответственности Аналитика.
- [`AGENT-METHOD.md` §5](../../AGENT-METHOD.md) — Правило 5.2.2 STUB-исключение.
- [`AGENT-FORMAT.md` §1 П6](../../AGENT-FORMAT.md) — нумерация правил `**Правило N.**`.
- [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md) — hard limit 400 строк + правила split.
- [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md) — strategic anchor (anti-catalog §3, scope-guards §0).
- [`99_Справочники/INTEGRATION-PLAN.md` §6.2](../../99_Справочники/INTEGRATION-PLAN.md) — Tier-DAG (Run 1/5 → 2/5 → 3/5 → **4/5** → 5/5).
- [`PROJECT-STATE-LOG.md`](../../PROJECT-STATE-LOG.md) — сюда пишется PSL-041 после прогона Аналитика (выше актуальных записей).

---

## 8. Версия

| Версия | Дата       | Что                                                                                                                                                                                        |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0    | 2026-06-27 | Создание пакета после Run 1/5 + 2/5 + 3/5 ✅ CLOSED + ТЗ-013 FINALIZED (PSL-040). 14 файлов attach + 11 ограничений + 11 quality checks. Ready к первому запуску Бизнес-аналитика Run 4/5. |

> 🆕 ID-ALIAS-MAP.md reference (per code-reviewer round 3 CRITICAL #1 + PSL-043): Run 4/5 Аналитик при hard-link resolution: если upstream ID содержит маркер DEPRECATED (visible в 02_Договор/04-pravila/* + Run 3/5 upstream + Run 1/5 upstream), прочитай 99_Справочники/ID-ALIAS-MAP.md (8 алиасов в 3 группах) для canonical name resolution. Alias-map единственный source-of-truth для архитектурных соответствий OLD ↔ NEW IDs при frozen upstream. Без чтения alias-map правило может быть записано с OLD ID, который upstream не знает → hard-link поломан.
