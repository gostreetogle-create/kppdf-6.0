<<<<<<< HEAD
# 04_Склад/00-spr/ — Справочники модуля «Склад»

> ⚠️ **STUB.** Создан декомпозицией модуля `04_Склад` (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Контент будет наполнен Аналитиком в **Run 4 / 5 Аналитик Склад** (ТЗ-009).

## Назначение

Папка фундаментальных справочников модуля `Склад` — глоссарий, склады, поставщики, товары (SKU/minStock), клиенты (владельцы остатков), out-of-scope, открытые вопросы. Используется как **единственный источник истины** для всех downstream-документов (СД/ОТК/АС/ЗП, StockRecord, StockMovement).

## Структура папки

| Файл | Назначение | Объём (план) |
|---|---|---|
| `00-README.md` | Точка входа папки (этот файл) | ~50 строк |
| `00-glossary.md` | Глоссарий терминов Склада (Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest, SupplierDelivery, Shipment, WriteOffAct, PurchaseOrder, availableQty, minStock, snapshot) | ~100 строк |
| `00-orgs.md` | Склады (Warehouse) физические + Suppliers (Organization.isSupplier=true) | ~80 строк |
| `00-products.md` | SKU-система, minStock, категории товаров | ~80 строк |
| `00-clients.md` | Кому принадлежат остатки (customerId в SupplierDelivery/Shipment) | ~60 строк |
| `00-out-of-scope.md` | Что НЕ входит (mobile scanner, штрих-коды, multi-currency, ML-прогноз) | ~80 строк |
| `00-otkrytye-voprosy.md` | **5 baseline открытых вопросов** для Run 4 Аналитика | ~120 строк |

## Принципы наполнения (Аналитик Run 4)

1. **Два источника:** МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md (§0–§4 для базовых 5 сущностей, §5–§8 для 4 НОВЫХ) + МОДУЛЬ-СКЛАД-UI.md (§0 для пользовательских терминов). Термины должны совпадать с `GLOSSARY-MASTER.md`.
2. **Snapshot semantics:** все поля на момент операции — фиксируются. Изменения в Product/Organization НЕ влияют на старые документы.
3. **Sealed counters:** каждый префикс (СД/ОТК/АС/ЗП) имеет отдельный счётчик (СПОР-13).
4. **RUB жёстко в v1** (СПОР-14).
5. **5 baseline OQ** уже стоят в `00-otkrytye-voprosy.md` — новые → `OPEN-QUESTIONS-MASTER.md`.

## Связанные документы

- [`../../01_КП/00-spr/00-README.md`](../../01_КП/00-spr/00-README.md) — зеркальный entrypoint для КП.
- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) — основной источник (V0).
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) — UI-каркасы (V0).
- [`../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md`](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §4 — план декомпозиции.
- [`../../99_Справочники/GLOSSARY-MASTER.md`](../../99_Справочники/GLOSSARY-MASTER.md) — общий глоссарий проекта.

> **Hard limit:** файлы STUB ≤ 250 строк. Hard limit папки ≤ 700 строк суммарно.
=======
# 04_Склад/00-spr/00-README.md — Справочники модуля Склад

> **Назначение.** Справочные материалы Склада: глоссарий, 4 новые сущности v6 (SupplierDelivery / Shipment / WriteOffAct / PurchaseOrder) + 4 базовые (Warehouse / StockRecord / StockMovement / Reservation / PurchaseRequest).

## 0. Контекст

Фундамент модуля — самое большое количество сущностей в v6 (4 новые + 4 базовые = 8 StockEntity).

## 1. Ожидаемое содержимое

- [`00-glossary.md`](00-glossary.md) — все термины Склада (14+ в `МОДУЛЬ-СКЛАД.md` §0)
- [`00-otkrytye-voprosy.md`](00-otkrytye-voprosy.md) — ✅ 5 baseline OQ
- `00-warehouse-spravochnik.md` — справочник складов `Warehouse`
- `00-supplierdelivery-statusy.md` — 6 статусов СД
- `00-shipment-statusy.md` — 6 статусов ОТК
- `00-writeoffact-statusy-reasons.md` — 5 статусов + 7 причин списания
- `00-purchaseorder-statusy.md` — 8 статусов ЗП
- `00-rbac-summary.md` — сводка прав 7 ролей на действия с 4 сущностями

## 2. Связанные документы

- [`../../99_Справочники/GLOSSARY-MASTER.md`](../../99_Справочники/GLOSSARY-MASTER.md) §1.3 Складские документы
- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §1/§2/§3

## ⚠️ Статус STUB

Рабочий слот. **Заполняется в 2 сессиях (Session 1 + Session 2)** — см. `../LAUNCH-ARCHITECT-04.md`.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb
