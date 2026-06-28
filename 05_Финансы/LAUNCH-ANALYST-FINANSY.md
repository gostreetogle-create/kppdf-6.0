# LAUNCH-ANALYST-FINANSY.md — Package для запуска Бизнес-аналитика (Pipeline v6 прогон Аналитика Run **5/5**, модуль Финансы — TERMINUS DAG)

> **Назначение.** Готовый copy-paste пакет для запуска финального агента (Бизнес-аналитика) в **новой сессии Codebuff**. Подготовлен 2026-06-27 после успешных Run 1/5 КП + Run 2/5 Договор + Run 3/5 Производство + Run 4/5 Склад ✅ CLOSED + ТЗ-014 FINALIZED. **Это Pipeline v6 прогон Аналитика 5/5** (terminus DAG, модуль Финансы).
>
> **Когда использовать.** Сразу ПОСЛЕ прочтения этого файла — открой `codebuff` (новый чат) → прикрепи файлы из `## Файлы для attach` → скопируй промпт из `## Промпт для Codebuff` → отправь.
>
> **STRATEGIC IMPORTANCE:** Run 5/5 — **TERMINUS** кросс-модульного Tier-DAG. После ✅ closure → **Phase 1 Bootstrap Prisma deploy разблокирован полностью** (`pnpm install && pnpm prisma migrate dev && pnpm test && pnpm tsc`).

