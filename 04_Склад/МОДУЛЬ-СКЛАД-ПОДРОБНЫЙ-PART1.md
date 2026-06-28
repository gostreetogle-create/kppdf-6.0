# МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART1.md — Справочники + Движения + Shipment (§1-§6)

> **PART1 из МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md.** Содержит разделы §1-§6:
> - §1-§2 Справочники (Warehouse, Supplier, Customer)
> - §3 StockRecord (остатки)
> - §4 StockMovement (immutable движения)
> - §5 Reservation (резервы под КП)
> - §6 Shipment (отгрузки ОТК-XXXX)
>
> **Используется для:** LAUNCH-ARCHITECT-04 Session 1 (база + отгрузки Склада).
> **Не используется в Session 1 (это в PART2):** §7 WriteOffAct, §8 PurchaseOrder.
>
> Источник: распускается Аналитиком Run 1.
>
> ⚠️ **HARD LIMIT OVERRIDE (аналог PSL-003).** PART1 превышает 400 строк (463 строки). Оправдано: это **reference material** (входные данные для Аналитика Run 1), а не STUB-output Архитектора. Дробление ухудшит cross-reference (PART2 ссылается на PART1 §1-§6 для общих типов StockMovement/Reservation). Принято per PSL-003 прецеденту.

---

# Модуль «Склад» (подробная схема v6)

> **Назначение.** Это **расширенный каркас Модуля Склад** для v6. Базовый документ `МОДУЛЬ-СКЛАД.md` в этой версии **не существует** как отдельный файл, поэтому данный документ самодостаточен и описывает все сущности с полными схемами полей.
> **Дата создания:** 24.06.2026.
> **Автор:** Буфер (стратег-ассистент) по итогам прогона Sub-blocks 2a + 2b + анализа АНАЛИЗ-П1.md.
> **Связь:** Развивает `archive/ANALYSIS-KP-priority.md` §1.12–1.16 + §3 строки 8–11 + §U1. Закрывает **GAP №8 (часть 1)** из `ЖУРНАЛ-ПРОГОНА.md` раздел 4 — 4 пропущенные сущности: `SupplierDelivery`, `Shipment`, `WriteOffAct`, `PurchaseOrder`.
> **→ Связанные модули:** Модуль Производство (источник прихода ЗК-завершён), Модуль Финансы (OrderClosing зависит от отгрузки), Модуль КП (источник спроса на товар).

---

## 0. Глоссарий терминов модуля

| Термин | Что значит |
|---|---|
| **Warehouse (Склад)** | Физическое место хранения. Справочник, настраивается администратором (например: «Основной склад», «Склад у партнёра», «Транзитный»). |
| **StockRecord (Остаток)** | Текущее количество конкретного товара на конкретном складе: `quantity` (физически) + `reservedQuantity` (зарезервировано под КП/ЗК). |
| **StockMovement (Движение)** | Любое изменение остатка: приход, расход, списание, перемещение между складами. Immutable — нельзя править задним числом. |
| **SupplierDelivery (Приход от поставщика)** | Акт приёмки товара, пришедшего от поставщика по `PurchaseOrder`. Создаёт `StockMovement.type=in, reason=purchase`. |
| **Shipment (Отгрузка клиенту)** | Отгрузка клиенту готового товара по ЗК или по КП напрямую. Создаёт `StockMovement.type=out, reason=sale`. |
| **WriteOffAct (Акт списания)** | Документ списания брака / недостачи / просрочки / утери. Создаёт `StockMovement.type=out, reason=write_off`. |
| **PurchaseOrder (Заявка на закупку)** | Внутренний документ «купить N штук товара X у поставщика Y». Закупщик оформляет, кладовщик принимает по факту через `SupplierDelivery`. |
| **Supplier (Поставщик)** | `Organization` с ролью «поставщик». Источник закупок. |

> **Важно о нумерации:** префиксы документов модуля:
> - `СД-XXXX` — SupplierDelivery (Приход)
> - `ОТК-XXXX` — Shipment (Отгрузка)
> - `АС-XXXX` — WriteOffAct (Акт списания)
> - `ЗП-XXXX` — PurchaseOrder (Заявка на закупку)
> Каждый префикс имеет **отдельный счётчик** в БД (sealed counter table, см. `archive/MIGRATION-PLAN-Phase1.md`).

---

## 1. Для чего нужен этот модуль

