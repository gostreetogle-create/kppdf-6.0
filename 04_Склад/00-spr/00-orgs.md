# 04_Склад/00-spr/00-orgs.md — Организации модуля «Склад»

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение содержанием — Аналитик Run 4 (ТЗ-009).

## Назначение

Склады (Warehouse) как физические места хранения + Поставщики (Organization с `isSupplier=true`). Справочник складов — основа для `StockRecord`, `StockMovement`, `SupplierDelivery`, `Shipment`, `WriteOffAct`.

## Содержимое (планируется)

### Склады (Warehouse)

Справочник физических складов. Настройка admin-ом через `/warehouse` → вкладка «Склады».

| Поле | Тип | Комментарий |
|---|---|---|
| `id` | UUID | PK |
| `code` | String (unique) | «WH-001» |
| `name` | String | «Основной склад на Профсоюзной» |
| `address` | String? | Физический адрес |
| `isActive` | Boolean | default true (soft-delete) |

**ON DELETE:** `StockRecord → Warehouse` = RESTRICT, `StockMovement → Warehouse` = RESTRICT.

### Поставщики (Suppliers)

Организации из общего справочника с галкой `isSupplier=true`. Выбираются из dropdown при создании `PurchaseOrder` и `SupplierDelivery`.

- **ON DELETE:** `PurchaseOrder → Organization` = RESTRICT, `SupplierDelivery → Organization` = RESTRICT.

### Cross-ref

- `../../01_КП/00-spr/00-orgs.md` — организации КП (продавец + клиент).
- `../../02_Договор/00-spr/00-orgs.md` — стороны Договора.
- `../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §4.1 — Warehouse schema.

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §4.1 — Warehouse.
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §4.1 — UI складов (вкладка «Склады»).
- [`../../01_КП/00-spr/00-orgs.md`](../../01_КП/00-spr/00-orgs.md) — общий справочник организаций.
- [`../../99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) — FK + ON DELETE.