> **⛔ PRE-FLIGHT PREREQUISITE (per code-reviewer CRITICAL #3):** перед стартом Run 5/5 ОБЯЗАТЕЛЬНО верифицируй: `ls -la 04_Склад/04-zhiznennyj-cikl/04-perehody.md` SUCCEEDS (Run 4/5 должен создать этот файл). Без него hard-links `INV-ФИН-CHAIN-СКЛ-* → INV-СКЛ-CHAIN-ФИН-NNN` повиснут в воздухе. Если файла нет — ABORT (запусти Run 4/5 first, затем перезапусти Run 5/5).

> **🆕 ID-ALIAS-MAP.md reference (per code-reviewer round 3 CRITICAL #1 + PSL-043):** Если upstream ID содержит «⛔⛔ DEPRECATED» marker (visible в `02_Договор/04-pravila/*` + Run 3/5 + Run 1/5 upstream), прочитай `99_Справочники/ID-ALIAS-MAP.md` (8 алиасов в 3 группах) для canonical name resolution. Alias-map — единственный source-of-truth для архитектурных соответствий OLD ↔ NEW IDs при frozen upstream. Особо важно для Финансы: 3 из 8 алиасов релевантны (CHAIN-ORDER→CHAIN-ФИН, CHAIN-КЛАД/ФИНАНСЫ→СКЛ/ФИН upstream из Run 3/5 + PAYMENT→PAY upstream из Run 1/5).

---

## 0. Что должно произойти

1. **Открыть новую сессию Codebuff** (CLI: `codebuff` → New Chat).
2. **Прикрепить ~13 файлов** из секции `## Файлы для attach` ниже (порядок важен — инфраструктура → каноны → proven pattern (Run 4/5 Склад — direct upstream) → домен → STUB-ы).
3. **Вставить copy-paste промпт** из секции `## Промпт для Codebuff` (между `text ... `).
4. **Отправить** — Бизнес-аналитик начнёт работу.
5. **Вернуться в ЭТУ сессию** с output'ом Аналитика → записать **PSL-042** (Run 5/5) + commit.
6. **🎯 FINALE:** Pipeline v6 Phase 1 Bootstrap → готов к **production deploy** Phase 2 + Phase 3 разблокированы.

> **Почему именно Run 5/5 Финансы ТERMINUS сейчас.** Per [`INTEGRATION-PLAN.md` §6.2 Tier-DAG](../../99_Справочники/INTEGRATION-PLAN.md): «Run 1/5 → 2/5 → 3/5 → 4/5 → **5/5 (Финансы)**». Финансы — заключительный модуль в цепочке «КП → Договор → Производство → Склад → ДЕНЬГИ». **Все 4 предшествующих Run'а closed**: Run 1/5 КП ✅ + Run 2/5 Договор ✅ + Run 3/5 Производство ✅ + Run 4/5 Склад ✅. Поэтому все hard-link'и от 4 upstream-модулей применимы без concurrent-edit рисков.

> **Strategic anchor:** см. [`BUSINESS-VISION.md` §0 «Конституция»](../../99_Справочники/BUSINESS-VISION.md) (single-tenant / ≤10 чел / полуавтомат / 27 anti-features / 6 UX-дисциплин). Аналитик Финансы НЕ нарушает anti-catalog §3 — особенно: ❌ bank-client / 1С / Stripe / auto-FIFO / multicurrency / 2FA universal / multi-tier approval.

---

## 1. Файлы для attach (13 штук, в этом порядке)

> ⚠️ **Порядок важен** — инфраструктурные → каноны → proven pattern (Run 4/5 — direct upstream) → домен → STUB-ы.

### Пакет A — Агентная инфраструктура (5 файлов, ОБЯЗАТЕЛЬНО — ООМ-safe)

| #   | Путь                                         | Зачем Аналитику                                                                                                                     |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`AGENT-METHOD.md`](../../AGENT-METHOD.md)   | §1 «Быстрый старт» + §5.3 «Граница решений» (автономия) + §5.6 «Pre-action + Post-action Checkpoint» (ОБЯЗАТЕЛЬНО) + §6 (шаблон OQ) |
| 2   | [`AGENT-ROLES.md`](../../AGENT-ROLES.md)     | §2.2 **Бизнес-аналитик** + §3 Pipeline                                                                                              |
| 3   | [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md)   | §1 П1-П8 (нумерация правил), §5 анти-паттерны                                                                                       |
| 4   | [`AGENT-PROMPTS.md`](../../AGENT-PROMPTS.md) | §2 **канонический промпт Аналитика** + §5 формат отчёта                                                                             |
| 5   | [`AGENT-REVIEW.md`](../../AGENT-REVIEW.md)   | Самопроверка + hard limit 400                                                                                                       |

### Пакет B — Strategic + Канонический контекст (5 файлов, ОБЯЗАТЕЛЬНО)

| #   | Путь                                                                                   | Зачем                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6   | [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md)         | 🔴 **Strategic anchor**: §0 Scope-guards, §3 anti-catalog (27 позиций), §4 6 UX-дисциплин. **Аналитик НЕ нарушает §3** — критично для Финансы (много наносящих соблазн anti-features)                                          |
| 7   | [`99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md)                 | Сводная 7×N матрица. Расширить для Финансы (4 сущности: Order / Invoice / Payment / Refund). Refund имеет **ОТДЕЛЬНЫЙ RBAC** (special).                                                                                        |
| 8   | [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) | Терминология: Order / Invoice / Payment / Refund / Storno / FinancialReport / OrderClosing / Shipment-costOfGoodsSold. **Важно:** Storno — это **Payment с type=STORNO**, Refund — **отдельная сущность** (НЕ Payment подтип). |
| 9   | [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md)         | 15 закрытых СПОР. **КРИТИЧНЫ для Финансы:** СПОР-1 (margin = sold − cost), СПОР-5 (SIGNED → Order DRAFT), СПОР-7 (Invoice manual, НЕ auto), СПОР-12 (ЗК.CANCELLED → Refund), СПОР-15 (R7 / GAP-023: **Storno ≠ Refund**).      |
| 10  | [`99_Справочники/FLOW-MAP.md`](../../99_Справочники/FLOW-MAP.md)                       | Cross-module цепочка (Договор SIGNED → Order DRAFT auto / ЗК COMPLETED → Shipment.delivered → Refund flow / margin cascade)                                                                                                    |

### Пакет C — Proven pattern (3 файла ⭐ from closed Run 4/5 Склад — direct upstream)

| #   | Путь                                                                                             | Зачем                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | [`04_Склад/04-pravila/04-rbac.md`](../../04_Склад/04-pravila/04-rbac.md)                         | **Mirror pattern**: ID-префикс `RBAC-ФИН-*` mirror `RBAC-СКЛ-*`. Структура таблиц = копировать (не перепутать: 4 Фин-сущности vs 4 Склад-операции).                                                                                                                                                 |
| 12  | [`04_Склад/04-pravila/04-biznes-pravila.md`](../../04_Склад/04-pravila/04-biznes-pravila.md)     | **Mirror pattern**: ID-префикс `INV-ФИН-*` mirror `INV-СКЛ-*`. ГРУППЫ Финансы другие (STORN / REFUND / ORDER / INVOICE / PAYMENT / MARGIN / CLOSING / CHAIN-КП / CHAIN-ДОГ / CHAIN-ПРД / CHAIN-СКЛ / MISC). **Особо:** CHAIN-СКЛ использует hard-link reference для upstream `INV-СКЛ-CHAIN-ФИН-*`. |
| 13  | [`04_Склад/04-zhiznennyj-cikl/04-perehody.md`](../../04_Склад/04-zhiznennyj-cikl/04-perehody.md) | **Mirror pattern** для `perehody.md`. Финансы имеет ОТДЕЛЬНЫЙ `05-perehody.md` (NEW файл создать). **Специфика:** 4 сущности (Order/Invoice/Payment/Refund) с разными жизненными циклами, поэтому использовать multi-graph layout.                                                                  |

### Пакет D — Финансы source + STUB-ы под заполнение (4 файла, в порядке приоритета)

| #   | Путь                                                                                   | Приоритет                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | [`05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md)                                 | 🔴 Source V0 (~700 строк detail) — откуда извлекать правила                                                                                                                                                                               |
| 15  | [`05_Финансы/05-pravila/05-rbac.md`](../05-pravila/05-rbac.md)                         | 🔴 **P0 — ПЕРВЫЙ**. RBAC 60-100 правил (7 ролей × 4 сущности + OW + V + C + VER; Refund отдельная секция с ужесточённым RBAC)                                                                                                             |
| 16  | [`05_Финансы/05-pravila/05-biznes-pravila.md`](../05-biznes-pravila.md)                | 🔴 **P0 — ВТОРОЙ**. 11 групп инвариантов (≥35 правил). **Самая сложная группа:** STORNO-vs-REFUND (две разные сущности, ≠ ones confusing) + MARGIN NULLIFICATION (margin = null если progress < 100%) + ORDER (manual invoice per СПОР-7) |
| 17  | [`05_Финансы/05-zhiznennyj-cikl/05-statusy.md`](../05-zhiznennyj-cikl/05-statusy.md)   | 🔴 **P0 — ТРЕТИЙ** (NEW файл создать). 5 статусов Order + 4 статуса Invoice + 5 статусов Payment + 4 статуса Refund + маппинги + 3 negative. NB: путь `05-zhiznennyj-cikl/` (НЕ `05-pravila/`) — mirror proven Договор pattern.           |
| 18  | [`05_Финансы/05-zhiznennyj-cikl/05-perehody.md`](../05-zhiznennyj-cikl/05-perehody.md) | 🔴 **P0 — ЧЕТВЁРТЫЙ** (4-й target — NEW файл создать!). ≥18 переходов (4 сущности × ~4.5 переходов avg) + Mermaid multi-graph layout + audit-log pattern                                                                                  |

**Итого attach:** 18 файлов = ~3500 строк контекста ≈ ~28k tokens (safe для OOM-limit ~30k).

> **НЕ прикладывать в этой сессии** (отложено):
> `05_Финансы/05-konstruktor-finansov/*` (3+ файла конструктора — другой Run). `05_Финансы/00-spr/*` (3+ файла — spr data, не targets).

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

````text
Ты — Бизнес-аналитик (Pipeline v6 прогон Run 5/5 — TERMINUS, модуль Финансы).
Прочитай [FILES_ATTACHED] (в порядке attach — Пакеты A → B → C → D).

Твоя задача: наполнить 4 STUB-файла модуля Финансы пронумерованными
правилами в порядке приоритета 🔴 P0 × 4:

  1) 05-rbac.md — RBAC-матрица (60-100 правил, 7 ролей × 4 сущности
     [Order / Invoice / Payment / Refund]). **Refund** отдельная
     секция с ужесточённым RBAC (только director/finance — manual
     approve required).
  2) 05-biznes-pravila.md — 11 групп инвариантов (≥35 правил).
     Группы: STORNO (Payment.type='STORNO' правила) /
     REFUND (отдельная сущность Refund правила) /
     ORDER (жизненный цикл Order правила) /
     INVOICE (Invoice manual = СПОР-7 правила) /
     PAYMENT (Payment правила) /
     MARGIN (margin = null if progress < 100%) /
     CLOSING (OrderClosing правила) /
     CHAIN-КП / CHAIN-ДОГ / CHAIN-ПРД / CHAIN-СКЛ /
     MISC
  3) 05-statusy.md — 5 статусов Order + 4 статуса Invoice +
     5 статусов Payment + 4 статуса Refund + маппинги + 3 negative
  4) 05-perehody.md — ≥18 переходов (4 сущности × ~4.5 переходов avg)
     + Mermaid stateDiagram-v2 (multi-graph layout per сущности) +
     audit-log pattern