**Склад** в v6 — это **операционная точка контроля движения товара**: что пришло, что ушло, что списали, что нужно закупить. До v6 складской учёт вёлся в Excel, что приводило к расхождениям «по бумаге 50 шт., а реально 47» и потере денег при пересортице.

### Для кого работает

| Роль | Что делает в модуле |
|---|---|
| **Кладовщик (`storekeeper`)** | Главный пользователь. Принимает приходы, оформляет отгрузки, делает списания, контролирует остатки, видит движения. |
| **Менеджер по продажам (`manager`)** | Видит остатки при подготовке КП («вот на этом складе 12 шт., на другом 8 — итого 20, в КП обещаем поставить 15»). Создаёт отгрузки от своего имени через роли кладовщика. |
| **Закупщик (`manager` с расширенными правами или выделенная роль `purchase-manager`)** | Оформляет `PurchaseOrder` поставщикам, контролирует сроки поставки. |
| **Бухгалтер (`accountant`)** | Видит акты списания (для списания себестоимости в расходы), видит приходы от поставщиков (для сверки счетов). |
| **Директор (`director`)** | Видит все движения, утверждает крупные списания. |
| **Администратор (`admin`)** | Настраивает справочник складов, цехов, поставщиков. |

### Главная боль, которую решает модуль

В прошлой версии (5.0) учёт вёлся в Excel: менеджер вбивал «отгрузили 10 шт.», а кладовщик не знал, потому что Excel файл лежит на одном компьютере. В v6 **все складские операции проходят через систему**: каждое движение — это документ с автором, датой, основанием, который нельзя «забыть» или «потерять».

---

## 2. Сценарии использования (основные 7)

Эти сценарии описывают, как модуль используется в работе. Каждый сценарий покрывает несколько экранов/документов.

### Сценарий 1. Приём прихода от поставщика

1. Закупщик создал `PurchaseOrder ЗП-0042` поставщику ООО «Металлопром» на 100 шт. арматуры.
2. Через 5 дней приехала машина. Кладовщик открывает «Жду прихода» в модуле Склад → видит ожидаемый `ЗП-0042`.
3. Нажимает «Принять приход» → создаётся `SupplierDelivery СД-0017`.
4. Заполняет фактическое количество (приехало 98 вместо 100 — 2 в пути потерялись).
5. Статус `СД-0017` → «completed». Система автоматически создаёт `StockMovement: Приход` +98 на склад «Основной» по товару «Арматура».
6. `ЗП-0042` получает статус «received частично».

### Сценарий 2. Отгрузка клиенту по завершённому ЗК

1. Начальник производства завершил `ЗК-0023` (15 колец баскетбольных готовы).
2. Кладовщик открывает `ЗК-0023`, нажимает «Оформить отгрузку».
3. Создаётся `Shipment ОТК-0008` со статусом «planned».
4. Кладовщик указывает дату отгрузки, ответственного водителя/курьера, tracking number.
5. Товар физически выдаётся. Кладовщик ставит «shipped» → «delivered».
6. Система автоматически создаёт `StockMovement: Расход` −15 по товару.
7. `ЗК-0023` остаётся в статусе «Завершён», но в его карточке появляется блок «Отгрузки: ОТК-0008 (delivered)».

### Сценарий 3. Списание брака при приёмке

1. При приёмке `СД-0017` кладовщик обнаружил 3 шт. из 98 с дефектом.
2. Не отклоняет всю партию — оформляет `WriteOffAct АС-0003` с причиной «defect».
3. В АС указывает товар, количество (3), warehouse, customReason («Деформация при транспортировке»).
4. Указывает approver = `accountant` (или `director` для крупных сумм).
5. После approve система создаёт `StockMovement: Расход (write_off)` −3.
6. Остаток на складе уменьшается на 3.

### Сценарий 4. Заявка на закупку по сигналу «ниже минимума»

1. Система ежедневно проверяет `StockRecord.quantity` против `Product.minStock`.
2. Если quantity < minStock — автоматически создаётся `PurchaseRequest` (уже существующая сущность из АНАЛИЗ-П1 §1.16).
3. Закупщик видит в `/purchase` очередь заявок. По каждой принимает решение: «оформить `PurchaseOrder` поставщику» или «отложить».
4. Если «оформить» — создаёт `PurchaseOrder ЗП-0043` (ручной или полу-автоматический по шаблону).

### Сценарий 5. Инвентаризация (периодическая сверка)

