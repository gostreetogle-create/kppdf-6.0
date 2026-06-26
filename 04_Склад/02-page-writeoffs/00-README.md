# 04_Склад/02-page-writeoffs/00-README.md — UI `/write-off` (Списание)

> **Назначение.** Специализированная страница approve-процесса актов списания АС-XXXX с журналом.

## 0. Контекст

Двухступенчатый процесс: создатель (кладовщик/бухгалтер/директор) формулирует акт → approver (accountant до 5000₽ / director выше) утверждает → авто StockMovement:OUT.

## 1. Ожидаемое содержимое

- `02-spisok-as.md` — таблица WriteOffAct с фильтром по статусу
- `02-okno-approve.md` — approve-flow: approve / reject / возврат на доработку
- `02-prichiny-spisaniya.md` — 7 причин: брак / утеря / inventory_shortage / inventory_surplus / истечение срока / DEFECT / MANUAL
- `02-porogi-approve.md` — авто-маршрутизация по сумме: `< 5000₽ → accountant`; `5000-50000₽ → director`; `≥ 50000₽ → director + журнал`

## 2. Связанные документы

- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §3 (Cost)
- [`../МОДУЛЬ-СКЛАД.md`](../МОДУЛЬ-СКЛАД.md) §5 / страница 5

## ⚠️ Статус STUB

Рабочий слот. **Создаётся в Session 2 Архитектора**.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010b. |