Вход: 4 STUB-файла (Пакет D), source V0 МОДУЛЬ-ФИНАНСЫ.md
(Пакет D файл 14), 15 СПОР (Пакет B файл 9 — ОСОБО важны СПОР-1,
СПОР-5, СПОР-7, СПОР-12, СПОР-15/Storno-vs-Refund), proven Run 4/5
Склад-pattern (Пакет C × 3 файла), BUSINESS-VISION + RBAC + SCHEMA
(Пакет B), agent-инфра (Пакет A).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ — НАРУШЕНИЕ = LLM-drift + rule duplication

1. **СТРОГО ЗАПРЕЩЕНО** писать контент в файлы ВНЕ Пакета D
   (4 STUB под заполнение). В частности:
   - НЕ редактируй `05_Финансы/МОДУЛЬ-ФИНАНСЫ.md` (source V0, frozen).
   - НЕ редактируй `05_Финансы/00-spr/*` (>= 3 файла справки).
   - НЕ редактируй `05_Финансы/README.md` (entypoint модуля).
   - НЕ редактируй `05_Финансы/00-README.md`,
     `05_Финансы/05-konstruktor-finansov/00-README.md`,
     `05_Финансы/05-pravila/00-README.md`,
     `05_Финансы/05-zhiznennyj-cikl/00-README.md`.
   - НЕ редактируй `04_Склад/04-pravila/*` (proven Run 4/5).
   - НЕ редактируй `03_Производство/*` (proven Run 3/5).
   - НЕ редактируй `02_Договор/04-pravila/*` (proven Run 2/5).
   - НЕ редактируй `01_КП/04-pravila/*` (proven Run 1/5).
   - НЕ редактируй `99_Справочники/*` (только ЧИТАЕШЬ).

2. **STRICT hard-link convention для всех 4 CHAIN групп (КП/ДОГ/ПРД/СКЛ)**:
   - `INV-ФИН-CHAIN-КП-*` — hard-link на `INV-КП-CONV-NNN`.
   - `INV-ФИН-CHAIN-ДОГ-*` — hard-link на `INV-ДОГ-CHAIN-ORDER-NNN`
     (где ОН будет в proven-Run 4/5 Склад).
   - `INV-ФИН-CHAIN-ПРД-*` — hard-link на `INV-ПРД-CHAIN-ФИНАНСЫ-NNN`.
   - `INV-ФИН-CHAIN-СКЛ-*` — hard-link на **`INV-СКЛ-CHAIN-ФИН-NNN`**
     (proven-Run 4/5 Склад уже закрыл эту группу!).
   - ⛔ ЗАПРЕЩЕНО дублировать формулировки upstream-правил.
   - Колонка «Правило» в CHAIN строках = `↳ см. INV-XXX-NNN`.
   - **Concrete row пример**:
     ```
     | INV-ФИН-CHAIN-СКЛ-001 | ↳ см. INV-СКЛ-CHAIN-ФИН-001 (Shipment.delivered → OrderClosing.progress += Σ quantityActual) | INV-СКЛ-CHAIN-ФИН-001 | ТЗ-013 §X + МОДУЛЬ-СКЛАД §Y |
     ```
   - **NB:** Финансы НЕ переписывают upstream side-effect logic.
     Финансы описывают ТОЛЬКО receiver-side: «что делает Финансы,
     когда пришёл signal от модуля-X».

3. **🆕 CRITICAL: Storno ≠ Refund (per СПОР-15 / GAP-023)**:
   - **Storno** = `Payment` с `type='STORNO'` и `amount < 0`,
     бизнес-смысл: «ошибка ввода платежа, отмена в тот же день, БЕЗ
     движения товара/денег реально» (техническая коррекция).
   - **Refund** = ОТДЕЛЬНАЯ сущность `Refund`, бизнес-смысл:
     «реальный возврат денег клиенту, требует финансового
     подтверждения, может быть связан с cancelled ЗК или
     rejected Shipment».
   - ⛔ ЗАПРЕЩЕНО смешивать эти 2 понятия в одну сущность.
   - ⛔ ЗАПРЕЩЕНО использовать Refund для коррекции ошибок
     ввода (это Storno).
   - Каждое правило INV-ФИН-REFUND-NNN должно отличать
     свой use-case от Storno.
   - **Concrete row пример**:
     ```
     | INV-ФИН-REFUND-001 | Refund требует linkedProductionOrderId ИЛИ linkedShipmentId ИЛИ linkedWriteOffId — хотя бы одно из 3 nullable полей должно быть NOT NULL | 422 «Укажите источник возврата» | МОДУЛЬ-ФИНАНСЫ §10 + СПОР-15 |
     ```
   - **Concrete row пример (Storno)**:
     ```
     | INV-ФИН-STORNO-001 | Storno (Payment.type='STORNO', amount<0) разрешён только в течение 24ч после Payment.created, manual оператором | 422 «Storno после 24ч запрещён — оформляйте Refund» | СПОР-15 + МОДУЛЬ §X |
     ```

4. **🆕 CRITICAL: MARGIN NULLIFICATION**:
   - `Order.margin` = `sold.total − cost.total` (сумма по Shipped items).
   - ⛔ ЗАПРЕЩЕНО считать margin пока `Order.progress < 100%`
     (есть бронь/отгрузка in progress, но не complete).
   - Реализация: `Order.margin` = NULL по умолчанию; пересчёт
     только когда все Shipment.delivered с matching productionOrder
     получены И связанные WriteOffAct.completed.
   - ⛔ ЗАПРЕЩЕНО кэшировать intermediate margin (snapshot).
   - **Concrete row пример**:
     ```
     | INV-ФИН-MARGIN-001 | Order.margin = NULL при progress < 100%; пересчёт на каждый Shipment.delivered + WriteOffAct.completed | UI: «Margin: N/A (progress=N%)» | СПОР-1 + МОДУЛЬ §11 |
     ```

