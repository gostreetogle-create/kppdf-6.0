# 05_Финансы/_ARCHITECT-DECOMPOSITION-DRAFT.md — Architect decomposition для модуля Финансы / Закрытие заказа

> **Назначение.** Decomposition output работы роли **Архитектор** для модуля `05_Финансы/` в проекте KPPDF CRM v6. Применены правила `AGENT-METHOD.md §3 Правило 3.1` (декомпозиция плоского файла >250 строк по 5 тематическим папкам) + ограничения `AGENT-ROLES.md §2.1` (Архитектор НЕ пишет содержимое файлов — только мета-уровень + дерево + таблицу).
>
> **Файл-источник декомпозиции:** [`05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`](МОДУЛЬ-ФИНАНСЫ.md) (~280 строк: §0 Глоссарий + §1 Для чего + §2 Для кого + §3 ЖЦ Order 6 статусов + Invoice 5 статусов + §4 Ключевой сценарий «От подписания договора до закрытия заказа» + §5 Экраны UI + §6 Бизнес-правила + §7 v1 vs ❌ v2 + §8 ✅ 8 закрытых Q + §9 Связи с другими модулями + §10 Поля данных 5 сущностей + §11 Сценарии для ИИ-симуляции).
>
> **Launch-package:** [`05_Финансы/LAUNCH-ARCHITECT-05.md`](LAUNCH-ARCHITECT-05.md) (PSL-010 → PSL-010e attribute). Окно №4 из 4 параллельных — последнее, ЗАМЫКАЕТ цепочку (Договор→Производство→Склад→Финансы).
>
> **Дата:** 2026-06-26.
>
> **Метод:** AGENT-METHOD §3 + AGENT-ROLES §2.1 + LAUNCH-05 (⛔ Стратегия C: конструктор-папки = 2 шт СТРОГО ЗАФИКСИРОВАНО).

---

## 1. Дерево папок модуля 05_Финансы/

