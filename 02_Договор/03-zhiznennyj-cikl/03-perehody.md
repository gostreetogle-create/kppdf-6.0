# 02_Договор/03-zhiznennyj-cikl/03-perehody.md — Разрешённые переходы статусов

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §2](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 2 (ТЗ-007).

## Назначение

Документирует **все разрешённые переходы** между статусами Договора + RBAC + preconditions для каждого. Источник: `МОДУЛЬ-ДОГОВОР.md` §2 диаграмма + §5 «Бизнес-правила».

## Диаграмма переходов (полная)

```
DRAFT ───send──→ SENT ───sign──→ SIGNED_CLIENT ───activate──→ IN_PROGRESS ───finish──→ COMPLETED ───archive──→ ARCHIVED
                  ↑                   │                              │
                  │                   │                              │
                  └───recall───────────┘                              │
                                                                      │
       ┌─────── любой кроме ARCHIVED ───────────→ TERMINATED ◀─────┘
       │
       └──← COMPLETED тоже можно TERMINATED (если клиент отказался платить после приёмки)
```

## Разрешённые переходы (12 штук)

| # | From | To | Действие | RBAC | Preconditions |
|---|---|---|---|---|---|
| 1 | `DRAFT` | `SENT` | Отправить клиенту | admin / manager / director | Договор не пустой (хотя бы 1 Item) |
| 2 | `SENT` | `SIGNED_CLIENT` | Подписал клиент (ручная отметка) | admin / manager / director | — |
| 3 | `SENT` | `DRAFT` | Отозвать (ошибка отправки) | admin / manager / director | — |
| 4 | `SIGNED_CLIENT` | `IN_PROGRESS` | Активировать (связь с ЗК) | admin / director | Связан ProductionOrder (auto) |
| 5 | `SIGNED_CLIENT` | `SENT` | Вернуть в работу (отмена подписи) | admin / manager / director | — |
| 6 | `IN_PROGRESS` | `COMPLETED` | Производство завершено | auto (через ЗК → COMPLETED) | Связанный ЗК = COMPLETED |
| 7 | `COMPLETED` | `ARCHIVED` | Архивировать (auto через 90 дней ИЛИ ручной admin) | admin | через 90 дней после COMPLETED ИЛИ ручная команда |
| 8 | `ARCHIVED` | `COMPLETED` | Восстановить (ошибка архивирования) | admin | — |
| 9 | `DRAFT` | `ARCHIVED` | Архивировать вручную (ошибка создания) | admin / manager | — |
| 10 | **любой (кроме ARCHIVED)** | `TERMINATED` | Расторгнуть (финальный). Включает частный случай DRAFT → TERMINATED (отмена до отправки): для DRAFT достаточно admin/manager/director, для остальных — только admin/director | admin / director (для DRAFT также manager) | Письменное уведомление клиента (для НЕ-DRAFT, Save file в доказательство) |
| 11 | — | `DRAFT` | Создать (из КП при конвертации) | auto (через КП → Договор) | Proposal.status ∈ {SENT, ACCEPTED} |

## Невалидные переходы (запрещены)

- `TERMINATED` → любой живой статус (финальный)
- `ARCHIVED` → `DRAFT` / `SENT` / `SIGNED_CLIENT` (только → COMPLETED → ARCHIVED → COMPLETED → ARCHIVED цикл)
- `COMPLETED` → `IN_PROGRESS` (если нужна доработка → вместо этого «Создать новую версию»)

## Связь с КП при конвертации

- `Proposal.status = SENT_TO_CLIENT | ACCEPTED` → разрешает конвертацию → создание `Contract.status = DRAFT`.
- **Запрещено** конвертировать из `PAID` (СПОР-11 + V-024, см. `МОДУЛЬ-ДОГОВОР.md` §5.1 правило 2). После оплаты Договор «задним числом» — юридически кривой документ.

## Триггер от подписания → создание Order в Финансах

> **СПОР-5 финальное решение:** при `Contract.status = SIGNED_CLIENT` **автоматически** создаётся `Order` в Модуле Финансы в статусе `draft` → auto-переход в `in_progress`. Связь `Order.contractId` объявлена как **NOT NULL, RESTRICT ON DELETE**.
>
> Подробнее — `МОДУЛЬ-ДОГОВОР.md` §11.

## Принципы наполнения (Аналитик Run 2)

1. **Каждый переход = таблица правил** (RBAC + preconditions + side-effects).
2. **Side-effects** = авто-создание Order, авто-приход на Склад и т.п. (cross-ref в `МОДУЛЬ-ФИНАНСЫ` / `МОДУЛЬ-ПРОИЗВОДСТВО`).
3. **Audit log** каждый переход (кто, когда, из какого статуса).

## Связанные документы

- [`./03-statusy.md`](./03-statusy.md) — определения статусов.
- [`../МОДУЛЬ-ДОГОВОР.md`](../МОДУЛЬ-ДОГОВОР.md) §2 + §5 — источник V0.
- [`../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — СПОР-5, СПОР-11, СПОР-13 (закрытые).
- [`../04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md) — инварианты для каждого перехода (Run 2 наполнение).