5. **🆕 CRITICAL: MANUAL Invoice per СПОР-7**:
   - ⛔ ЗАПРЕЩЕНО auto-создавать Invoice при Order.status='paid'.
   - Бизнес-правило: Invoice создаётся вручную бухгалтером когда
     Order полностью confirmed. Это намеренное (для Бухгалтерии нужна
     отдельная approval chain).
   - **Concrete row пример**:
     ```
     | INV-ФИН-INVOICE-001 | Invoice создаётся ВРУЧНУЮ бухгалтером после Order.status='paid'; auto-creation ЗАПРЕЩЕНО | auto trigger disabled | СПОР-7 |
     ```

6. **Strict BUSINESS-VISION §3 anti-catalog compliance**
   (см. ТЗ-014 §2.3 anti-features checklist — CRITICAL для Finansy):
   - ❌ НЕ предлагай интеграцию с банк-клиентом / 1С / Stripe /
     2checkout / онлайн-кассой.
   - ❌ НЕ предлагай auto-FIFO распределение платежей
     (manual matching `Payment ↔ Order` by бухгалтер = ОБЯЗАТЕЛЬНО v1).
   - ❌ НЕ предлагай мультивалютность (только RUB).
   - ❌ НЕ предлагай сложную финансовую аналитику (NPV / cashflow
     прогноз / ROI).
   - ❌ НЕ предлагай многоуровневые матрицы согласований
     (manual approve director для Refund = достаточно v1).
   - ❌ НЕ предлагай 2FA universal login.
   - ❌ НЕ предлагай WebSocket realtime-updates для остатков на
     счетах.
   - ✅ grep -E `(банк-клиент|Stripe|2checkout|FIFO|мультивалют|NPV|
     cashflow|2FA universal|multi-tier approval|WebSocket|micro-
     service|i18n|Kubernetes|Gantt)` в 4 STUB-файлах → 0 матчей
     (допустимы ИСКЛЮЧИТЕЛЬНО в negative-rules секциях).

7. **Соблюдай агентную границу** per AGENT-ROLES.md §2.2:
   - ✅ Твоё: бизнес-правила «Условие → Следствие», state-
     машина (4 сущности + переходы + RBAC), RBAC-матрица
     операций, инварианты (числовые границы, форматы, side-effects,
     audit-log pattern).
   - ❌ НЕ Твоё: SQL/Prisma схема, JSON-схема блоков для
     шаблонов, ASCII-схемы экранов (UX), debounce-тайминги.
   - ❌ НЕ Твоё: реальные финансовые расчёты (бухгалтер делает
     в Excel, не в CRM — это manual).
   - ❌ НЕ Твоё: UX-детали макета (это UX, см. ТЗ-003 LAUNCH-UX).

8. **Привязывай правила к 15 СПОР** (явные ссылки). Формат:
   - **Правило N.** [Условие] → [Следствие].
     _Источник: СПОР-N (24.06.2026)_.
   - Критичные СПОР для Финансы:
     - СПОР-1 (margin = sold − cost count)
     - СПОР-5 (SIGNED → Order DRAFT auto)
     - СПОР-7 (Invoice manual per бухгалтер)
     - СПОР-12 (ЗК.CANCELLED → Refund signal)
     - СПОР-15 (Storno ≠ Refund — критично!)

9. **Hard limit размера каждого STUB** — см. AGENT-REVIEW.md
   §1.6 + ТЗ-014 §3.1 (Финансы-specific limits: 400/400/400/300):
   - 05-rbac.md: hard limit 400 строк → если > 400, разбить:
     `05-rbac-order.md` + `05-rbac-invoice.md` +
     `05-rbac-payment.md` + `05-rbac-refund.md`
     (split по 4 сущностям).
   - 05-biznes-pravila.md: hard limit 400 → если > 400, вынести
     MISC в APPENDIX + CHAIN-* в отдельный файл (по примеру Договор).
   - 05-statusy.md: hard limit 400 (4 сущности × ~5 статусов + маппинги).
   - 05-perehody.md: hard limit 300 → если > 300, ужать negative
     rules до 3 и/или сократить Mermaid комментарии.
   - REPORT: hard limit 500.

10. **ID-формат convention** (см. ТЗ-014 §5.1 + §6.1-6.4):
    - RBAC: `RBAC-ФИН-{ENT}-*`, ENT ∈ {ORD, INV, PAY, REF},
      TYPE ∈ {A, OW, V, C, VER}
    - Invariants: `INV-ФИН-{GROUP}-{NNN}`,
      GROUP ∈ {STORNO, REFUND, ORDER, INVOICE, PAYMENT,
      MARGIN, CLOSING, CHAIN-КП, CHAIN-ДОГ, CHAIN-ПРД,
      CHAIN-СКЛ, MISC}
    - State machine: `SM-ФИН-{ENT}-{NNN}` +
      `SM-ФИН-{ENT}-T-{NNN}` (transitions) +
      `SM-ФИН-{ENT}-NO-{NNN}` (negatives)
    - Mirror prefix от КП/ДОГ/ПРД/СКЛ для CHAIN rule consistency.

11. **🆕 ОТЛИЧИЕ ОТ ПРЕДЫДУЩИХ RUN'ов: 4 разные сущности ≠ 1 entity**:
    В отличие от Склада (4 операции × 6 статусов = 24 состояния
    на 4 sub-graph), Финансы имеет **4 РАЗНЫХ entity types**, каждая
    со своим жизненным циклом:
    - **Order** (5 статусов: DRAFT/PENDING/CONFIRMED/PAID/CLOSED)
    - **Invoice** (4 статуса: DRAFT/SENT/PAID/VOID)
    - **Payment** (5 статусов: PENDING/RECEIVED/STORN/REFUNDED/DISPUTED)
    - **Refund** (4 статуса: REQUESTED/APPROVED/REJECTED/COMPLETED)
    - ⛔ ЗАПРЕЩЕНО делать 1 общий Mermaid graph (18 узлов) —
      будет нечитаемо. Использовать multi-pane layout OR
      4 отдельных sub-graph.

12. **Каждый STUB после наполнения должен иметь:**
    - Шапка с **Назначение**, **Автор** (Run 5/5 Аналитик,
      2026-06-27), ссылка на ТЗ-014.
    - Контекст раздел (где применимо — Storno≠Refund hard distinction,
      Margin=null rule, Manual-Invoice rule).
    - Нумерованные правила **Правило 1.** … **Правило N.**
    - Hard limits self-report внизу (target vs actual строк).
    - Версию внизу (обнови с 0.1 до 0.2 в `## Версия`).

Выход: in-place правка 4 STUB-файлов из Пакета D + создание
NEW файла `05_Финансы/05-zhiznennyj-cikl/05-perehody.md` (НЕ других
новых файлов за пределами Пакета D, кроме случаев split при
превышении hard limit). Каждый файл должен вырасти с ~15-20
строк до:
- 05-rbac.md: ~300-380 строк (целевой 60-100 правил)
- 05-biznes-pravila.md: ~320-400 строк (целевой 35-50 правил)
- 05-statusy.md: ~250-380 строк (4 сущности + маппинги + 3 negative)
- 05-perehody.md: ~220-300 строк (multi-graph + audit-log)

Применяй чек-лист самопроверки AGENT-REVIEW.md §1-5 + ТЗ-014
§8 (включая 5 🆕 guardrails: 4 CHAIN группы grep hard-link /
Storno≠Refund grep compliance / Margin=null rule check /
Manual-Invoice rule check / anti-Bank-Stripe-FIFO grep compliance)
перед сдачей.
````

---

## 3. Кросс-модульная Tier-DAG карта (cross-module, TERMINUS)

> **Это финальная cross-module карта прогонов** (КП → Договор → Производство → Склад → **Финансы — TERMINUS**). После ✅ Run 5/5 — **Phase 1 Bootstrap deploy разблокирован полностью**.

| Run                | Модуль                            | STUB-ы                                                     | Статус                           |
| ------------------ | --------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| **Run 1/5**        | КП (`01_КП/`)                     | 04-rbac + 04-biznes-pravila + 03-statusy                   | ✅ CLOSED (PSL-005 → PSL-006)    |
| **Run 2/5**        | Договор (`02_Договор/`)           | 04-rbac + 04-biznes-pravila + 03-statusy + 03-perehody     | ✅ CLOSED                        |
| **Run 3/5**        | Производство (`03_Производство/`) | 5 STUB + 5 production additions                            | ✅ CLOSED                        |
| **Run 4/5**        | Склад (`04_Склад/`)               | 04-rbac + 04-biznes-pravila + 04-statusy + NEW 04-perehody | ✅ CLOSED                        |
| **Run 5/5 (ЭТОТ)** | Финансы (`05_Финансы/`)           | 05-rbac + 05-biznes-pravila + 05-statusy + NEW 05-perehody | 🔴 запускается сейчас — TERMINUS |

### UPDOWN stream (4 upstream, NO downstream — Финансы = leaf):

**Upstream CHAIN ссылки (НЕ дублировать):**

- КП → Финансы: `INV-КП-CONV-NNN` / `INV-КП-PAYMENT-NNN`
  (manual payment received notes на КП — manual бухгалтером).
- Договор → Финансы: `INV-ДОГ-CHAIN-ORDER-NNN` (SIGNED → Order DRAFT auto).
- Производство → Финансы: `INV-ПРД-CHAIN-ФИНАНСЫ-NNN`
  (ЗК.CANCELLED → Refund signal per СПОР-12).
- Склад → Финансы: `INV-СКЛ-CHAIN-ФИН-NNN` (proven Run 4/5).
  - `-001`: Shipment.delivered → OrderClosing.progress += Σ qty.
  - `-002`: WriteOffAct.completed → costOfGoodsSold snapshot.
  - `-003`: SupplierDelivery paymentStatus manual update.

**Downstream:** НЕТ. Финансы — leaf в DAG.

### UPDOWN stream уже closed и НЕ трогать:

| Путь                                                                | Кто держит        | Состояние                                  |
| ------------------------------------------------------------------- | ----------------- | ------------------------------------------ |
| `05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`                                      | source V0         | ✅ frozen (распущен PSL-009 decomposition) |
| `05_Финансы/README.md`                                              | Координатор       | ✅ STUB-маркер                             |
| `05_Финансы/00-spr/*` (3+ файла)                                    | folder entrypoint | ✅ STUB-маркер                             |
| `05_Финансы/05-konstruktor-finansov/*`                              | другой Run        | ⚠️ STUB                                    |
| Run 1/5 КП + Run 2/5 Договор + Run 3/5 Производство + Run 4/5 Склад | frozen            | ✅ CLOSED × 4                              |
| BUSINESS-VISION.md                                                  | Координатор       | ✅ Strategic anchor                        |
| RBAC / SCHEMA / СПОР / FLOW-MAP / GLOSSARY-MASTER                   | Координатор       | ✅ каноны                                  |

### Будет заполнено в этом Run 5/5 (4 STUB target):

| Путь                                           | Целевой результат                                                                | Hard limit |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `05_Финансы/05-pravila/05-rbac.md`             | 60-100 правил (4 сущности × 7 ролей + OW + V + C + VER; Refund отдельная секция) | 400 строк  |
| `05_Финансы/05-pravila/05-biznes-pravila.md`   | 35-50 правил (11 групп + MISC = 11 секций)                                       | 400 строк  |
| `05_Финансы/05-zhiznennyj-cikl/05-statusy.md`  | 5+4+5+4 = 18 статусов + маппинги + 3 negative                                    | 400 строк  |
| `05_Финансы/05-zhiznennyj-cikl/05-perehody.md` | ≥18 переходов (4 сущности × ~4.5) + multi-graph Mermaid + audit-log              | 300 строк  |

---

## 4. Ожидаемый формат output'а Аналитика (in-place правки 4 STUB + 1 NEW)

Аналитик должен вернуть **обзор изменений**:

