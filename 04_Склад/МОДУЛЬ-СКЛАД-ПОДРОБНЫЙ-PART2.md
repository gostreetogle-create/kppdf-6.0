# МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART2.md — WriteOffAct + PurchaseOrder (§7-§8)

> **PART2 из МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md.** Содержит разделы §7-§8:
> - §7 WriteOffAct (АС-XXXX — двухступенчатый approve)
> - §8 PurchaseOrder (ЗП-XXXX — заявки на закупку)
>
> **Используется для:** LAUNCH-ARCHITECT-04 Session 2 (приёмки + списания + закупки).
> **Не используется в Session 2 (это в PART1):** §1-§6 (база, движения, резервы, отгрузки).
>
> Источник: распускается Аналитиком Run 1.

---

## 7. WriteOffAct (Акт списания) — ПОЛНАЯ СХЕМА

> **Назначение:** документ списания брака / недостачи / просрочки / утери / инвентаризационного расхождения. Создаёт `StockMovement.type=out, reason=write_off` после approve.

### 7.1 Поля

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `number` | String (АС-XXXX) | да | авто-счётчик, **отдельный счётчик WriteOffAct** |
| `status` | enum | да | `draft → pending_approval → approved → completed → cancelled` |
| `warehouseId` | FK → Warehouse | да | |
| `reason` | enum | да | `defect` / `expiry` / `loss` / `damage` / `inventory_shortage` / `inventory_surplus` / `other` |
| `customReason` | String | нет | Обязательно если `reason=other`. Свободный текст описания |
| `actDate` | Date | да | Дата акта (default = дата создания) |
| `totalAmount` | Decimal | нет | Сумма себестоимости всех позиций (для отчётов бухгалтера) |
| `createdById` | FK → User | да | Кто создал (обычно кладовщик или комиссия при инвентаризации) |
| `createdAt` | DateTime | да | |
| `approvedById` | FK → User | нет | Кто утвердил (accountant или director — зависит от суммы) |
| `approvedAt` | DateTime | нет | |
| `completedAt` | DateTime | нет | Когда проведён через StockMovement |
| `commissionMembers` | String[] | нет | Состав комиссии (ФИО) — для инвентаризации |
| `notes` | String | нет | |
| `isActive` | Boolean | да | default true |

### 7.2 Дочерняя таблица WriteOffItem

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `writeOffActId` | FK → WriteOffAct | да | |
| `productId` | FK → Product | да | |
| `productSku` | String (snapshot) | да | |
| `productName` | String (snapshot) | да | |
| `quantity` | Decimal | да | Сколько списываем |
| `costPrice` | Decimal | нет | Себестоимость единицы на момент списания |
| `totalCost` | Decimal | нет | = quantity × costPrice |
| `sortOrder` | Int | да | |

### 7.3 Жизненный цикл

| Статус | Что значит | Кто двигает | Условие перехода |
|---|---|---|---|
| `draft` | Только создан, можно править | создатель | начальный |
| `pending_approval` | Отправлен на утверждение | создатель | вручную: «Отправить на утверждение» |
| `approved` | Утверждён уполномоченным | approver | вручную: «Утвердить» |
| `completed` | Проведён через StockMovement | авто | триггер: создан StockMovement |
| `cancelled` | Отменён до утверждения | создатель / approver | вручную |

### 7.4 RBAC и пороги approve

- **Авто-маршрутизация** на approver по сумме `totalAmount`:
  - `totalAmount < 5 000 ₽` → **accountant** (или director, если accountant недоступен)
  - `5 000 ₽ ≤ totalAmount < 50 000 ₽` → **director**
  - `totalAmount ≥ 50 000 ₽` → **director + accounting-фиксация в Журнале**
- **Списание `inventory_shortage` (инвентаризация)** — всегда требует **director + комиссия** (минимум 3 человека в `commissionMembers`).

### 7.5 Триггеры

- **При переходе в `completed`** — **автоматически создаётся `StockMovement`** для каждого `WriteOffItem`:
  - `type=out, reason=write_off, writeOffReason=текст`
  - `quantity=quantityItem`

### 7.6 Связи с другими модулями

- → **User** (approvedById / createdById) — для аудита
- → **StockRecord** (через StockMovement)
- → Модуль Финансы: списание уменьшает `costOfGoodsSold` в `OrderClosing`. **Не отдельный Payment** (списание — это не расход денег, а уменьшение актива).

---

## 8. PurchaseOrder (Заявка на закупку) — ПОЛНАЯ СХЕМА

> **Назначение:** внутренний документ «закупить N товаров у поставщика». Не путать с `SupplierDelivery` (это приёмка) — `PurchaseOrder` (ЗП) — это **заказ поставщику**.

