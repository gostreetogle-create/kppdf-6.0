# 04_Склад/04-konstruktor-dvizhenia/04-rashod.md — Отгрузка клиенту (Shipment)

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение содержанием — Аналитик Run 4 (ТЗ-009).

## Назначение

Документ отгрузки товара клиенту — `Shipment (ОТК-XXXX)`. Создаёт `StockMovement.type=out, reason=sale` при фактической отгрузке. Источник: завершённый ЗК или КП напрямую (сценарий R1).

## Источники

- **Источник 1:** `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §6 — полная схема Shipment (поля, дочерняя таблица ShipmentItem, жизненный цикл §6.3, триггеры §6.4, FK §3).
- **Источник 2:** `МОДУЛЬ-СКЛАД-UI.md` §4.3 — экран `/shipments` (фильтры, таблица, карточка, авто-предложение при завершении ЗК).

## Содержимое (планируется)

### §1 Поля документа
- Shipment: `number (ОТК-XXXX)`, `status (planned→delivered)`, `warehouseId`, `productionOrderId?`, `proposalId?`, `contractId?`, `customerId`, delivery-поля, tracking, responsibleUserId, RBAC-поля.
- ShipmentItem: `productId`, snapshot-поля, `quantityPlanned`, `quantityActual`, `costPrice`.

### §2 Жизненный цикл
- 6 статусов: `planned → packed → shipped → delivered` (+ `partial`, `cancelled`).
- Триггер StockMovement: при `shipped` → авто-создание `StockMovement: out`.

### §3 Триггеры
- **Авто-предложение** при `ProductionOrder → Завершён` (если задачи типа «Товар»). НЕ авто-создание — кладовщик подтверждает кнопкой.
- При `shipped`: `StockMovement: type=out, reason=sale, quantity=quantityActual`.
- При `delivered`: `OrderClosing.progress += quantityActual` (Финансы, v1 — ручное).

### §4 Связи
- → ProductionOrder (productionOrderId) — главный источник.
- → Proposal (proposalId) — отгрузка напрямую по КП (R1).
- → Contract (contractId) — отгрузка по Договору.
- → StockRecord (через StockMovement).
- → OrderClosing (Финансы, при delivered).

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §6 (полная схема ОТК).
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §4.3 (экран отгрузок).
- [`../04-zhiznennyj-cikl/04-statusy.md`](../04-zhiznennyj-cikl/04-statusy.md) — статусы ОТК.
- [`../04-konstruktor-dvizhenia/04-prihod.md`](04-prihod.md) — приход (зеркальная операция).
- [`../../03_Производство/`](../../03_Производство/) — модуль-источник (ЗК→Shipment).
- [`../04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) — RBAC для отгрузки.
