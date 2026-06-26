# 04_Склад/02-page-purchase/00-README.md — UI `/purchase` (Закупки)

> **Назначение.** Двух-вкладочная страница: «Заявки от системы `PurchaseRequest`» + «Заявки на закупку `PurchaseOrder`» (ЗП-XXXX).

## 0. Контекст

Закупщик видит авто-сигналы от системы (когда товар ниже `minStock`) + создаёт ЗП-XXXX для закупки.

## 1. Ожидаемое содержимое

- `02-tab-zayavki-sistemy.md` — таблица PurchaseRequest: товар, текущий availableQty, требуемый qty
- `02-tab-zp.md` — таблица PurchaseOrder: поставщик, что закупаем, статус (`draft → sent → confirmed → in_transit → received → closed`), итого
- `02-knopka-oformit-zp.md` — конвертация PurchaseRequest → PurchaseOrder одним кликом
- `02-filtri-postavshchikov.md` — поиск по справочнику Organization (`role='SUPPLIER'`)

## 2. Связанные документы

- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §3 (Cost)
- [`../МОДУЛЬ-СКЛАД.md`](../МОДУЛЬ-СКЛАД.md) §5 / страница 4

## ⚠️ Статус STUB

Рабочий слот. **Создаётся в Session 2 Архитектора**.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010b. |