### 8.1 Поля

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `number` | String (ЗП-XXXX) | да | авто-счётчик, **отдельный счётчик PurchaseOrder** |
| `status` | enum | да | `draft → sent → confirmed → in_transit → received → partially_received → cancelled → closed` |
| `supplierId` | FK → Organization | да | Поставщик (`isSupplier=true`) |
| `warehouseId` | FK → Warehouse | да | На какой склад ожидаем приход |
| `parentContractId` | FK → Contract | нет | Если закупка по нашему Договору с поставщиком (опционально в v1) |
| `purchaseRequestId` | FK → PurchaseRequest | нет | Если ЗП создан автоматически по `PurchaseRequest` (low_stock trigger) |
| `createdById` | FK → User | да | Закупщик |
| `createdAt` | DateTime | да | |
| `processedById` | FK → User | нет | Кто обработал (закупщик, отправил поставщику) |
| `processedAt` | DateTime | нет | |
| `expectedDeliveryDate` | Date | нет | Желаемая дата прихода |
| `confirmedDeliveryDate` | Date | нет | Подтверждённая поставщиком дата |
| `totalAmount` | Decimal | нет | Сумма всего заказа |
| `currency` | String | да | default `'RUB'` (СПОР-14 — жёстко в v1) |
| `notes` | String | нет | Заметки |
| `sentAt` | DateTime | нет | Когда отправлен поставщику (email/факс) |
| `receivedAt` | DateTime | нет | Когда фактически получен (все позиции или частично) |
| `closedAt` | DateTime | нет | Когда полностью закрыт (все позиции получены + оплачены) |
| `isActive` | Boolean | да | default true |

### 8.2 Дочерняя таблица PurchaseOrderItem

| Поле | Тип | Обяз. | Комментарий |
|---|---|---|---|
| `id` | UUID | да | PK |
| `purchaseOrderId` | FK → PurchaseOrder | да | |
| `productId` | FK → Product | да | |
| `productSku` | String (snapshot) | да | |
| `productName` | String (snapshot) | да | |
| `unit` | String (snapshot) | да | |
| `quantity` | Decimal | да | Сколько заказываем |
| `unitCost` | Decimal | нет | Цена за единицу |
| `totalCost` | Decimal | нет | quantity × unitCost |
| `quantityReceived` | Decimal | нет | Сколько фактически пришло (через SupplierDelivery) |
| `sortOrder` | Int | да | |

### 8.3 Жизненный цикл

| Статус | Что значит | Кто двигает | Условие перехода |
|---|---|---|---|
| `draft` | Черновик (можно править) | закупщик | начальный |
| `sent` | Отправлен поставщику (email/факс/звонок зафиксирован) | закупщик | вручную: «Отправить» |
| `confirmed` | Поставщик подтвердил заказ и сроки | закупщик | вручную: «Поставщик подтвердил» |
| `in_transit` | Машина в пути | закупщик / авто | вручную или авто по сообщению поставщика |
| `received` | Принят полностью (создан SupplierDelivery со статусом completed) | авто | триггер: создан SupplierDelivery completed |
| `partially_received` | Принят частично | авто | триггер: создан SupplierDelivery partially_received |
| `cancelled` | Отменён до получения | закупщик / директор | вручную |
| `closed` | Полностью завершён (получен + оплачен) | закупщик / бухгалтер | вручную: после оплаты |

### 8.4 Триггеры

- **Авто-создание** из `PurchaseRequest` (статус `processed` → закупщик решил «купить»): создаётся ЗП с `purchaseRequestId`.
- **При получении `SupplierDelivery`** (статус completed/partially_received) — автоматически обновляется `purchaseOrder.status` и `PurchaseOrderItem.quantityReceived`.

### 8.5 Связи с другими модулями

- → **SupplierDelivery** (supplierPurchaseOrderId в SD) — обратная связь
- → **PurchaseRequest** (purchaseRequestId) — источник авто-создания
- → **Organization** (supplierId) — поставщик с `isSupplier=true`
- → **Warehouse** (warehouseId) — куда приходовать
- → Модуль Финансы (Payment) — оплата поставщику по ЗП (в Payment будет FK типа ZP-XXXX, проектируется в v2)

---

## 9. RBAC модуля Склад (6 ролей × 8 действий)