1. Раз в месяц кладовщик проводит инвентаризацию.
2. Открывает экран «Инвентаризация», выбирает склад.
3. Для каждого товара вводит фактическое количество (вручную или через сканер штрих-кодов в следующей версии).
4. Если факт ≠ учётного остатка — система предлагает оформить `WriteOffAct` с причиной «inventory_shortage» или «inventory_surplus».
5. После approve система корректирует `StockRecord` через соответствующий `StockMovement`.

### Сценарий 6. Возврат клиентом (R2 + GAP-009 закрытие)

1. Клиент вернул бракованное кольцо через 2 недели после отгрузки (R2 из АНАЛИЗ-П1 + GAP-009).
2. Кладовщик оформляет **обратную `Shipment`** (статус `cancelled` или новый тип `return`) — ИСПРАВЛЕНО ниже.
3. Товар возвращается на склад через `StockMovement: Приход (reason=sale_return)` +1.
4. Создаётся Refund (Payment.amount < 0) в Модуле Финансы.

> ⚠️ **ВАЖНО: для v1** сценарий возврата клиентом **отложен в v2** (R2 / GAP-009). В v1 есть только `WriteOffAct` для внутреннего брака (поставщик привёз бракованный = списание). Возвраты от клиента — это `Shipment` с типом `return` в v2.

### Сценарий 7. Перемещение между складами

1. Кладовщик основного склада хочет переместить 5 колец на склад у партнёра.
2. Создаёт перемещение (отдельная форма, не входит в 4 базовых сущности, но создаёт **два `StockMovement`**: `type=transfer, transferFromWarehouseId=Основной` и встречный).
3. StockRecord обновляется по обоим складам.

---

## 3. ER-диаграмма модуля (текстовый список всех 7 сущностей)

Текстовое ER-представление. FK с указанием ON DELETE.

```
┌──────────────────────────────────────────────────────────────────┐
│                    МОДУЛЬ СКЛАД — все 7 сущностей v6             │
└──────────────────────────────────────────────────────────────────┘

==================  СУЩЕСТВУЮЩИЕ СУЩНОСТИ  ==================
[ Warehouse ]               ←── Справочник складов (1..N)
   ↓
[ StockRecord ]              ← Текущий остаток (Warehouse × Product)
   ↓ FK (warehouseId, productId)
[ StockMovement ]            ← Immutable: приход/расход/transfer/write_off
   ↓                ↑
   FK sourceProductionOrderId → ProductionOrder
   FK sourceProposalId        → Proposal
   FK sourceSupplierDeliveryId → SupplierDelivery (NEW!)
   FK transferFromWarehouseId → Warehouse

[ Reservation ]              ← Резерв под КП (draft/sent)
   FK proposalId → Proposal
[ PurchaseRequest ]          ← Заявка на закупку (low_stock trigger)

==================  НОВЫЕ СУЩНОСТИ (этот документ)  ==================

┌───────────────────────────────────────────────────────────────┐
│  [ PurchaseOrder ]  (Заявка на закупку)                        │
│    ├ FK supplierId → Organization (isSupplier=true)           │
│    ├ FK warehouseId → Warehouse                               │
│    ├ createdById/processedById → User                         │
│    └ items[] → [ PurchaseOrderItem ]                          │
│             └ FK productId → Product, qty, unitCost           │
└───────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│  [ SupplierDelivery ]  (Приход от поставщика)                  │
│    ├ FK supplierId → Organization (isSupplier=true)           │
│    ├ FK warehouseId → Warehouse                               │
│    ├ FK supplierPurchaseOrderId → PurchaseOrder (nullable)   │
│    ├ FK parentContractId → Contract (nullable, для привязки) │
│    ├ invoiceSupplierNumber/Date (от поставщика — не наш Inv)  │
│    ├ createdById / receivedById → User                        │
│    └ items[] → [ SupplierDeliveryItem ]                       │
│             └ FK productId → Product, qty_expected/received   │
└───────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│  [ Shipment ]  (Отгрузка клиенту)                              │
│    ├ FK warehouseId → Warehouse                               │
│    ├ FK productionOrderId → ProductionOrder (nullable)        │
│    ├ FK proposalId → Proposal (nullable)                      │
│    ├ FK contractId → Contract (nullable)                      │
│    ├ FK customerId → Organization                             │
│    ├ responsibleUserId → User                                 │
│    └ items[] → [ ShipmentItem ]                               │
│             └ FK productId → Product, qty_planned/qty_actual  │
└───────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────┐
│  [ WriteOffAct ]  (Акт списания)                               │
│    ├ FK warehouseId → Warehouse                               │
│    ├ FK createdById/approvedById → User                       │
│    ├ reason enum: defect|expiry|loss|damage|inventory_shortage|other│
│    └ items[] → [ WriteOffItem ]                               │
│             └ FK productId → Product, qty, cost               │
└───────────────────────────────────────────────────────────────┘
```

