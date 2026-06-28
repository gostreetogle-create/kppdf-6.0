<<<<<<< HEAD
# 04_Склад/04-pravila/ — Правила модуля «Склад»

> ⚠️ **STUB.** Создан декомпозицией модуля `04_Склад` (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Контент будет наполнен Аналитиком Run 4 (ТЗ-009).

## Назначение

Папка ограничений модуля `Склад` — RBAC (7 ролей × 11 действий, ≥30 правил) и бизнес-правила (immutable movements, availableQty ≥ 0, FIFO, списание, approve-пороги).

## Структура папки

| Файл | Назначение | Источник |
|---|---|---|
| `00-README.md` | Точка входа (этот файл) | — |
| `04-rbac.md` | RBAC Склад ≥30 правил (7 ролей × 11 действий) | ПОДРОБНЫЙ.md §9 + UI.md §7 |
| `04-biznes-pravila.md` | Immutable movements, snapshot, FIFO, availableQty ≥ 0, approve-пороги | ПОДРОБНЫЙ.md §10 + UI.md §5 |

## Принципы наполнения (Аналитик Run 4)

1. **RBAC ≥30 правил** — 7 ролей (admin/manager/director/production/storekeeper/accountant/viewer) × 11 действий. Указывать ограничения (⚠️ только свой поставщик, только свой ЗК).
2. **Бизнес-правила** — immutable StockMovement, availableQty ≥ 0, reservedQty ≥ 0, approve-пороги АС, авто-маршрутизация.

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §9 (RBAC), §10 (связи с модулями).
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §5 (бизнес-правила), §7 (RBAC UX).
- [`../../99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md) — общий RBAC-матрица.
- [`../04-konstruktor-dvizhenia/`](../04-konstruktor-dvizhenia/) — операции, к которым применяются правила.
- [`../04-zhiznennyj-cikl/`](../04-zhiznennyj-cikl/) — процессы, к которым применяются правила.
=======
# 04_Склад/04-pravila/00-README.md — Ограничения и правила Склада

> **Назначение.** Ключевые правила: `StockMovement immutable`, `reservedQuantity <= quantity`, approve-пороги.

## 0. Контекст

Самые регламентированные правила в проекте (8 ключевых правил в `МОДУЛЬ-СКЛАД.md` §3).

## 1. Ожидаемое содержимое

- `04-biznes-pravila.md` — 8 правил: immutability movement, qty >= 0, reserved <= qty, snapshot в Items, writeoff require approve, services → нет StockMovement, RUB жёстко (СПОР-14), sealed counters (СПОР-13)
- `04-rbac.md` — 7 ролей × 11 действий Склада (из `МОДУЛЬ-СКЛАД.md` §6)
- `04-edge-keisy.md` — типовые edge-кейсы: возврат клиента (ещё не в v1), мульти-склад (2 Shipment), приход без ЗП (NULL)

## 2. Связанные документы

- [`../../99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md)
- [`../МОДУЛЬ-СКЛАД.md`](../МОДУЛЬ-СКЛАД.md) §3 Ключевые правила

## ⚠️ Статус STUB

Рабочий слот.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb
