# 05_Финансы/05-pravila/05-biznes-pravila.md — Бизнес-правила модуля «Финансы»

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 5 (ТЗ-010).

## Назначение

Документирует **бизнес-правила и инварианты** модуля «Финансы»: условия валидности операций, ограничения целостности, формулы расчётов. Источник: `МОДУЛЬ-ФИНАНСЫ.md` §6 «Правила расчёта» + «Правила целостности».

## Инварианты (≥25 правил)

### Сальдо (Balance)

| # | Правило | Формула / Описание |
|---|---|---|
| 1 | **Сальдо Invoice** | `Invoice.balance = Invoice.amount − Σ Payment.amount(type=INCOMING) + Σ abs(Payment.amount(type=STORNO))` |
| 2 | **Сальдо Order** | `Order.balance = Order.totalAmount − Order.paidAmount` |
| 3 | **paidAmount Order** | `Order.paidAmount = Σ Payment.amount(type=INCOMING) − Σ Refund.amount` |
| 4 | **Пересчёт при платеже** | При каждом новом Payment → пересчёт Invoice.balance + Order.balance |
| 5 | **Закрытие Order** | Только если `Invoice.balance = 0` для ВСЕХ Invoice в Order |

### Сторно (STORNO) — 5 правил

| # | Правило |
|---|---|
| 6 | **Нулевое влияние на бизнес-статусы:** ЗК/Договор/Order НЕ меняются |
| 7 | **Сальдо восстанавливается:** `Invoice.paidAmount` и `Order.balance` возвращаются в исходное |
| 8 | **Запрет на цепочки:** Нельзя сделать STORNO на STORNO (`Payment.correctsPaymentId` не может указывать на STORNO) |
| 9 | **Обязателен комментарий:** `Payment.notes NOT NULL` при type='STORNO' |
| 10 | **В UI:** отображается рядом с ошибочным платежом серой/перечёркнутой строкой |

### Refund — 5 правил

| # | Правило |
|---|---|
| 11 | **Бизнес-триггер:** ЗК отменён (СПОР-12), возврат товара, брак |
| 12 | **Лимит суммы:** `Σ Refund.amount` по `originalPaymentId` ≤ суммы платежа |
| 13 | **Полный возврат + отменённый ЗК** → `Order.status = 'CANCELLED'` |
| 14 | **Связь с источником:** `linkedProductionOrderId?` / `linkedShipmentId?` / `linkedWriteOffId?` |
| 15 | **Обязательна причина:** `Refund.reason NOT NULL` (≥ 3 символов) |

### Invoice — 5 правил

| # | Правило |
|---|---|
| 16 | **Тип Invoice:** ADVANCE / MAIN / ADJUSTMENT (Q1 ✅ РЕШЕНО) |
| 17 | **НДС авто:** разделение по `vatRate` Договора (Q2 ✅ РЕШЕНО), 20% в v1 (СПОР-15) |
| 18 | **Просрочка:** `OVERDUE` на следующий день после `dueDate` при `balance > 0` |
| 19 | **Нельзя удалить ISSUED Invoice** — только сторнировать или аннулировать |
| 20 | **Нумерация:** отдельный счётчик `Counter.type='invoice'` (СПОР-13) |

### Order — 5 правил

| # | Правило |
|---|---|
| 21 | **Триггер создания:** `Contract.status='SIGNED'` (СПОР-5), авто-создание DRAFT → IN_PROGRESS |
| 22 | **CANCELLED необратим:** Order уходит в архив для аудита |
| 23 | **Currency = RUB жёстко** (СПОР-14), мультивалюта — v2 |
| 24 | **Нумерация:** отдельный счётчик `Counter.type='order'` (СПОР-13) |
| 25 | **Закрытие двухступенчатое:** бухгалтер + директор (Q3 ✅ РЕШЕНО) |

## Связь с предыдущими модулями

| Связь | Правило |
|---|---|
| **Order ↔ КП** | При закрытии Order — КП остаётся «Оплачено». КП **не возвращается** в «принято». |
| **Order ↔ Договор** | Если Договор `TERMINATED` → Order `CANCELLED` (СПОР-12). |
| **Order ↔ Склад** | Себестоимость только для **отгруженных** позиций (`Shipment.status='SHIPPED'`). |
| **Order ↔ Производство** | `ProductionOrder.status='DONE'` → триггер для `AWAITING_PAYMENT`. |

## Принципы наполнения (Аналитик Run 5)

1. **Mirror КП:** начать с `01_КП/04-pravila/04-biznes-pravila.md` для consistency.
2. **Каждый инвариант = строка в Prisma validation** (или middleware). Без неопределённостей.
3. **Cross-ref** на `SCHEMA-CONSOLIDATED.md` для FK + ON DELETE.

## Связанные документы

- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §6 «Правила расчёта» + «Правила целостности» — источник V0.
- [`../../99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) §3 — сущности + FK + ON DELETE.
- [`../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — СПОР-5/7/12/13/14/15.
- [`./05-rbac.md`](./05-rbac.md) — RBAC (кто может выполнять действия).