### Сводная таблица FK и ON DELETE

| Связь | FK | ON DELETE | Источник |
|---|---|---|---|
| `StockRecord` → `Warehouse` | `warehouseId` | **RESTRICT** | Прямой FK |
| `StockRecord` → `Product` | `productId` | **RESTRICT** | Прямой FK |
| `StockMovement` → `Warehouse` | `warehouseId` | RESTRICT | Прямой FK (как в АНАЛИЗ-П1 §1.14) |
| `StockMovement` → `Product` | `productId` | RESTRICT | Прямой FK (как в АНАЛИЗ-П1 §1.14) |
| `StockMovement` → `ProductionOrder` | `sourceProductionOrderId` | SET NULL | (как в АНАЛИЗ-П1 §1.14) |
| `StockMovement` → `Proposal` | `sourceProposalId` | SET NULL | (как в АНАЛИЗ-П1 §1.14) |
| `StockMovement` → `SupplierDelivery` | `sourceSupplierDeliveryId` | SET NULL | (как в АНАЛИЗ-П1 §1.14) **NEW FK связь** |
| `StockMovement` → `Warehouse` | `transferFromWarehouseId` | SET NULL | (как в АНАЛИЗ-П1 §1.14) для transfer |
| `PurchaseOrder` → `Organization` | `supplierId (isSupplier=true)` | RESTRICT | NEW |
| `PurchaseOrder` → `Warehouse` | `warehouseId` | RESTRICT | NEW |
| `PurchaseOrderItem` → `PurchaseOrder` | `purchaseOrderId` | CASCADE | NEW (child row) |
| `PurchaseOrderItem` → `Product` | `productId` | RESTRICT | NEW |
| `SupplierDelivery` → `Organization` | `supplierId` | RESTRICT | NEW |
| `SupplierDelivery` → `Warehouse` | `warehouseId` | RESTRICT | NEW |
| `SupplierDelivery` → `PurchaseOrder` | `supplierPurchaseOrderId` | SET NULL | NEW (можно принять без ЗП) |
| `SupplierDelivery` → `Contract` | `parentContractId` | SET NULL | NEW (для тендерных закупок) |
| `SupplierDeliveryItem` → `SupplierDelivery` | `supplierDeliveryId` | CASCADE | NEW (child row) |
| `SupplierDeliveryItem` → `Product` | `productId` | RESTRICT | NEW |
| `Shipment` → `Warehouse` | `warehouseId` | RESTRICT | NEW |
| `Shipment` → `ProductionOrder` | `productionOrderId` | SET NULL | NEW (опционально) |
| `Shipment` → `Proposal` | `proposalId` | SET NULL | NEW (опционально) |
| `Shipment` → `Contract` | `contractId` | SET NULL | NEW (опционально) |
| `Shipment` → `Organization` | `customerId` | RESTRICT | NEW |
| `ShipmentItem` → `Shipment` | `shipmentId` | CASCADE | NEW (child row) |
| `ShipmentItem` → `Product` | `productId` | RESTRICT | NEW |
| `WriteOffAct` → `Warehouse` | `warehouseId` | RESTRICT | NEW |
| `WriteOffAct` → `User` | `createdById/approvedById` | RESTRICT / SET NULL | NEW (approvedById nullable — уволенный сотрудник) |

---

## 4. Общие сущности модуля (краткая справка)

Полные описания в `archive/ANALYSIS-KP-priority.md` §1.12–1.16. Здесь — краткая выжимка для контекста.

### 4.1 Warehouse (Склад) — §1.12

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `code` | String | да | Уникальный код (например, «WH-001») |
| `name` | String | да | Название (например, «Основной склад на Профсоюзной») |
| `address` | String | нет | Физический адрес |
| `isActive` | Boolean | да | default true (soft-delete для архивации склада) |

**Сценарий использования.** Админ создаёт 1-3 склада: «Основной», «Выездная бригада (мобильный склад)», «У партнёра (транзит)». Остальные — по мере роста компании.

