# 05_Финансы/00-spr/00-orgs.md — Организации модуля «Финансы»

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 5 (ТЗ-010).

## Назначение

Документирует **organizations**, связанные с финансовым учётом: банки (для FK к Organization), налоговые органы, контрагенты. Источник: `МОДУЛЬ-ФИНАНСЫ.md` §10 «Поля данных».

## Типы организаций в модуле Финансы

| Тип | Пример | FK | Когда используется |
|---|---|---|---|
| **Банк** | Сбербанк, Тинькофф | `Organization.id` (isActive=true) | Для `Invoice.bankDetails`, `Payment.method` |
| **Налоговый орган** | ИФНС | `Organization.id` | Для налоговых отчётов (УСН/НДС) |
| **Контрагент (клиент)** | ООО «Рога и Копыта» | `customerId → Organization.id` | `Order.customerId`, `Invoice`, `Payment` |
| **Наша организация** | ИП Иванов | `contractorId → Organization.id` | `Order.contractorId` — кому платят |

## FK-связи в финансовых сущностях

```
Order.customerId      → Organization.id  (ON DELETE RESTRICT)
Order.contractorId    → Organization.id  (ON DELETE RESTRICT)
Invoice.orderId       → Order.id         (ON DELETE CASCADE)
Payment.orderId       → Order.id         (ON DELETE RESTRICT)
Refund.orderId        → Order.id         (ON DELETE RESTRICT)
```

## Принципы наполнения (Аналитик Run 5)

1. **Mirror КП/Договор:**Organization — глобальная сущность, не создаётся в Финансах. Только FK.
2. **isActive=true:** архивные организации скрыты из dropdown, но документы видны (СПОР-9).
3. **Связь с Банком:** в v1 банк — просто Organization с `isActive=true`. Интеграция с банком отложена в v2 (МОДУЛЬ-ФИНАНСЫ.md §7).

## Связанные документы

- [`../../01_КП/00-spr/00-orgs.md`](../../01_КП/00-spr/00-orgs.md) — организации КП.
- [`../../99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) §3.1 — сущность Organization.
- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §10 — поля данных Order/Invoice/Payment.