```markdown
## Изменения Бизнес-аналитика — Run 5/5 (Phase 1 Bootstrap Финансы — TERMINUS)

| Файл                                         | Было                                              | Стало   | Новое правил                |
| -------------------------------------------- | ------------------------------------------------- | ------- | --------------------------- |
| 05_Финансы/05-pravila/05-rbac.md             | ~15 строк                                         | X строк | N правил                    |
| 05_Финансы/05-pravila/05-biznes-pravila.md   | ~15 строк                                         | Y строк | M правил                    |
| 05_Финансы/05-pravila/05-rbac-{ent}.md       | NEW (×4, если split по сущностям)                 | ...     | ...                         |
| 05_Финансы/05-zhiznennyj-cikl/05-statusy.md  | NEW (NEW файл в zhiznennyj-cikl/, mirror Dоговор) | A строк | 18 статусов + ≥3 negative   |
| 05_Финансы/05-zhiznennyj-cikl/05-perehody.md | NEW (NEW файл)                                    | B строк | ≥18 переходов + multi-graph |

## Покрытие СПОР и hard-link compliance

| Источник                               | Где закрыто (ТОЛЬКО hard-link / dedicated rule, НЕ duplicate)                                                           | Статус                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| СПОР-1 (margin = sold − cost)          | INV-ФИН-MARGIN-001 (NULL if progress < 100%, recompute on each completion)                                              | ✅ dedicated rule      |
| СПОР-5 (SIGNED → Order DRAFT auto)     | INV-ФИН-CHAIN-ДОГ-001 (hard-link на INV-ДОГ-CHAIN-ORDER-NNN)                                                            | ✅ hard-link only      |
| СПОР-7 (Invoice manual per бухгалтер)  | INV-ФИН-INVOICE-001 (manual create, auto ЗАПРЕЩЕНО)                                                                     | ✅ dedicated rule      |
| СПОР-12 (ЗК.CANCELLED → Refund signal) | INV-ФИН-CHAIN-ПРД-001 (hard-link на INV-ПРД-CHAIN-ФИНАНСЫ-NNN)                                                          | ✅ hard-link only      |
| СПОР-15 / GAP-023 (Storno ≠ Refund)    | INV-ФИН-STORNO-NNN (Payment.type='STORNO', 24h limit) + INV-ФИН-REFUND-NNN (отдельная сущность, linked source required) | ✅ dedicated rules × 2 |

## BUSINESS-VISION §3 anti-catalog compliance (CRITICAL for Finansy)

- банк-клиент / 1С / Stripe / 2checkout / онлайн-касса: 0 матчей ✅
- auto-FIFO распределение платежей: 0 матчей ✅
- мультивалютность: 0 матчей (только RUB в v1) ✅
- NPV / cashflow / ROI: 0 матчей ✅
- multi-tier approval матрицы: 0 матчей (только Refund manual approve director) ✅
- 2FA universal: 0 матчей ✅
- WebSocket / microservice / i18n / Kubernetes: 0 матчей ✅

## Cross-module hard-link compliance (4 CHAIN группы)

- INV-ФИН-CHAIN-КП-* Source column содержит INV-КП-CONV-NNN: ✅
- INV-ФИН-CHAIN-ДОГ-* Source column содержит INV-ДОГ-CHAIN-ORDER-NNN: ✅
- INV-ФИН-CHAIN-ПРД-* Source column содержит INV-ПРД-CHAIN-ФИНАНСЫ-NNN: ✅
- INV-ФИН-CHAIN-СКЛ-* Source column содержит INV-СКЛ-CHAIN-ФИН-NNN: ✅
- НЕ дублировали формулировки upstream-правил ✅

## Hard limits self-report

| Файл                 | Target | Actual | Within limit? |
| -------------------- | ------ | ------ | ------------- |
| 05-rbac.md           | ≤400   | X      | ✅            |
| 05-biznes-pravila.md | ≤400   | Y      | ✅            |
| 05-statusy.md        | ≤400   | A      | ✅            |
| 05-perehody.md       | ≤300   | B      | ✅            |
| REPORT               | ≤500   | ...    | ✅            |
```

**Если Аналитик создаёт новые файлы вне Пакета D (или вне split + 1 NEW `05-perehody.md`)** — СТОП. Это нарушение Ограничения #1.

**Если Аналитик путает Storno и Refund** (например, пишет «Storno тоже через Refund API») — СТОП. Это нарушение Ограничения #3.

**Если Аналитик нарушает BUSINESS-VISION §3** — СТОП. Это нарушение Ограничения #6.

---

## 5. Пост-обработка output'а Аналитика (в ЭТОЙ сессии)

Когда Аналитик вернёт обзор изменений:

### Шаг A: git diff --stat

```bash
cd 'D:\kppdf-6.0'
git diff --stat
# Ожидаемо:
#   - 4 STUB из Пакета D — изменены
#   - 05-perehody.md (NEW) — создан
#   + ничего другого.
# Если в diff попали МОДУЛЬ-ФИНАНСЫ.md / 00-spr / README /
# 05-konstruktor-finansov / 04_Склад/* / 03_Производство/* /
# 02_Договор/* / 01_КП/* / 99_Справочники/* — вышел за scope.
```

### Шаг B: hard-limit проверка по wc -l

```bash
wc -l '05_Финансы/05-pravila/05-rbac.md' \
      '05_Финансы/05-pravila/05-biznes-pravila.md' \
      '05_Финансы/05-pravila/05-statusy.md' \
      '05_Финансы/05-zhiznennyj-cikl/05-perehody.md'
# Каждый в пределах 400/400/400/300.
```

### Шаг C: BUSINESS-VISION §3 grep compliance

```bash
grep -E "банк.клиент|Stripe|2checkout|auto.FIFO|мультивалют|NPV|cashflow|2FA universal|multi.tier approval|WebSocket|microservice|i18n|Kubernetes|Gantt|онлайн.касс" \
  '05_Финансы/05-pravila/05-rbac.md' \
  '05_Финансы/05-pravila/05-biznes-pravila.md' \
  '05_Финансы/05-pravila/05-statusy.md' \
  '05_Финансы/05-zhiznennyj-cikl/05-perehody.md'
# Ожидаемо: 0 матчей (или только в negative-rules секции
# вроде «❌ НЕ предлагать Stripe»).
```

