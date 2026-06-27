# 04_Склад/04-konstruktor-dvizhenia/04-prihod.md — Приход от поставщика (SupplierDelivery)

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение содержанием — Аналитик Run 4 (ТЗ-009).

## Назначение

Документ приёмки товара от поставщика — `SupplierDelivery (СД-XXXX)`. Создаёт `StockMovement.type=in, reason=purchase` при завершении. Это **самая частая операция** кладовщика (сценарий 1 из ПОДРОБНЫЙ.md §2).

## Источники

- **Источник 1:** `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §5 — полная схема SupplierDelivery (поля, дочерняя таблица SupplierDeliveryItem, жизненный цикл §5.3, триггеры §5.4, FK §3).
- **Источник 2:** `МОДУЛЬ-СКЛАД-UI.md` §4.2 — экран `/supplier-deliveries` (фильтры, таблица, карточка, кнопки «Принять/Отменить»).

## Содержимое (планируется)

### §1 Поля документа
- SupplierDelivery: `number (СД-XXXX)`, `status (planned→completed)`, `supplierId`, `warehouseId`, `supplierPurchaseOrderId?`, `parentContractId?`, invoice-поля, dates, amounts, currency=RUB, notes, RBAC-поля.
- SupplierDeliveryItem: `productId`, snapshot-поля, `quantityExpected`, `quantityReceived`, `unitCost`, `totalCost`, `qualityNotes`.

### §2 Жизненный цикл
- 6 статусов: `planned → in_transit → received → partially_received → completed → cancelled`.
- Кто двигает: кладовщик (received/completed), закупщик (in_transit/cancelled).

### §3 Триггеры StockMovement
- При `completed`: авто-создание `StockMovement: type=in, reason=purchase, quantity=quantityReceived` для каждого SupplierDeliveryItem.
- При `partially_received`: кладовщик должен оформить WriteOffAct на разницу.

### §4 Связи
- → PurchaseOrder (supplierPurchaseOrderId)
- → StockRecord (через StockMovement)
- → WriteOffAct (при расхождениях qtyExpected > qtyReceived)

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §5 (полная схема СД).
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §4.2 (экран приходов).
- [`../04-zhiznennyj-cikl/04-statusy.md`](../04-zhiznennyj-cikl/04-statusy.md) — статусы СД.
- [`../04-konstruktor-dvizhenia/04-rashod.md`](04-rashod.md) — расход (зеркальная операция).
- [`../04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) — RBAC для приёмки.
- [`../04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md) — правило «Принять частично = АС».
