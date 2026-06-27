# 04_Склад/04-zhiznennyj-cikl/04-inventarizacia.md — Инвентаризация

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение содержанием — Аналитик Run 4 (ТЗ-009).

## Назначение

Периодическая сверка физических остатков с учётными. Раз в месяц кладовщик проверяет каждый товар: факт ≠ учёту → оформляется WriteOffAct с `reason=inventory_shortage` или `inventory_surplus`.

## Источники

- **Источник 1:** `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §2.5 — сценарий инвентаризации (5 шагов).
- **Источник 2:** `МОДУЛЬ-СКЛАД-UI.md` §4.5 — экран `/write-off` (approve-процесс для inventory).

## Содержимое (планируется)

### §1 Процесс

1. Кладовщик открывает «Инвентаризация», выбирает склад.
2. Для каждого товара вводит фактическое количество (ручной ввод или будущий сканер).
3. Система сравнивает факт с `StockRecord.quantity`.
4. Если расхождение — предлагается оформить `WriteOffAct`:
   - `reason=inventory_shortage` (факт < учёта) → расход минус.
   - `reason=inventory_surplus` (факт > учёта) → приход плюс.
5. АС отправляется на approve (director + комиссия ≥3 человека).

### §2 Особенности

- `inventory_shortage` **всегда** требует director + комиссия (минимум 3 человека в `commissionMembers`).
- Комиссия — не digital-подписи, а ФИО в поле `commissionMembers`.
- Авто-маршрутизация: `inventory_shortage` → director (независимо от суммы).

### §3 Связи

- → WriteOffAct (reason=inventory_shortage/inventory_surplus)
- → StockRecord (корректировка через StockMovement после approve)

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §2.5 (сценарий 5), §7.4 (пороги approve для inventory).
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §4.5 (экран `/write-off`).
- [`../04-konstruktor-dvizhenia/04-rashod.md`](../04-konstruktor-dvizhenia/04-rashod.md) — Shipment (зеркальная операция расхода).
- [`../04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) — RBAC для инвентаризации.