```markdown
05_Финансы/
├── README.md                                # 🔵 EXISTING (точка входа модуля, зафиксирована в PSL-010)
├── 00-spr/                                  [Справочники]
│   ├── 00-otkrytye-voprosy.md              # 🔵 EXISTING: 5 baseline OQ для Аналитика Run 1.
│   ├── 00-glossary.md                      # 🆕 NEW: Термины модуля (Order, Invoice, Payment, Refund, Balance, Margin, CostOfGoodsSold, Storno).
│   ├── 00-mvp-boundaries.md                # 🆕 NEW: §7 ❌ Не делаем в v1 (банк-интеграция, частичные оплаты поэтапно, авто-перевыставление, мультивалюта, финин-аналитика).
│   ├── 00-entity-fields.md                 # 🆕 NEW: §10 Поля 5 СУЩНОСТЕЙ (Order 15 полей + Invoice 10 + Payment 11 + Refund 11 + Counter) — БЕЗ FK-схемы (это Моделировщик per AGENT-ROLES §2.3).
│   └── 00-svyazi.md                        # 🆕 NEW: §4 + §6 + §9 — связи с КП (proposalId FK из Договора), Договором (contractId NOT NULL RESTRICT СПОР-5), Производством (cancel → Refund signal), Складом (costOfGoodsSold → margin).
├── 01-shablon/                              [Шаблоны]
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 01-shablon-invoice.md               # 🆕 NEW: Визуальный макет Invoice PDF (A4: реквизиты, таблица позиций, суммы с НДС, подпись, печать).
│   └── 01-tipy-payment-invoice.md          # 🆕 NEW: Payment.type enum (INCOMING|STORNO) + InvoiceType enum (ADVANCE|MAIN|CORRECTIVE) + правила какой тип когда.
├── 02-page-orders/                          [Конструктор №1 — СТРАТЕГИЯ C: ЗАФИКСИРОВАНО]
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 02-spisok-i-filtri-orders.md         # 🆕 NEW: /finance/orders — таблица Order (№, клиент, менеджер, сумма, оплачено, сальдо, статус, дата закрытия) + 4 фильтра (статус, клиент, менеджер, просроченные).
│   ├── 02-kartochka-order.md               # 🆕 NEW: /finance/orders/[id] — 3-зонный Каркас-Kit (лево: хронология событий + ссылки на КП/Договор/ЗК; центр: шапка + таблица счетов + таблица платежей; право: действия + сводка сумма/оплачено/сальдо/маржа).
│   └── 02-knopki-zakaz.md                  # 🆕 NEW: Матрица 4 кнопок по статусам (Создать счёт / Зарегистрировать платёж / Закрыть заказ / Оформить Refund) — кто может нажать (RBAC §6).
├── 02-page-payments/                        [Конструктор №2 — СТРАТЕГИЯ C: ЗАФИКСИРОВАНО]
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 02-registraciya-payment.md          # 🆕 NEW: Форма ввода Payment.type='INCOMING' — receivedAt, amount>0, dropdown Invoice.id (СПОР-7 ✅) или «без привязки к счёту» (InvoiceId IS NULL).
│   ├── 02-oformlenie-refund.md             # 🆕 NEW 🔴 CROSS-OQ-1: Форма Refund — originalPaymentId (FK), linkedProductionOrderId/ShipmentId/WriteOffId (опц.), amount>0, reason ≥ 3 симв (NOT NULL). > (Архитектурное разделение см. 04-storno-vs-refund-pravila.md)
│   ├── 02-storno-flow.md                   # 🆕 NEW: Форма Сторно исходного Payment — `type='STORNO'`, `amount<0`, `correctsPaymentId` FK (RESTRICT), `notes NOT NULL` (причина опечатки бухгалтера).
│   └── 02-saldo-i-perechet.md              # 🆕 NEW: Авто-пересчёт `saldo = totalAmount - paidAmount` + триггеры переходов (FULLY_PAID → `Order.status='AWAITING_PAYMENT'` → CLOSED через 1 день).
├── 03-zhiznennyj-cikl/                      [Жизненный цикл]
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 03-statusy-svodka.md                # 🆕 NEW: Сводная таблица статусов: Order 6 (DRAFT|IN_PROGRESS|AWAITING_PAYMENT|CLOSED|CANCELLED + ARCHIVE), Invoice 5 (DRAFT|ISSUED|PARTIAL|FULLY_PAID|OVERDUE), Payment 2 (INCOMING|STORNO).
│   ├── 03-perekhody.md                     # 🆕 NEW: Таблица переходов всех 3 сущностей + ASCII-диаграмма + явное различие CLOSED vs CANCELLED в отчётности. 🔴 CROSS-OQ-4 Termination mapping (Contract.TERMINATED → Order.CANCELLED + manual Refund).
│   └── 03-triggery-modulya.md              # 🆕 NEW: Каскадные авто-триггеры — `Contract.status='SIGNED'` → авто-создание Order (СПОР-5); `ProductionOrder.status='CANCELLED'` после `PAID` КП → Refund signal бухгалтеру (CROSS-OQ-1); `WriteOffAct.reason='DEFECT'` → Refund signal.
└── 04-pravila/                              [Ограничения]
    ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
    ├── 04-biznes-pravila.md                # 🆕 NEW: §6 правила — авто-пересчёт сальдо, Order НЕ закрывается при balance>0, маржа ТОЛЬКО для shipped позиций (CROSS-OQ-3 formula `Σ(price×qty) − Σ costOfGoodsSold`), поздняя себестоимость → recalc margin в течение N дней после close (OQ-004), RUB жёстко (СПОР-14), авто-FULLY_PAID при balance=0 (СПОР-7).
    ├── 04-rbac.md                          # 🆕 NEW: §6 RBAC-таблица 5 ролей (manager/accountant/director/admin/viewer) × 7 действий (видеть список/создать счёт/зарегистрировать платёж/закрыть/видеть маржу/Refund/Терминация).
    └── 04-storno-vs-refund-pravila.md      # 🆕 NEW 🔴 CROSS-OQ-1 ГЛАВНЫЙ: Явное архитектурное разделение — Storno (Payment.type='STORNO', amount<0, correctsPaymentId, oпечатка бухгалтера, НЕ меняет бизнес-статусы) vs Refund (отдельная сущность, amount>0, originalPaymentId RESTRICT, реальный возврат денег клиенту, может перевести Order в CANCELLED, SC-02 vs SC-05 из §11).
```

---

## 2. Сводная таблица NEW файлов (18 шт)

| # | Файл | Вход (§МОДУЛЬ-ФИНАНСЫ) | Назначение | Target rows | Приоритет |
|---|---|---|---|---|---|
| 1 | `00-spr/00-glossary.md` | §0 | Термины — Order, Invoice, Payment, Refund, Balance, Margin, CostOfGoodsSold, Storno | 100 | 🟡 P1 |
| 2 | `00-spr/00-mvp-boundaries.md` | §7 ❌ Не делаем в v1 + §11 сценарии (отложенные) | Банк-интеграция, частичные оплаты поэтапно, авто-перевыставление, мультивалюта, финин-аналитика — отложено в v2 | 110 | 🟡 P1 |
| 3 | `00-spr/00-entity-fields.md` | §10 (поля 5 сущностей) | Поля Order (15) + Invoice (10) + Payment (11) + Refund (11) + Counter — НЕ Prisma схема (зона Моделировщика per AGENT-ROLES §2.3) | 200 | 🔴 P0 |
| 4 | `00-spr/00-svyazi.md` | §4 + §6 + §9 | proposalId FK из Договора; contractId NOT NULL RESTRICT (СПОР-5); ProductionOrder cancel → Refund signal (CROSS-OQ-1); Shipment.costOfGoodsSold → margin (CROSS-OQ-3); Contract.TERMINATED → Order.CANCELLED (CROSS-OQ-4) | 180 | 🔴 P0 |
| 5 | `01-shablon/01-shablon-invoice.md` | §5.2 Печать PDF + §1 упоминание | Макет Invoice A4 (реквизиты, таблица позиций, суммы, НДС, подпись, печать) | 130 | 🟡 P1 |
| 6 | `01-shablon/01-tipy-payment-invoice.md` | §6.payment.type + §10 InvoiceType enum | Payment enum (INCOMING/STORNO) + InvoiceType enum (ADVANCE/MAIN/CORRECTIVE) — правила какой тип когда | 100 | 🟡 P1 |
| 7 | `02-page-orders/02-spisok-i-filtri-orders.md` | §5.1 Экран 1 | /finance/orders таблица Order (8 колонок) + 4 фильтра (статус/клиент/менеджер/просроченные) + быстрый поиск | 180 | 🔴 P0 |
| 8 | `02-page-orders/02-kartochka-order.md` | §5.2 Экран 2 | /finance/orders/[id] 3-зонный Каркас-Kit — левая хронология, центр шапка + 2 таблицы, правая действия + сводка | 150 | 🔴 P0 |
| 9 | `02-page-orders/02-knopki-zakaz.md` | §6 RBAC + §3 таблица переходов | 4 кнопки по статусам: Создать счёт / Зарегистрировать платёж / Закрыть / Refund — матрица кто-может × статус | 180 | 🔴 P0 |
| 10 | `02-page-payments/02-registraciya-payment.md` | §4 шаг 3 + §6 правила Payment + СПОР-7 | Форма ввода Payment.type='INCOMING': receivedAt (факт), registeredAt (systems), amount>0, dropdown Invoice.id или IS NULL | 200 | 🔴 P0 |
| 11 | `02-page-payments/02-oformlenie-refund.md` | §6 правила Refund + §10 поля Refund + CROSS-OQ-1 | Форма Refund: originalPaymentId (FK, RESTRICT), linkedProductionOrderId/ShipmentId/WriteOffId (опц., SET NULL), amount>0, reason ≥3 chars NOT NULL | 220 | 🔴 P0 |
| 12 | `02-page-payments/02-storno-flow.md` | §6 правила Сторно + §10 Payment | Форма Сторно: type='STORNO', amount<0, correctsPaymentId RESTRICT, notes NOT NULL («почему был ошибочен» ≥3 chars) | 180 | 🔴 P0 |
| 13 | `02-page-payments/02-saldo-i-perechet.md` | §6 правила целостности + §10 Invoice.paidAmount | Авто-пересчёт `saldo = totalAmount − paidAmount` + триггеры (FULLY_PAID → AWAITING_PAYMENT через 1 день → CLOSED) + OQ-005 авто vs manual | 150 | 🔴 P0 |
| 14 | `03-zhiznennyj-cikl/03-statusy-svodka.md` | §3 (таблицы переходов) + §3 статусы Invoice | Сводная таблица: Order 6 + Invoice 5 + Payment 2 + Refund 3 (planned/processed/cancelled) — с определениями | 130 | 🟡 P1 |
| 15 | `03-zhiznennyj-cikl/03-perekhody.md` | §3 таблица переходов + §3 ASCII | Полная таблица переходов всех 3 (Order/Invoice/Payment) + ASCII-диаграмма + явное CLOSED vs CANCELLED для отчётности + 🔴 CROSS-OQ-4 Termination mapping | 200 | 🔴 P0 |
| 16 | `03-zhiznennyj-cikl/03-triggery-modulya.md` | §4 шаг 1 (СПОР-5) + §4 шаг 5 (Refund через ЗК cancel) + §6 правила | Каскадные авто-триггеры: Contract.SIGNED → Order (СПОР-5); ЗК CANCELLED + prepaid → Refund signal (CROSS-OQ-1); WriteOffAct.DEFECT → Refund signal | 180 | 🔴 P0 |
| 17 | `04-pravila/04-biznes-pravila.md` | §6 правила расчёта + §6 правила целостности + §7 RUB + CROSS-OQ-3 | 5 групп правил: авто-сальдо; order не закрывается при balance>0; маржа ТОЛЬКО для shipped + recalc в N дней (OQ-004, CROSS-OQ-3); RUB жёстко (СПОР-14); авто-FULLY_PAID (СПОР-7) | 220 | 🔴 P0 |
| 18 | `04-pravila/04-rbac.md` | §6 RBAC-таблица | 5 ролей × 7 действий: видеть список / создать счёт / регистрировать платёж / закрывать / видеть маржу / Refund / Терминация (Q3: director+accountant для принудительного закрытия) | 150 | 🔴 P0 |
| 19 | `04-pravila/04-storno-vs-refund-pravila.md` | §6 правила Сторно + §6 правила Refund + SC-02 vs SC-05 + CROSS-OQ-1 ГЛАВНЫЙ | Явное архитектурное разделение: Storno (Payment.type='STORNO', amount<0, техническая корректировка опечатки, НЕ меняет статусы) vs Refund (отдельная сущность, amount>0, реальный возврат средств, может перевести Order в CANCELLED) | 220 | 🔴 P0 |