| Действие | admin | manager (продаж) | director | production (начальник) | storekeeper (кладовщик) | accountant | viewer |
|---|---|---|---|---|---|---|---|
| **Видеть остатки (StockRecord)** | ✅ все | ✅ все | ✅ все | ✅ свои склады | ✅ свои | ✅ | ✅ |
| **Видеть движения (StockMovement)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Создать SupplierDelivery** | ✅ | ⚠️ только свой поставщик (если есть контракт) | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Принять приход (СД → completed)** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Создать Shipment** | ✅ | ⚠️ только по своему КП/Договору | ✅ | ✅ по своему ЗК | ✅ | ❌ | ❌ |
| **Отгрузить (Отк → shipped)** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Создать WriteOffAct (draft)** | ✅ | ❌ | ✅ | ❌ | ✅ | ⚠️ только inventory | ❌ |
| **Approve WriteOffAct** | ✅ | ❌ | ✅ по порогу | ❌ | ❌ | ✅ только до 5 000 ₽ | ❌ |
| **Создать PurchaseOrder (ЗП)** | ✅ | ⚠️ если назначен | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Подтвердить ЗП от поставщика** | ✅ | ⚠️ | ✅ | ❌ | ✅ (если назначен) | ❌ | ❌ |
| **Инвентаризация (создать WriteOffAct inventory_shortage)** | ✅ | ❌ | ✅ | ❌ | ✅ инициирует | ✅ в комиссии | ❌ |
| **Архивировать** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |

### 9.1 Пояснения к RBAC

- **manager** ограничен — может создавать SupplierDelivery/Shipment только по своим КП/Договорам/поставщикам (где он `createdById`).
- **production** может создавать Shipment **только по своему ProductionOrder** (он `responsibleUserId` или среди `assigneesProductionOrder`).
- **storekeeper** — главный пользователь модуля, имеет права на все операции по приёмке/отгрузке/списанию.
- **accountant** ограниченно участвует в списаниях (до порога суммы) и в инвентаризации (как член комиссии).

---

## 10. Связи с другими модулями (сводка)

| Этот модуль → | Связь | Когда |
|---|---|---|
| **SupplierDelivery** → **StockMovement** | авто | При `completed` СД |
| **SupplierDelivery** → **PurchaseOrder** | FK (`supplierPurchaseOrderId`) | Создание по ЗП |
| **Shipment** → **StockMovement** | авто | При `shipped` ОТК |
| **Shipment** → **ProductionOrder** | FK + авто-создание | Завершение ЗК → предложение создать Shipment |
| **Shipment** → **Proposal** | FK | Отгрузка напрямую по КП без ЗК (сценарий R1) |
| **WriteOffAct** → **StockMovement** | авто | При `completed` АС |
| **PurchaseOrder** → **SupplierDelivery** | обратный FK | СД создан по ЗП |
| **PurchaseOrder** → **PurchaseRequest** | FK | ЗП создан по заявке (auto low_stock) |
| **StockRecord** → **Warehouse** | FK | (всегда) |
| **StockRecord** → **Product** | FK | (всегда) |
| → **Модуль Финансы (OrderClosing)** | триггер | При Shipment → `delivered` обновляется прогресс финансового закрытия |
| → **Модуль Финансы (Payment)** | косвенно | Через `SupplierDelivery.paymentStatus` (оплата поставщику — в v2) |

---

## 11. Концепции и правила (для нового разработчика)

### 11.1 Принцип «immutable movements»

`StockMovement` — **никогда не редактируется задним числом**. Если движение ошибочно — создаётся **встречное движение** (return / re-add). Это защищает аудит-трейл.

### 11.2 Snapshot-поля

Все `*Item` таблицы (SupplierDeliveryItem, ShipmentItem, WriteOffItem, PurchaseOrderItem) хранят **snapshot** полей `productSku, productName, unit` на момент создания. Это защищает историю — изменение в `Product` потом не сломает старые документы.

### 11.3 Soft-delete

Все 4 новые сущности имеют `isActive: Boolean default true`. Удаление = `isActive=false` + `archivedAtDateTime`. Физическое удаление в v1 **запрещено** (по конвенции всего проекта v6).

### 11.4 Отдельные счётчики

Префиксы `СД-XXXX`, `ОТК-XXXX`, `АС-XXXX`, `ЗП-XXXX` имеют **отдельные sealed counter tables** (см. `archive/MIGRATION-PLAN-Phase1.md`) — для защиты от race conditions при параллельном создании.

### 11.5 Currency = RUB жёстко

В v1 все суммы/стоимости в этих сущностях хранятся в RUB. Мульти-валюта — в v2 (закреплено СПОР-14).

### 11.6 Нумерация ЗП не синхронизирована с КП/Договором/ЗК

`ЗП-0042` может существовать рядом с `КП-0042`, `Д-0042`, `ЗК-0042` — это нормально (разные счётчики, см. СПОР-13).