### 4.2 StockRecord (Остаток) — §1.13

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `warehouseId` | FK → Warehouse | да | |
| `productId` | FK → Product | да | |
| `quantity` | Decimal | да | Физически в наличии |
| `reservedQuantity` | Decimal | да | Зарезервировано под КП/ЗК |
| `lastMovementAt` | DateTime | нет | Для сортировки «что давно не двигалось» |
| **UNIQUE** | (warehouseId, productId) | — | Одна запись на пару |

**Ключевая формула:** `availableQty = quantity - reservedQuantity` — это то, что можно отгрузить.

### 4.3 StockMovement (Движение) — §1.14

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `warehouseId` | FK → Warehouse | да | |
| `productId` | FK → Product | да | |
| `type` | enum (in, out, transfer, write_off) | да | |
| `quantity` | Decimal (> 0) | да | Всегда положительное (направление — в `type`) |
| `createdAt` | DateTime | да | Immutable — нельзя править |
| `createdById` | FK → User | да | Кто внёс движение |
| `reason` | enum (production, purchase, sale, sale_return, client_order, write_off, manual) | да | Расширено: `sale_return` для возврата (v2) |
| `sourceProductionOrderId` | FK → ProductionOrder | нет | NULL для непроизводственного прихода |
| `sourceProposalId` | FK → Proposal | нет | |
| `sourceSupplierDeliveryId` | FK → SupplierDelivery | нет | NEW — связанная сущность |
| `writeOffReason` | String | нет | Свободный текст, если reason = `write_off` |
| `transferFromWarehouseId` | FK → Warehouse | нет | Для `type=transfer` |

### 4.4 Reservation (Резерв) — §1.15

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `proposalId` | FK → Proposal | да | Резерв привязан к КП |
| `productId` | FK → Product | да | |
| `quantity` | Decimal | да | Сколько зарезервировано |
| `createdAt` | DateTime | да | |

**Когда создаётся:** при переходе КП в `sent` (отправлено клиенту) — резерв на товар. При `cancelled`/`rejected` — резерв снимается.

### 4.5 PurchaseRequest (Заявка на закупку) — §1.16

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `productId` | FK → Product | да | Какой товар заказать |
| `quantity` | Decimal | да | Сколько |
| `status` | enum (pending, processed, closed, cancelled) | да | |
| `reason` | enum (low_stock, manual_request) | да | Авто-триггер или ручная |
| `createdAt` | DateTime | да | |
| `processedById` | FK → User | нет | Кто обработал |
| `processedAt` | DateTime | нет | |

**Триггер.** Ежедневный фоновый job проверяет `StockRecord.availableQty < Product.minStock` → автоматически создаёт `PurchaseRequest` с `reason=low_stock`. Закупщик решает: «купить (создать `PurchaseOrder`)/отложить/отменить».

---

## 5. SupplierDelivery (Приход от поставщика) — ПОЛНАЯ СХЕМА

> **Назначение:** документ фиксации факта приёмки товара от поставщика. Создаёт `StockMovement.type=in, reason=purchase` при завершении.

### 5.1 Поля

