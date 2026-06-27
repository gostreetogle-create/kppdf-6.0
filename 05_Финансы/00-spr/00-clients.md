# 05_Финансы/00-spr/00-clients.md — Контрагенты модуля «Финансы»

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 5 (ТЗ-010).

## Назначение

Документирует **контрагентов** (клиентов) в контексте финансов. Клиенты — глобальная сущность `Organization`, не создаётся в Финансах. Модуль Финансы использует FK `customerId → Organization.id` для привязки платежей к клиентам. Источник: `МОДУЛЬ-ФИНАНСЫ.md` §10 «Поля данных».

## FK-связи на контрагентов

```
Order.customerId       → Organization.id  (ON DELETE RESTRICT)
Invoice.orderId        → Order.id         (ON DELETE CASCADE)
Payment.orderId        → Order.id         (ON DELETE RESTRICT)
Refund.orderId         → Order.id         (ON DELETE RESTRICT)
Refund.originalPaymentId → Payment.id     (ON DELETE RESTRICT)
```

## Дебиторка по клиентам

| Метрика | Формула | Когда |
|---|---|---|
| **Дебиторка клиента** | `Σ abs(Order.balance)` где `Order.customerId = X` и `status IN ('IN_PROGRESS', 'AWAITING_PAYMENT')` | Ручной ввод / отчёт |
| **Дебиторка общая** | `Σ abs(Order.balance)` по всем активным Order | Дашборд директора |

## Принципы наполнения (Аналитик Run 5)

1. **Hard-link с КП/Договор:** клиент определяется в КП и наследуется через Договор → Order. Финансы НЕ создают клиентов.
2. **Архивные клиенты:** `isActive=false` — скрыты из dropdown, но документы видны (СПОР-9).
3. **Дебиторка — для director/accountant/admin.** Менеджер НЕ видит дебиторку по чужим клиентам (GAP-014 ✅ РЕШЕНО).

## Связанные документы

- [`../../01_КП/00-spr/00-clients.md`](../../01_КП/00-spr/00-clients.md) — клиенты модуля КП.
- [`../../99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) §3.1 — сущность Organization.
- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §6 «Дебиторка» + §10 «Поля данных» — источник V0.