### 11.7 Финансовое закрытие через внешние события, не через каскад

R4 из АНАЛИЗ-П1: «Order закрыт → что с КП/Договором/ЗК?» — закреплено: **никаких каскадных переходов**. Каждый модуль управляет своими статусами. Финансы ЗАВИСЯТ от отгрузки (Shipment.delivered), но не НАОБОРОТ.

### 11.8 ЗК без товаров (GAP-009)

Если ЗК содержит только услуги (тип INSTALLATION/SERVICE/WORK) — **никаких StockMovement не создаётся**, **Shipment не создаётся**. Кладовщик получает **только информационное сообщение** в `/warehouse`: «ЗК-0023 завершён, в Склад прихода нет (только услуги)». Это закрывает R1 + GAP-009.

---

## 12. Глоссарий v6 (дополнение к модульному)

- **Приход:** увеличение StockRecord через `StockMovement.type=in`.
- **Расход:** уменьшение StockRecord через `StockMovement.type=out, reason=sale` (для отгрузки клиенту).
- **Списание:** уменьшение StockRecord через `StockMovement.type=out, reason=write_off` (для брака/недостачи).
- **Перемещение (transfer):** уменьшение на одном складе + увеличение на другом через два связанных `StockMovement.type=transfer`.
- **Резерв:** не-реальное уменьшение остатка, а «заморозка» под КП/ЗК через `Reservation.quantity`. `availableQty = quantity - reservedQuantity`.
- **availableQty (доступно):** то, что можно физически отгрузить (= quantity − reservedQuantity).
- **minStock:** минимальный желаемый остаток (поле на Product), при падении ниже — авто-триггер на `PurchaseRequest`.

---

## 13. Открытые вопросы v1 — ✅ ВСЕ ЗАКРЫТЫ (24.06.2026)

> Источник: `OPEN-QUESTIONS-MASTER.md` раздел 2 (P1 + P2 Склад). Каждое решение применено в §3 (StockMovement), §5 (SupplierDelivery), §6 (Shipment), §8 (PurchaseOrder).

### Q1. ✅ ЗАКРЫТО (R1 + GAP-009)