| Поле | Тип | Обяз. | Источник | Комментарий |
|---|---|---|---|---|
| `id` | UUID | да | авто | PK |
| `number` | String (СД-XXXX) | да | авто-счётчик | Уникальный, **отдельный счётчик SupplierDelivery** |
| `status` | enum | да | авто default `planned` | Принимает значения: `planned → in_transit → received → partially_received → completed → cancelled` |
| `supplierId` | FK → Organization | да | выбор | Поставщик (обязательно с `isSupplier=true`) |
| `warehouseId` | FK → Warehouse | да | выбор | На какой склад приходовать |
| `supplierPurchaseOrderId` | FK → PurchaseOrder | нет | выбор | Если приход по нашей внутренней `PurchaseOrder` — связь. Можно NULL (приехало без предупреждения) |
| `parentContractId` | FK → Contract | нет | выбор | Для тендерных закупок (привязка к нашему Договору с поставщиком — отдельная сущность будет в v2) |
| `supplierInvoiceNumber` | String | нет | ввод | Номер накладной от поставщика (не путать с нашим `Invoice`) |
| `supplierInvoiceDate` | Date | нет | ввод | Дата накладной |
| `expectedDeliveryDate` | Date | нет | ввод | Планируемая дата (для статуса `in_transit`) |
| `actualDeliveryDate` | Date | нет | авто | Фактическая дата приёмки |
| `totalExpectedAmount` | Decimal | нет | авто-сумма | Сумма по `items[]` × ожидаемое количество |
| `totalReceivedAmount` | Decimal | нет | авто-сумма | Фактическая сумма |
| `currency` | String | да | default `'RUB'` | Жёстко RUB в v1 (СПОР-14) |
| `paymentStatus` | enum (unpaid, partially_paid, paid, prepaid) | нет | авто-расчёт | Связь с будущим Payment в Модуле Финансы |
| `notes` | String | нет | ввод | Свободные заметки (например, «приёмка прошла нормально, водитель ждал 2 часа») |
| `createdById` | FK → User | да | авто | Кто создал документ (`storekeeper` или `manager`) |
| `createdAt` | DateTime | да | авто | |
| `receivedById` | FK → User | нет | авто | Кто фактически принял (может отличаться от создателя: создал менеджер, принял кладовщик) |
| `receivedAt` | DateTime | нет | авто | Когда подтверждена приёмка |
| `isActive` | Boolean | да | default true | Soft-delete |
| `packageTag` | String | нет | авто | По `customerId` (если от клиента) или по `supplierId` — для связи с Картотекой |

### 5.2 Дочерняя таблица SupplierDeliveryItem

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `supplierDeliveryId` | FK → SupplierDelivery | да | |
| `productId` | FK → Product | да | |
| `productSku` | String (snapshot) | да | Из Product на момент создания |
| `productName` | String (snapshot) | да | Из Product на момент создания |
| `unit` | String (snapshot) | да | Из Product на момент создания |
| `quantityExpected` | Decimal | да | Сколько ожидалось |
| `quantityReceived` | Decimal | нет | Сколько фактически приняли (default = quantityExpected) |
| `unitCost` | Decimal | нет | Цена за единицу от поставщика (для расчёта себестоимости) |
| `totalCost` | Decimal | нет | unitCost × quantityReceived |
| `qualityNotes` | String | нет | «Брак 3 шт. — см. WriteOffAct АС-0003» |
| `sortOrder` | Int | да | |

### 5.3 Жизненный цикл

| Статус | Что значит | Кто двигает | Условие перехода |
|---|---|---|---|
| `planned` | Закупщик оформил `PurchaseOrder`, ожидается машина | авто | триггер: создан `supplierPurchaseOrderId` |
| `in_transit` | Поставщик подтвердил отгрузку, машина в пути | закупщик | вручную |
| `received` | Машина приехала, кладовщик проверяет товар | кладовщик | вручную: «Принять» |
| `partially_received` | Часть товара принята, часть в дефекте/недостаче | кладовщик | авто: если sum(quantityReceived) < sum(quantityExpected) |
| `completed` | Полностью принято (или списано через WriteOffAct) | кладовщик | авто: при завершении → создаёт StockMovement: in |
| `cancelled` | Отменено (поставщик не привёз, или договорились не брать) | закупщик / директор | вручную |

### 5.4 Триггеры

- **При переходе в `completed`** — **автоматически создаётся `StockMovement`** для каждого `SupplierDeliveryItem`:
  - `type=in, reason=purchase, sourceSupplierDeliveryId=этот СД`
  - `quantity=quantityReceived` (или `quantityExpected` если received не заполнено)
  - Параллельно для расхождений (`quantityExpected > quantityReceived`):
    - **ЕСЛИ quantityReceived < quantityExpected:** кладовщик должен оформить **WriteOffAct** с `reason=inventory_shortage` (если поставщик не виноват) или `reason=defect` (если брак).

### 5.5 Связи с другими модулями

- → **PurchaseOrder** (supplierPurchaseOrderId) — ЗП может быть в статусе `confirmed | in_transit | received | partially_received | closed`
- → **StockRecord** (через StockMovement после completed)
- → **Payment** в Модуле Финансы (оплата поставщику) — **спроектировано в v2**, в v1 paymentStatus обновляется вручную бухгалтером
- → **Contract** (parentContractId) — для тендерных закупок

---

## 6. Shipment (Отгрузка клиенту) — ПОЛНАЯ СХЕМА

> **Назначение:** документ отгрузки товара клиенту. Создаёт `StockMovement.type=out, reason=sale` (или `client_order`) при фактической отгрузке.