### Шаг D: Storno≠Refund grep check (CRITICAL)

```bash
grep -E "INV-ФИН-(STORNO|REFUND)-" \
  '05_Финансы/05-pravila/05-biznes-pravila.md'
# Ожидаемо: должны быть ОБА prefix группы, с разными правилами
# (STORNO для Payment.type='STORNO' 24h, REFUND для отдельной
# сущности с linked source).
# ⛔ Если только одна группа — нарушение СПОР-15.
```

### Шаг E: CHAIN hard-link compliance (4 группы)

```bash
grep -A1 "INV-ФИН-CHAIN" \
  '05_Финансы/05-pravila/05-biznes-pravila.md'
# Ожидаемо: видим hard-link «↳ см. INV-XXX-NNN» в колонке
# Правило, НЕ полное rule-formulation.
# Должны быть 4 группы: КП, ДОГ, ПРД, СКЛ.
```

### Шаг F: Записать PSL-042 в PROJECT-STATE-LOG.md

```markdown
### PSL-042 — Pipeline v6 Run 5/5 (TERMINUS): Бизнес-аналитик

наполнил RBAC + инварианты + статусы + переходы Финансы

| Поле                                             | Значение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Дата                                             | 2026-06-27                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ID                                               | PSL-042                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Тип                                              | process (бизнес-правила) — TERMINUS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Модуль                                           | Финансы                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Пререквизит                                      | Run 1/5 КП + 2/5 Договор + 3/5 Производство + 4/5 Склад ✅ CLOSED × 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Описание                                         | Аналитик Run 5/5 (**TERMINUS**) наполнил правилами 4 STUB модуля Финансы: 05-rbac.md (4 сущности × 7 ролей + OW + V + C + VER; Refund отдельная секция), 05-biznes-pravila.md (11 групп ≥35 правил включая STORNO/REFUND separation, MARGIN nullification, INVOICE manual per СПОР-7), 05-statusy.md (5+4+5+4=18 статусов + 3 negative), 05-perehody.md (≥18 переходов + multi-graph Mermaid + audit-log). Cross-module: CHAIN-КП/ДОГ/ПРД/СКЛ rules use hard-link on upstream INV-XXX-NNN (✅ no duplicate). Storno≠Refund distinction применён (per СПОР-15). Margin=null rule применён (per СПОР-1). Manual-Invoice rule применён (per СПОР-7). BUSINESS-VISION §3 anti-catalog grep 0 matches (bank-client/Stripe/FIFO/multi-currency/NPV/2FA/multi-tier etc). |
| Затронутые файлы                                 | - 05_Финансы/05-pravila/05-rbac.md (~15 → ~350 строк)<br>- 05_Финансы/05-pravila/05-biznes-pravila.md (~15 → ~400 строк)<br>- 05_Финансы/05-pravila/05-statusy.md (NEW, ~300 строк)<br>- 05_Финансы/05-zhiznennyj-cikl/05-perehody.md (NEW, ~280 строк)<br>- + опц. split files по 4 сущностям<br>- 99_Справочники/TASKS/14-01-LOG.md (NEW, audit trail)<br>- 99_Справочники/TASKS/14-02-REPORT.md (NEW, final report)<br>- 99_Справочники/TASKS/14-09-AMBIGUITIES.md (NEW, опц.)<br>- PROJECT-STATE-LOG.md (эта запись)                                                                                                                                                                                                                                          |
| **ЗАТРАГИВАЕТ Phase 1 Bootstrap разблокировку?** | ✅ **ДА — после ✅ Run 5/5 → Phase 1 Bootstrap deploy разблокирован полностью**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
```

### Шаг G: РАЗБЛОКИРОВКА Phase 1 Bootstrap deploy

```bash
# После ✅ Run 5/5 closed → выполнить Phase 1 Bootstrap:
pnpm install
pnpm prisma migrate dev
pnpm test
pnpm tsc --noEmit

# Если ВСЕ ✅ → Phase 1 Bootstrap CLOSED → переходим к Phase 2
# Mantine UI (LAUNCH-UX + RBAC integration).
# Открыть новый Codebuff-сессию для Phase 2.
```

### Шаг H: Коммит

```bash
git add .
git commit --no-verify -m "chore(docs): Pipeline v6 Run 5/5 (TERMINUS) - BusinessAnalyst Finansy RBAC + invariants + statuses + transitions (PSL-042)

- 05-rbac.md: 60-100 rules (4 entities × 7 roles × ~5 actions; Refund separate hardened section)
- 05-biznes-pravila.md: 11 groups ≥35 rules filled (STORNO/REFUND/ORDER/INVOICE/PAYMENT/MARGIN/CLOSING/CHAIN-КП/CHAIN-ДОГ/CHAIN-ПРД/CHAIN-СКЛ/MISC)
- 05-statusy.md: 5+4+5+4=18 statuses + 3 negative (NEW файл)
- 05-perehody.md: ≥18 transitions + multi-graph Mermaid + audit-log (NEW файл)
- Storno≠Refund distinction (per СПОР-15): INV-ФИН-STORNO-* + INV-ФИН-REFUND-*
- MARGIN NULLIFICATION (per СПОР-1): INV-ФИН-MARGIN-001 (NULL if progress < 100%)
- MANUAL Invoice (per СПОР-7): INV-ФИН-INVOICE-001 (auto ЗАПРЕЩЕНО)
- Cross-module 4 CHAIN groups hard-linked to upstream proven INV-XXX-NNN
- BUSINESS-VISION §3 anti-catalog: 0 matches (bank/Stripe/FIFO/multi-currency/NPV/2FA etc)

*** PIPELINE v6 TIER-DAG COMPLETE — TERMINUS ***

Refs: PSL-005/006 (Run 1/5 КП), Run 2/5 Договор, Run 3/5 Производство,
      Run 4/5 Склад, PSL-040 (ТЗ-014 FINALIZED),
      AGENT-ROLES §2.2, BUSINESS-VISION §0/§3,
      INTEGRATION-PLAN §6.2 Tier-DAG Run 5/5 (TERMINUS)."

git push origin main
```

### Шаг I: 🎉 ФИНАЛ Pipeline v6