---

## 3. Обязательные EXISTING файлы (6 шт)

| # | Файл | Роль | Комментарий |
|---|---|---|---|
| E1 | `05_Финансы/README.md` | `# 🔵 EXISTING` | Module root, создан при scaffolding PSL-010 |
| E2 | `05_Финансы/00-spr/00-otkrytye-voprosy.md` | `# 🔵 EXISTING` | 5 baseline OQ (Refund triggers, TERMINATED workflow, multi-Invoice payment, late cost recalc, auto vs manual close) для Аналитика Run 1 |
| E3 | `05_Финансы/01-shablon/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |
| E4 | `05_Финансы/02-page-orders/00-README.md` | `# 🔵 EXISTING` | STUB slot — Стратегия C constructor-papka #1 |
| E5 | `05_Финансы/02-page-payments/00-README.md` | `# 🔵 EXISTING` | STUB slot — Стратегия C constructor-papka #2 |
| E6 | `05_Финансы/03-zhiznennyj-cikl/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |
| E7 | `05_Финансы/04-pravila/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |

---

## 4. Strategy C compliance check (2 papki СТРОГО)

| Проверка | Результат |
|---|---|
| ✅ Конструктор-папки = 2 шт СТРОГО: `02-page-orders` + `02-page-payments` | ✅ ЗАФИКСИРОВАНО per LAUNCH-05 §2 ⛔ #3 + CROSS-MODULE-OQ |
| ✅ Naming-fence (`02-page-*` per URL-модели, НЕ `02-konstruktor-*`) | ✅ Только `02-page-*` per URL/воркспейс модели |
| ✅ Иерархия 5 папок по AGENT-METHOD §3 Правило 3.1 | ✅ |
| ✅ Naming-fence (не пересекаемся с Моделировщиком territory) | ✅ `00-entity-fields.md` (НЕ `00-model-finansov.md`, НЕ `00-schema-finansov.md`) |
| ✅ Glossary vs MVP split | ✅ `00-glossary.md` (только термины §0) + `00-mvp-boundaries.md` (отложено §7) |
| ✅ Module-root README в дереве | ✅ `05_Финансы/README.md` (E1) |
| ✅ Cross-OQ маппинг присутствует (4 Q) | ✅ см. §5 |
| ✅ Hard limit ≤ 400 строк на каждый NEW файл | ✅ Все target rows в пределах 100-220 |
| ✅ Один архитектурный уровень (Architect NOT Analyst) | ✅ Только мета-уровень — дерево + таблица, без содержимого правил |
| ✅ Existing файлы сохранены (не дублированы/не удалены) | ✅ 7 EXISTING перечислены (1 root README + 1 OQ + 5 subdir 00-README) |

