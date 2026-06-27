# 04_Склад/04-pravila/04-biznes-pravila.md — Бизнес-правила модуля «Склад»

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение содержанием — Аналитик Run 4 (ТЗ-009).

## Назначение

Инварианты и валидации модуля `Склад` — immutable StockMovement, snapshot-поля, availableQty ≥ 0, reservedQty ≥ 0, approve-пороги АС, FIFO, правило «Принять частично = АС». Из `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §10 + `МОДУЛЬ-СКЛАД-UI.md` §5.

## Источники

- **Источник 1:** `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §10 — связи с модулями (триггеры, FK, ON DELETE).
- **Источник 2:** `МОДУЛЬ-СКЛАД-UI.md` §5 — бизнес-правила UI (5.1–5.6).

## Содержимое (планируется)

### §1 Остатки и движения (UI.md §5.1)

1. **`availableQty ≥ 0` всегда.** Блокировка StockMovement: out если `quantity < quantityAfterMovement`.
2. **`reservedQuantity ≥ 0`** — резерв ≤ quantity. Блокировка создания резерва при нехватке.
3. **`StockMovement immutable`** — нельзя править. Исправление: встречное движение.
4. **`availableQty = quantity − reservedQuantity`** — единственная цифра для менеджера.

### §2 Приходы / СД (UI.md §5.2)

5. Принимает только `storekeeper` (или admin/director).
6. **«Принять частично» = «Оформить АС»** — без одного из двух приход остаётся `partially_received`.
7. Payment (оплата поставщику) — отдельный процесс в Финансах (v1 — ручное обновление).
8. Приход без ЗП допустим (`supplierPurchaseOrderId = NULL`).

### §3 Отгрузки / ОТК (UI.md §5.3)

9. **Авто-предложение** при завершении ЗК, НЕ авто-создание (избежание двойных отгрузок).
10. **`shipped → StockMovement: out`** — атомарная транзакция (откат при ошибке).
11. **`delivered → OrderClosing.progress += qtyActual`** (в v1 — ручное).
12. Мульти-склад: два ОТК (проще, чем items[]).

### §4 Списания / АС (UI.md §5.4)

13. **Авто-маршрутизация approve:** `< 5 000 ₽` → accountant; `5 000–50 000 ₽` → director; `≥ 50 000 ₽` → director + журнал.
14. **`inventory_shortage`** — director + комиссия ≥3 человека.
15. **`completed → StockMovement: out, reason=write_off`** — атомарная транзакция.
16. Отмена только в `draft`. После `pending_approval` — только «Отклонить».

### §5 Закупки / ЗП (UI.md §5.5)

17. **Авто-создание из PurchaseRequest** — `purchaseOrderId` для трассировки.
18. Цена ЗП = `unitCost` от поставщика (для себестоимости в Финансах).
19. **ЗП → received** (авто) при `СД completed`. `partially_received` — если хотя бы один СД неполный.

### §6 UI (UI.md §5.6)

20. **Автосохранение фильтров** в localStorage.
21. **Inline-поиск** — мгновенная фильтрация ≤100 строк, иначе серверный debounce 300ms.
22. **Optimistic Locking** на approve АС — предупреждение при параллельном доступе.
23. **PDF-печатные формы:** СД (ТОРГ-1), ОТК (ТОРГ-12), АС (акт), ЗП (заявка).

### §7 Связи с модулями (ПОДРОБНЫЙ.md §10)

24. SupplierDelivery → StockMovement (авто при completed).
25. Shipment → StockMovement (авто при shipped).
26. WriteOffAct → StockMovement (авто при completed).
27. Shipment → OrderClosing (Финансы, при delivered).
28. SupplierDelivery → Payment (Финансы, v2 — ручное в v1).
29. PurchaseOrder → SupplierDelivery (обратная связь).
30. PurchaseRequest → PurchaseOrder (авто-создание при low_stock).

## Связанные документы

- [`../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) §10 — связи с модулями.
- [`../МОДУЛЬ-СКЛАД-UI.md`](../МОДУЛЬ-СКЛАД-UI.md) §5 — бизнес-правила UI.
- [`../04-konstruktor-dvizhenia/`](../04-konstruktor-dvizhenia/) — операции, к которым применяются правила.
- [`../04-zhiznennyj-cikl/04-statusy.md`](../04-zhiznennyj-cikl/04-statusy.md) — статусы, переходы.
- [`../04-zhiznennyj-cikl/04-rezervy.md`](../04-zhiznennyj-cikl/04-rezervy.md) — резервирование.
- [`../04-zhiznennyj-cikl/04-inventarizacia.md`](../04-zhiznennyj-cikl/04-inventarizacia.md) — инвентаризация.
