# 05_Финансы/05-konstruktor-finansov/05-refundy.md — Конструктор рефандов (Refund)

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 5 (ТЗ-010).

## Назначение

Документирует **конструктор рефандов (Refund)** — отдельную сущность возврата денег клиенту. **НЕ отрицательный Payment** (GAP-023 ✅ РЕШЕНО). Источник: `МОДУЛЬ-ФИНАНСЫ.md` §6 «Правила Refund» + §10 «Поля Refund».

## Refund ≠ Payment

| Параметр | Payment (STORNO) | Refund |
|---|---|---|
| **Суть** | Исправление опечатки бухгалтера | Реальный возврат денег клиенту |
| **Сумма** | `< 0` (отрицательная) | `> 0` (положительная, вычитается математически) |
| **Триггер** | Опечатка в сумме/реквизитах | ЗК отменён, возврат товара, брак |
| **FK** | `correctsPaymentId → Payment` | `originalPaymentId → Payment` |
| **Влияние на Order** | Нулевое (только сальдо) | Может перевести в `CANCELLED` |

## Поля Refund (from §10)

| Поле | Тип | Зачем |
|---|---|---|
| `id` | `Ref-XXXX` | Уникальный номер (отдельный счётчик Counter.type='refund') |
| `orderId` | FK → Order | ON DELETE RESTRICT |
| `originalPaymentId` | FK → Payment | Какой платёж возвращаем (ON DELETE RESTRICT) |
| `linkedProductionOrderId` | FK → ProductionOrder (опц.) | Отмена ЗК (ON DELETE SET NULL) |
| `linkedShipmentId` | FK → Shipment (опц.) | Возврат товара на склад (ON DELETE SET NULL) |
| `linkedWriteOffId` | FK → WriteOffAct (опц.) | Брак / списание (ON DELETE SET NULL) |
| `amount` | decimal | Сумма возврата (строго > 0) |
| `reason` | String NOT NULL | ≥ 3 символов (причина возврата) |
| `processedAt` | DateTime | Когда фактически вернули деньги |
| `registeredAt` | DateTime | Когда бухгалтер внёс |
| `createdById` | FK → User | Кто оформил |

## Правила Refund (from §6)

1. **Бизнес-триггер:** ЗК отменён (СПОР-12), клиент передумал, пришёл брак, возврат товара через `WriteOffAct.reason='DEFECT'`.
2. **Лимит суммы:** `Σ Refund.amount` по конкретному `originalPaymentId` ≤ суммы самого платежа.
3. **Изменение статуса Order:** Если проведён Refund на всю оставшуюся сумму при отменённом ЗК → `Order.status = 'CANCELLED'`.
4. **Связь с источником:** `linkedProductionOrderId?` (отмена ЗК), `linkedShipmentId?` / `linkedWriteOffId?` (возврат товара).
5. **Обязательна причина:** `Refund.reason NOT NULL` (свободный текст, минимум 3 символа).

## Формула paidAmount

```
Order.paidAmount = Σ Payment.amount(type=INCOMING) − Σ Refund.amount
```

## Принципы наполнения (Аналитик Run 5)

1. **Только бухгалтер/директор** может оформлять Refund (RBAC §6).
2. **SPOR-12:** ЗК отменён → КП остаётся «Оплачено» + Refund через Финансы.
3. **SPOR-13:** отдельный счётчик `Counter.type='refund'`.

## Связанные документы

- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §6 «Правила Refund» + §10 «Поля Refund» — источник V0.
- [`../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — СПОР-12 (ЗК отменён → КП), GAP-023 (Refund ≠ Payment).
- [`./05-platezhi.md`](./05-platezhi.md) — конструктор платежей (Payment).
- [`../05-pravila/05-biznes-pravila.md`](../05-pravila/05-biznes-pravila.md) — инварианты Refund.