### 6.1 Поля

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `number` | String (ОТК-XXXX) | да | авто-счётчик, **отдельный счётчик Shipment** |
| `status` | enum | да | `planned → packed → shipped → delivered → partial → cancelled` |
| `warehouseId` | FK → Warehouse | да | С какого склада отгружаем |
| `productionOrderId` | FK → ProductionOrder | нет | Если отгрузка по завершённому ЗК |
| `proposalId` | FK → Proposal | нет | Если отгрузка напрямую по КП (товар уже на складе) |
| `contractId` | FK → Contract | нет | Если отгрузка по Договору |
| `customerId` | FK → Organization | да | Кому отгружаем |
| `deliveryAddress` | String | нет | Адрес доставки (если отличается от `customer.legalAddress`) |
| `plannedShipDate` | Date | нет | Плановая дата |
| `actualShipDate` | Date | нет | Фактическая дата отгрузки со склада |
| `plannedDeliveryDate` | Date | нет | Плановая дата доставки клиенту |
| `actualDeliveryDate` | Date | нет | Фактическая дата доставки |
| `responsibleUserId` | FK → User | нет | Ответственный за отгрузку (курьер/водитель/экспедитор) |
| `trackingNumber` | String | нет | Номер ТТН/накладной (для транспортной компании) |
| `transportCompany` | String | нет | Название перевозчика (СДЭК, Деловые Линии, самовывоз) |
| `notes` | String | нет | Заметки |
| `createdById` | FK → User | да | Кто создал |
| `createdAt` | DateTime | да | |
| `shippedAt` | DateTime | нет | Когда перешёл в `shipped` |
| `deliveredAt` | DateTime | нет | Когда перешёл в `delivered` |
| `isActive` | Boolean | да | default true (soft-delete) |
| `packageTag` | String | нет | Опциональный тег-идентификатор сделки |

### 6.2 Дочерняя таблица ShipmentItem

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `shipmentId` | FK → Shipment | да | |
| `productId` | FK → Product | да | |
| `productSku` | String (snapshot) | да | |
| `productName` | String (snapshot) | да | |
| `unit` | String (snapshot) | да | |
| `quantityPlanned` | Decimal | да | Сколько планировали |
| `quantityActual` | Decimal | нет | Сколько фактически отгрузили (default = quantityPlanned) |
| `costPrice` | Decimal | нет | Себестоимость (snapshot на момент отгрузки — для подсчёта маржи в Модуле Финансы) |
| `sortOrder` | Int | да | |

### 6.3 Жизненный цикл

| Статус | Что значит | Кто двигает | Условие перехода |
|---|---|---|---|
| `planned` | Отгрузка запланирована (например, после завершения ЗК) | авто | триггер: ЗК = Завершён |
| `packed` | Кладовщик упаковал, готов к выдаче | кладовщик | вручную |
| `shipped` | Товар передан курьеру / клиент забрал | кладовщик | вручную → создаёт StockMovement: out |
| `delivered` | Клиент получил товар | кладовщик / курьер | вручную |
| `partial` | Отгружено меньше чем планировалось | кладовщик | авто: если sum(quantityActual) < sum(quantityPlanned) |
| `cancelled` | Отменено (клиент отказался до отгрузки) | кладовщик / менеджер | вручную |

### 6.4 Триггеры

- **Авто-создание при ProductionOrder → Завершён** (из МОДУЛЬ-ПРОИЗВОДСТВО.md §6.3): если в ЗК есть задачи типа `Товар`, система предлагает кладовщику создать `Shipment` (НЕ создаёт автоматически — кладовщик подтверждает кнопкой).
- **При переходе в `shipped`** — **автоматически создаётся `StockMovement`** для каждого `ShipmentItem`:
  - `type=out, reason=sale, sourceProductionOrderId/proposalId/contractId` (что не NULL)
  - `quantity=quantityActual`

### 6.5 Связи с другими модулями

- → **ProductionOrder** (productionOrderId) — главный источник
- → **Proposal** (proposalId) — для отгрузок напрямую по КП (когда товар уже на складе, ЗК не создаётся — это сценарий R1 из АНАЛИЗ-П1)
- → **Contract** (contractId) — для отгрузок по Договору
- → **Customer** — обязательно
- → **StockRecord** (через StockMovement)
- → **OrderClosing** в Модуле Финансы: при `delivered` Shipment обновляет прогресс OrderClosing (для подсчёта «физически исполнено»)

---

