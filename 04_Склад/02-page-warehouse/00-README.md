# 04_Склад/02-page-warehouse/00-README.md — UI `/warehouse` (Главный экран склада)

> **Назначение.** UI главного экрана склада: остатки StockRecord + журнал движений StockMovement + панель резервов.

## 0. Контекст

Главный экран кладовщика (`storekeeper`). Открыт весь день. Показывает актуальные остатки + последние движения.

## 1. Ожидаемое содержимое

- `02-ostatki-tablica.md` — таблица StockRecord (`quantity / reservedQty / availableQty`) по `Warehouse x Product`
- `02-zhurnal-dvizheniy.md` — лента StockMovement (IN / OUT / TRANSFER / WRITE_OFF)
- `02-filtri-poiska.md` — поиск по SKU/наименованию, фильтр по типу движения
- `02-knopki.md` — «Создать СД» / «Создать ОТК» / «Создать АС» / «Создать ЗП»

## 2. Связанные документы

- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §2 (Reserve)
- [`../МОДУЛЬ-СКЛАД.md`](../МОДУЛЬ-СКЛАД.md) §5 (5 страниц Склада)

## ⚠️ Статус STUB

Рабочий слот. **Стратегия C**: папка = URL.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