---

## 5. Cross-OQ mapping (из `99_Справочники/CROSS-MODULE-OQ.md`)

| Cross-OQ | Решается в NEW файле | Как именно |
|---|---|---|
| **🔴 CROSS-OQ-1 Refund** (ГЛАВНЫЙ для Финансов) | `02-page-payments/02-oformlenie-refund.md` (UI форма) + `04-pravila/04-storno-vs-refund-pravila.md` (архитектурное разделение) + `03-zhiznennyj-cikl/03-triggery-modulya.md` (каскадный сигнал от ЗК/WriteOff) + `00-spr/00-svyazi.md` (FK связи) | Refund — отдельная сущность (10 полей: id, orderId RESTRICT, originalPaymentId RESTRICT, linkedProductionOrderId? SET NULL, linkedShipmentId? SET NULL, linkedWriteOffId? SET NULL, amount>0, reason NOT NULL ≥3 chars, processedAt, registeredAt, createdById). Связь с `Order.paidAmount` МАТЕМАТИЧЕСКАЯ (Σ INCOMING − Σ Refund), не FK. Три триггера: (1) ЗК CANCELLED + paid; (2) Contract TERMINATED + paid; (3) WriteOffAct.reason='DEFECT'. При полном Refund на prepaid Order → CANCELLED |
| **CROSS-OQ-2 Reserve** (document-only для Финансов) | `00-spr/00-svyazi.md` | Финансы НЕ управляют Reservation напрямую. Document-only: маржа считается по факту отгрузки (`Shipment.delivered`), не по резервам. Margin formula `Σ (price × qty) − Σ costOfGoodsSold (только shipped)` |
| **CROSS-OQ-3 Cost** | `00-spr/00-svyazi.md` (формула) + `04-pravila/04-biznes-pravila.md` (правила recalc) + `03-zhiznennyj-cikl/03-triggery-modulya.md` (триггеры пересчёта) | Margin = `Order.totalAmount − costOfGoodsSold` (только для shipped позиций). Если себестоимость из Склада пришла с задержкой (после close Order) — открыть заново через `Order.status='CLOSED' → 'AWAITING_PAYMENT'` rollback в течение N дней (OQ-004). Refund НЕ уменьшает `costOfGoodsSold` (товар всё равно пришёл на склад, если был приход). |
| **🔴 CROSS-OQ-4 Termination** | `03-zhiznennyj-cikl/03-perekhody.md` (CANCELLED отличается от CLOSED) + `04-pravila/04-rbac.md` (кто может Терминировать) + `00-spr/00-svyazi.md` (Contract.TERMINATED → Order.CANCELLED каскад односторонний) | Каскад ОДНОНАПРАВЛЕННЫЙ: `Contract.TERMINATED` (новый статус в v1) → `Order.status='CANCELLED'` (новый статус в v1) + ручной Refund на prepaid. `Order.CANCELLED` НЕ возвращает статусы обратно в КП/Договор/ЗК (минимум транзитивных переходов). RBAC: расторжение — только director (Q3 + V-027) |