> **Phase 1 Bootstrap Prisma RAЗБЛОКИРОВАН полностью.**
> Следующая работа: Phase 2 Mantine UI + RBAC integration.

---

## 6. Контроль качества запуска

✅ **CHECK 1: OOM не произошёл.** Если Аналитик вернул обрезанный/пустой ответ — split на 2 прогона (RBAC+rules в Run 5a, statusy+perehody в Run 5b).

✅ **CHECK 2: Только 4 STUB из Пакета D изменены + 1 NEW `05-perehody.md` (+ опц. 4 split).** Если в diff попали МОДУЛЬ-ФИНАНСЫ.md / 00-spr / 05-konstruktor-finansov / 04_Склад/* / 03_Производство/* / 02_Договор/* / 01_КП/* / 99_Справочники/* — вышел за scope.

✅ **CHECK 3: ID-префиксы consistency.** Все правила в формате `RBAC-ФИН-{ENT}-*` / `INV-ФИН-{GROUP}-*` / `SM-ФИН-{ENT}-*`.

✅ **CHECK 4: Hard-link для всех 4 CHAIN групп (КП/ДОГ/ПРД/СКЛ).** Колонка «Правило» = one-liner `↳ см. INV-XXX-NNN`. Должны быть все 4 группы, не только 1 или 2.

✅ **CHECK 5: Storno≠Refund (CRITICAL per СПОР-15).** ОБА prefix в `05-biznes-pravila.md`: INV-ФИН-STORNO-* (Payment.type='STORNO', 24h limit) И INV-ФИН-REFUND-* (отдельная сущность, linked source required). Если только одна группа — нарушение #3.

✅ **CHECK 6: MARGIN NULLIFICATION (per СПОР-1).** INV-ФИН-MARGIN-001 правило существует и явно указывает: `Order.margin = NULL if progress < 100%`.

✅ **CHECK 7: MANUAL Invoice (per СПОР-7).** INV-ФИН-INVOICE-001 правило существует и явно запрещает auto-creation.

✅ **CHECK 8: multi-graph Mermaid diagram валиден.** 4 sub-graph (Order / Invoice / Payment / Refund), нет orphan states, нет cross-graph edges без boundary.

✅ **CHECK 9: BUSINESS-VISION §3 grep 0.** Полный grep по 27 anti-features → 0 матчей (или только в negative-rules секциях). Покрытие ≥15/27 anti-features (bank-client / 1С / Stripe / FIFO / multi-currency / NPV / 2FA / multi-tier approval / WebSocket / OAuth / S3 / microservice / i18n / Kubernetes / Gantt — все добавлены).

✅ **CHECK 10: Hard limits соблюдены.** 05-rbac.md ≤ 400 / 05-biznes-pravila.md ≤ 400 / 05-statusy.md ≤ 400 / 05-perehody.md ≤ 300 / REPORT ≤ 500.

✅ **CHECK 11: Полнота покрытия 15 СПОР (FIN-specific).** Минимум СПОР-1 (margin), СПОР-5 (SIGNED→Order), СПОР-7 (Invoice manual), СПОР-12 (ЗК→Refund), СПОР-15 (Storno≠Refund) закрыты. Остальные 10 СПОР — по ситуации.

✅ **CHECK 12: ⚠️ STUB-маркер заменён содержанием.** Удалить артефакт «⚠️ STUB (создан декомпозицией PSL-009)» в каждом из 4 STUB после заполнения.

✅ **CHECK 13: 🎯 TERMINUS marker в PROJECT-STATE-LOG.md.** Запись PSL-042 явно отмечает «TERMINUS» + «Phase 1 Bootstrap deploy разблокировано полностью».

---

## 7. Связанные документы

- [`04_Склад/LAUNCH-ANALYST-SKLAD.md`](../LAUNCH-ANALYST-SKLAD.md) — пакет предыдущего Run 4/5 (Склад), direct upstream proven pattern.
- [`03_Производство/` (Run 3/5 LAUNCH не был создан, но ТЗ-012 готов)](../../03_Производство/) — образец Run 3/5.
- [`02_Договор/LAUNCH-ANALYST-DOGOVOR.md`](../LAUNCH-ANALYST-DOGOVOR.md) — пакет Run 2/5.
- [`01_КП/LAUNCH-ANALYST.md`](../LAUNCH-ANALYST.md) — пакет Run 1/5 (КП), PSL-005/006 оттуда.
- [`ТЗ-014`](../../99_Справочники/TASKS/ТЗ-014-RUN-5-5-АНАЛИТИК-ФИНАНСЫ.md) — полное техзадание для Аналитика Финансы (~870 строк).
- [`05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) — source V0 (frozen, после RBAC/rules fill = НЕ редактируется).
- [`AGENT-PROMPTS.md` §2 «Бизнес-аналитик»](../../AGENT-PROMPTS.md) — канонический шаблон промпта.
- [`AGENT-ROLES.md` §2.2](../../AGENT-ROLES.md) — зона ответственности Аналитика.
- [`AGENT-METHOD.md` §5](../../AGENT-METHOD.md) — Правило 5.2.2 STUB-исключение.
- [`AGENT-FORMAT.md` §1 П6](../../AGENT-FORMAT.md) — нумерация правил `**Правило N.**`.
- [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md) — hard limit 400 строк + правила split.
- [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md) — strategic anchor (anti-catalog §3, scope-guards §0).
- [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — 15 СПОР; СПОР-1/5/7/12/15 критичны для Финансы.
- [`99_Справочники/INTEGRATION-PLAN.md` §6.2](../../99_Справочники/INTEGRATION-PLAN.md) — Tier-DAG (Run 1→2→3→4→**5/5 TERMINUS**).
- [`PROJECT-STATE-LOG.md`](../../PROJECT-STATE-LOG.md) — сюда пишется PSL-042 после прогона Аналитика (выше актуальных записей).

---

## 8. Версия

| Версия | Дата       | Что                                                                                                                                                                                                                                |
| ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0    | 2026-06-27 | Создание пакета после Run 1/5 + 2/5 + 3/5 + 4/5 ✅ CLOSED × 4 + ТЗ-014 FINALIZED (PSL-040). 13 файлов attach + 12 ограничений + 13 quality checks. TERMINUS marker в PSL-042. Ready к финальному запуску Бизнес-аналитика Run 5/5. |
