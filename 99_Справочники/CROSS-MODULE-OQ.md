# 99_Справочники/CROSS-MODULE-OQ.md — Сквозные Open Questions между 4 модулями

> **Назначение.** При параллельной декомпозиции 4 модулей (Договор / Производство / Склад / Финансы) возникает риск **дрифта** — каждый Архитектор независимо решает cross-module edge-case по-своему. Этот файл фиксирует 4 СКВОЗНЫХ вопроса, на которые **все 4 LAUNCH-ARCHITECT-{X}.md ОБЯЗАНЫ ссылаться** при декомпозиции.
>
> ⛔ **Использование:** каждый Архитектор добавляет этот файл в свой `Пакет A` (инфраструктура) как 🔴 P0 attach. Без учёта этих 4 Q — декомпозиция считается неполной.

## 0. Контекст

4 модуля связаны через FK + авто-триггеры. Per [`SCHEMA-CONSOLIDATED.md`](SCHEMA-CONSOLIDATED.md), основные кросс-модульные цепочки:

- **Договор → ЗК → Склад → Финансы** (happy path: Contract SIGNED → Order, КП PAID → ProductionOrder, Production COMPLETED → Shipment, Shipment delivered → OrderClosing)
- **ЗК cancelled → Refund** (СПОР-12 + GAP-023 ✅)
- **Договор TERMINATED → Order CANCELLED** (СПОР-3 + V-027 ✅)
- **Reserve ↔ Proposal lifecycle** (Reservation создаётся при SENT/ACCEPTED, снимается при REJECTED/ARCHIVED)

Эти event-stream образуют 4 сквозные OQ. Ниже — фиксация.

## 1. Сквозные Q (4 шт)

### CROSS-OQ-1: Refund (возврат денег клиенту)

**Контекст:** `Refund` — **отдельная сущность** (GAP-023 ✅ 24.06.2026), НЕ отрицательный `Payment`. `amount > 0` (Decimal, всегда положительная, вычитается математически из `Order.paidAmount` по формуле `Σ INCOMING - Σ STORNO - Σ Refund`). `originalPaymentId NOT NULL` + `RESTRICT` (см. SCHEMA-CONSOLIDATED §1).

**Триггеры (3 источника):**
1. **ЗК отменён после оплаты** (`ProductionOrder.status='CANCELLED'` + КП `PAID`) → бухгалтер оформляет Refund с `linkedProductionOrderId`
2. **Договор расторгнут после частичной оплаты** (`Contract.status='TERMINATED'` + `Order.paidAmount > 0`) → Refund + связь через `Order.id`
3. **Возврат товара через списание** (`WriteOffAct.reason='DEFECT'` `status='COMPLETED'`) → Refund + `linkedWriteOffId`

**Что должна делать декомпозиция каждого модуля:**

| Модуль | Зона ответственности Архитектора |
|---|---|
| 02_Договор | UI-flow при `TERMINATED` после `paid`: показать подсказку «Оформить Refund» (связь через `Order.id`). Не дублировать сущность Refund в `/02_Договор/` — это Финансы. |
| 03_Производство | UI-маркер для начальника производства при `CANCELLED` после `paid`: «ЗК отменён → уведомить бухгалтера для оформления Refund». |
| 04_Склад | `WriteOffAct.reason='DEFECT'` → авто-сигнал в Финансы или ручной? Указать в правилах (предположительно — ручной сигнал с pre-filled `linkedWriteOffId`). |
| 05_Финансы | Декомпозировать `Refund` отдельной сущностью (10 полей: id, orderId FK RESTRICT, originalPaymentId FK RESTRICT, linkedProductionOrderId? SET NULL, linkedShipmentId? SET NULL, linkedWriteOffId? SET NULL, amount > 0, reason NOT NULL ≥ 3 chars, processedAt, registeredAt, createdById). Связь с `Order.paidAmount` математическая, не FK. |