---

## 6. Footer

**Итог: 19 NEW + 7 EXISTING = 26 файлов** в дереве `05_Финансы/`.

Разбивка NEW:

| Пaпка | Кол-во NEW |
|---|---|
| `00-spr/` | 4 (glossary, mvp-boundaries, entity-fields, svyazi) |
| `01-shablon/` | 2 (shablon-invoice, tipy-payment-invoice) |
| `02-page-orders/` | 3 (spisok-i-filtri, kartochka, knopki-zakaz) |
| `02-page-payments/` | 4 (registraciya-payment, oformlenie-refund 🔴, storno-flow, saldo-i-perechet) |
| `03-zhiznennyj-cikl/` | 3 (statusy-svodka, perekhody, triggery-modulya) |
| `04-pravila/` | 3 (biznes-pravila, rbac, storno-vs-refund-pravila 🔴) |

**Сравнение с другими модулями:**
- `02_Договор/` — 16 NEW + 6 EXISTING = 22 файла (1 constructor-papka)
- `03_Производство/` — 16 NEW + 6 EXISTING = 22 файла (1 constructor-papka)
- `04_Склад/` — 27 NEW + 11 EXISTING = 38 файлов (5 constructor-papoк, OOM-split на 2 сессии)
- **`05_Финансы/` — 19 NEW + 7 EXISTING = 26 файлов (2 constructor-papki)** ✅ в середине диапазона

**Следующий шаг pipeline:** Аналитик Run 1/5 для модуля `05_Финансы/` — наполнит 19 NEW STUB рабочими правилами/инвариантами по матрице `01_КП/LAUNCH-ANALYST.md` (mirrored для каждого модуля). Также потребуется `LAUNCH-ANALYST-05.md` (по образцу `LAUNCH-ANALYST.md` в `01_КП/`).

---

## 7. Версионирование Architect draft

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Baseline. **19 NEW + 7 EXISTING = 26 файлов**. Применены 4 preventive FIX (root README, naming-fence, glossary/MVP split, count math). Strategy C `2 papki` ЗАФИКСИРОВАНО. Cross-OQ-1 активен и явно распределён по 4 NEW файлам (incl. отдельный `04-storno-vs-refund-pravila.md` для архитектурного разделения). CROSS-OQ-3 (Cost) расширен до `04-biznes-pravila.md` + `03-triggery-modulya.md` (per thinker validation) |

> **Architect role boundary** (per AGENT-ROLES §2.1): это **мета-документ — декомпозиция**. Содержимое NEW файлов (правила, поля, переходы, RBAC, формы) — работа **Аналитика Run 1**, не Архитектора.

> **⛔ Соблюдено LAUNCH-05 §2 ⛔ #3:** 2 constructor-papki СТРОГО (`02-page-orders` + `02-page-payments`) — НЕ переименованы, НЕ удвоены, НЕ слиты. Совпадает с URL-моделью `/finance/orders` + `/finance/payments`.

> **⛔ Соблюдено LAUNCH-05 §2 ⛔ #4:** CROSS-OQ-1 (Refund) ОБЯЗАТЕЛЬНО разнесён по 4 NEW файлам — UI форма + правила + триггеры + связи. Отдельный `04-storno-vs-refund-pravila.md` — главный архитектурный артефакт, аналог `03-terminated.md` + `04-termination-rbac.md` в 02 Договор по CROSS-OQ-4.

> **⛔ Соблюдено LAUNCH-05 §2 ⛔ #5:** CROSS-OQ-4 (Termination) ОБЯЗАТЕЛЬНО отражён — `Order.status += 'CANCELLED'` (новое v1) + односторонний каскад `Contract.TERMINATED → Order.CANCELLED` без обратной связи на КП/Договор/ЗК.

> **Thinking advisor:** структура валидирована thinker-with-files-gemini перед записью (1 дополнение: CROSS-OQ-3 явно в `04-biznes-pravila.md` для маржинальности и OQ-004 recalc).
