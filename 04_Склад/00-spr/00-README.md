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