### CROSS-OQ-2: Reserve (Резерв товара под КП)

**Контекст:** `Reservation` — «заморозка» товара под активные КП (см. SCHEMA-CONSOLIDATED §1 + МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ §4.4). Реализуется через таблицу Reservation (`proposalId, productId, quantity, createdAt`). Снимается при `Proposal.status='REJECTED'` или `='ARCHIVED'`. Формула `availableQty = quantity - sum Reservations`.

**Когда снимается (4 источника):**
1. КП `REJECTED` (явный отказ клиента)
2. КП `ARCHIVED` (архивация)
3. КП `CONVERTED` → Договор подписан (резерв переходит на Договор или снимается и потом заново ставится?)
4. КП `EXPIRED` (срок давности) — отложено в v2

| Модуль | Декомпозиция |
|---|---|
| 02_Договор | При `SIGN Договор` — резерв снимается или сохраняется? Рекомендация: снимается (т.к. далее ЗК авто-создаёт свой резерв на уровне Shipment). Документировать как OQ-001 для Договор run1. |
| 03_Производство | НЕ управляет Reservation напрямую — это Склад. Но ЗК completion/cancel может влиять. Документировать интерфейс. |
| 04_Склад | `Reservation` — отдельная таблица в Складе. Авто-создание при `Proposal.SENT/ACCEPTED`, авто-снятие при `REJECTED/ARCHIVED`. В UI — список активных резервов на `/warehouse`. |
| 05_Финансы | НЕ влияет. Document only: маржа рассчитывается по факту отгрузки, не по резервам. |

### CROSS-OQ-3: Cost (Себестоимость и её влияние на маржу)

**Контекст:** Себестоимость (`costOfGoodsSold`) фиксируется в `StockMovement.sourcePurchasePrice` при приходе. Накапливается в `StockRecord.lastCost`. Используется в `Shipment.costOfGoodsSold` → `OrderClosing.costOfGoodsSold`.

**Формула маржи:** `Order.margin = Order.totalAmount - costOfGoodsSold` (только для shipped позиций).

| Модуль | Декомпозиция |
|---|---|
| 02_Договор | Цена Договора = базовая цена Product + наценка юрлица. Себестоимость НЕ хранится в ContractItem. |
| 03_Производство | При авто-`StockMovement:IN, reason='PRODUCTION'` себестоимость ЗК (`ProductionTask.costOfGoods`) → StockRecord.lastCost. |
| 04_Склад | `StockMovement.sourcePurchasePrice` (SupplierDelivery) или `costOfProduction` (ЗК авто-приход). `Shipment.costOfGoodsSold` = сумма по позициям. |
| 05_Финансы | `Order.margin` обновляется с задержкой при Shipment.delivered. Возможен recalc для закрытого Order в течение N дней (см. OQ-004). |

### CROSS-OQ-4: Termination (Расторжение / Отмена)

**Контекст:** Расширения enum-ов v1:
- `Contract.status += 'TERMINATED'` (СПОР-3 ✅ 24.06.2026)
- `ProductionOrder.status = 'CANCELLED'` (существует с v6)
- `Order.status += 'CANCELLED'` (V-027 ✅)

**Каскад (ТОЛЬКО ОДНОНАПРАВЛЕННЫЙ, нет обратных):**
- `Contract.TERMINATED` → `Order.status='CANCELLED'` + ручной Refund на prepaid
- `ProductionOrder.CANCELLED` (после PAID КП) → КП остаётся PAID + финансы получают сигнал для Refund
- `Order.CANCELLED` НЕ каскадирует обратно на КП/Договор

| Модуль | Декомпозиция |
|---|---|
| 02_Договор | Кнопка «Расторгнуть» доступна только director (RBAC). При TERMINATED + prepaid → UI-флаг «Оформить Refund» для бухгалтера. |
| 03_Производство | Кнопка «Отменить ЗК» доступна начальнику производства / директору. При CANCELLED + PAID КП → UI-маркер «Уведомить бухгалтера для Refund». |
| 04_Склад | При ЗК CANCELLED после частичного производства — встречный StockMovement для возврата полуфабрикатов? Открытый вопрос для Аналитика. |
| 05_Финансы | `Order.status CANCELLED` ≠ `CLOSED` — разный signage в отчётности. При TERMINATED/CANCELLED с prepaid — Refund. |

## 2. Конкретные OQ на каждый модуль (5 × 4 = 20 OQ)

> Все 5 baseline OQ каждого модуля уже зафиксированы в `XX/00-spr/00-otkrytye-voprosy.md`. Здесь сводка + cross-link.

| # | Тип | 02_Договор | 03_Производство | 04_Склад | 05_Финансы |
|---|---|---|---|---|---|
| 1 | cross | N ЗК из Договора в v1? | Refund при ЗК cancelled? | WriteOffAct влияет на маржу? | Точные триггеры Refund? |
| 2 | свой | Редактирование Спецификации после SENT? | Частичная отгрузка при PARTIAL? | Мульти-склад: 1 Shipment или N? | Кто возвращает аванс (менеджер/бухгалтер)? |
| 3 | свой/cross | КП меняется при Договоре COMPLETED? | Конфликт резервов (5 ЗК на 1 товар)? | Shipment.RETURNED vs WriteOffAct.DEFECT? | 1 Payment покрывает 2 Invoice? |
| 4 | свой/cross | Смена юрлица после SIGNED? | Акт для монтажа-type задачи? | СД без ЗП (машина без предупреждения)? | Поздняя себестоимость → пересчёт маржи? |
| 5 | RBAC | Кто ставит TERMINATED? | Кладовщик блокирует ЗК по браку? | Inventory surplus по какой себестоимости? | Авто vs manual close Invoice? |

## 3. Связь с уже зафиксированными решениями

| Q | Уже зафиксировано в | Статус |
|---|---|---|
| CROSS-OQ-1 Refund | SCHEMA-CONSOLIDATED §1 (Refund сущность) + GLOSSARY-MASTER §1.2 + СПОРНЫЕ-МОМЕНТЫ СПОР-12 + GAP-023 ✅ | ✅ зафиксировано |
| CROSS-OQ-2 Reserve | SCHEMA-CONSOLIDATED §1 (Reservation) + МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ §4.4 | ✅ зафиксировано (правила снятия — на Аналитика Run 1) |
| CROSS-OQ-3 Cost | SCHEMA-CONSOLIDATED §1 (StockMovement.sourcePurchasePrice) + МОДУЛЬ-ФИНАНСЫ §10 поля Shipment.costOfGoodsSold | ✅ зафиксировано |
| CROSS-OQ-4 Termination | SCHEMA-CONSOLIDATED §3.2 (Contract TERMINATED) + §3.3 (PO CANCELLED) + §3.11 (Order CANCELLED) | ✅ зафиксировано |

## 4. Связанные документы

- [`GLOSSARY-MASTER.md`](GLOSSARY-MASTER.md) §1 сущности + §2 процессы + §5 метрики
- [`SCHEMA-CONSOLIDATED.md`](SCHEMA-CONSOLIDATED.md) — 32 модели, ON DELETE правила
- [`СПОРНЫЕ-МОМЕНТЫ.md`](СПОРНЫЕ-МОМЕНТЫ.md) — 15 СПОР (особенно 9, 11, 12, 13, 14, 15)
- [`OPEN-QUESTIONS-MASTER.md`](OPEN-QUESTIONS-MASTER.md) — 38 ✅ РЕШЕНО
- 4 × LAUNCH-ARCHITECT-{02,03,04,05}.md — каждый **ссылается** на этот файл в §2 промпт

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | Baseline создан Архитектором при scaffolding для 4 параллельных LAUNCH-ARCHITECT (PSL-010). Источник: thinker risk mitigation #2/#5. |