**Решение:** Кладовщик видит «информационное сообщение» в `/warehouse` — «ЗК-XXXX завершён, в Склад не пришло (только услуги/работы)». Подробности в `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §11.8.

(Описание ниже — сохранено для истории.)
- ✅ **Решение v1 (по итогам Sub-block 2b):** кладовщик получает **информационное сообщение** в `/warehouse` (без создания StockMovement). Закрыто в §11.8.

### Q2. ✅ РЕШЕНО: A (отложен в v2)

**Решение:** Отложен в v2. В v1 используется `WriteOffAct.reason=DEFECT` (списание брака) как workaround. Полноценный `ClientReturn` модуль — v2 при реальных запросах клиентов.

(Описание ниже — сохранено для истории.)
- Сценарий «клиент вернул товар после отгрузки» не входит в v1.
- В v2: новый статус `Shipment.status = returned` + `StockMovement.reason = sale_return` (поле уже зарезервировано в enum).
- **Решение v1:** используем `WriteOffAct.reason = sale_return` (если будет) или просто новый документ `ReturnAct` в v2. До этого — списание через `WriteOffAct.reason = inventory_shortage` (без связи с клиентом).

### Q3. ✅ РЕШЕНО: A

**Решение:** Через списание `WriteOffAct.reason=DEFECT` + ручное оформление возврата денег (отрицательный Payment отдельно или Refund в Модуле Финансы). Полная рекомбинация через `SupplierReturn` — v2.

(Описание ниже — сохранено для истории.)
- Если поставщик привёз брак, и мы хотим вернуть ему товар и деньги.
- В v1 — **только через списание** (`WriteOffAct`) + ручное оформление возврата денег.
- В v2 — `ReverseSupplierDelivery` со встречным `StockMovement.type=out, reason=purchase_return`.

### Q4. ✅ РЕШЕНО: A

**Решение:** При `quantityPlanned > availableQty` — WARN + ручное подтверждение менеджера. **НЕ блокировка** (в v1). Блокировка отвергнута — слишком часто ошибочные резервы в реальной жизни. Подробнее в `SCHEMA-CONSOLIDATED.md` §5.3.

(Описание ниже — сохранено для истории.)
- Должна ли система блокировать `Shipment` если `quantity > StockRecord.availableQty`?
- **Вариант A:** Блокировать (риск: не отгрузим, если резерв был создан ошибочно).
- **Вариант B:** Только warning (разрешить, но с подтверждением).
- **Рекомендация v1:** B (warning + ручное подтверждение менеджера/директора).

### Q5. ✅ РЕШЕНО: A

**Решение:** Два отдельных `Shipment` документа (по одному на каждый склад). Простой audit-trail. Альтернатива (один Shipment с partial fills) усложняет модель данных и audit — отвергнута.

(Описание ниже — сохранено для истории.)
- Если клиенту нужно 15 колец, на Основном 10, на Партнёрском 5 — как оформить?
- **Вариант A:** один Shipment, два `warehouseId`-записи (усложняет схему items[]).
- **Вариант B:** два Shipment (по одному на склад).
- **Рекомендация v1:** B (проще).

### Q6. ✅ РЕШЕНО: A

**Решение:** `SupplierDelivery.supplierPurchaseOrderId = NULL` допустимо. Создавать может `storekeeper` или `admin`. Кладовщик может принять товар, пришедший без предварительной заявки (срочные поставки, ошибки в планировании).

(Описание ниже — сохранено для истории.)
- В теории, машина может приехать раньше, чем мы оформили ЗП.
- **Вариант A:** Запрещено — сначала ЗП, потом приход.
- **Вариант B:** Разрешено — `supplierPurchaseOrderId` опционально.
- **Решение v1:** B (поле optional, закупщик оформит ЗП постфактум).

### Q7. ✅ РЕШЕНО: A

**Решение:** Оба режима поддерживаются через фильтр по категории товара (Product.category). В UI Inventory — dropdown «Все товары / По категории X / По локации Y».

(Описание ниже — сохранено для истории.)
- Должна ли инвентаризация быть по всему складу одним актом, или выборочно по категории?
- **Решение v1:** поддержать оба режима — фильтр по категории в форме инвентаризации.

### Q8. ✅ РЕШЕНО: A

**Решение:** Отложено в v2. В v1 нет лимитов на PurchaseOrder — director контролирует вручную через approve-цепочку.

(Описание ниже — сохранено для истории.)
- Нужен ли отдельный дашборд «План/факт закупок»?
- **Решение v1:** нет (отложено в v2 вместе с BI-дашбордами).

---

## 14. Что НЕ делаем в первой версии (границы MVP)

- **Штрих-коды и мобильный сканер** (Android-приложение для кладовщика) — v2.
- **Шаблоны документов** (SupplierDelivery/Shipment/WriteOffAct/PurchaseOrder без красивых шаблонов, только табличный view) — v1.
- **Печатные формы** (PDF) для приходных/расходных накладных — v1 (базовые), красивые — v2.
- **Статистика по оборачиваемости товара** (turnover days) — v2.
- **ABC/XYZ анализ** (классификация товаров по обороту) — v2.
- **Прогнозирование спроса** (ML) — никогда (по решению СТЕК-ПРЕДПИСАНИЕ.md §6.10).
- **Интеграция с бухгалтерией** (1С, МойСклад) — v2.
- **Multi-currency** — v2 (закреплено СПОР-14).
- **CDN для фото товаров** — v2 (закреплено СТЕК-ПРЕДПИСАНИЕ §6.10).
- **Аудит-лог изменений** (кто что менял задним числом) — v2.

---

## Связанные документы

- `МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md` — источник отгрузок напрямую (R1).
- `МОДУЛЬ-ДОГОВОР.md` — parentContractId для закупок.
- `МОДУЛЬ-ПРОИЗВОДСТВО.md` — источник авто-создания Shipment при завершении ЗК.
- `МОДУЛЬ-ФИНАНСЫ.md` — OrderClosing, Payment.
- `АНАЛИЗ-П1.md` — источник §1.12–1.16 для базовых сущностей + §3 строки 8–11 для U1.
- `ЖУРНАЛ-ПРОГОНА.md` — закрывает **GAP №8 (часть 1)** — 24.06.2026.
- `ВЕРИФИКАЦИЯ-ЧЕКЛИСТ.md` — покрывает пункты V-009, V-028, V-052, V-067, V-072.
- `archive/MIGRATION-PLAN-Phase1.md` — план миграций для этих таблиц (Phase 2 Bootstrap).
- `СПОРНЫЕ-МОМЕНТЫ.md` — зафиксированные резолюции СПОР-13 (отдельные счётчики), СПОР-14 (RUB жёстко).

---

> **Статус каркаса:** ✅ V0 (24.06.2026). Закрывает **GAP №8 (часть 1)** из ЖУРНАЛ-ПРОГОНА. Полные схемы для 4 сущностей: SupplierDelivery, Shipment, WriteOffAct, PurchaseOrder. Готов к Phase 2 Bootstrap миграций.
