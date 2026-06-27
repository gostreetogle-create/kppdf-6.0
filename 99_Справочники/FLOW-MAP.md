# FLOW-MAP.md — Визуальная карта потоков данных v6

> **Дата:** 2026-06-24.
> **Назначение:** Единая визуальная карта всех потоков данных между 5 модулями + триггеры автоматических переходов + типичные sad-paths.
>
> **Источники:** `МАСТЕР-АУДИТ-V6.md` §6 + `МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md` §1, §2 + `МОДУЛЬ-ДОГОВОР.md` §0, §6 + `МОДУЛЬ-ПРОИЗВОДСТВО.md` §0, §6 + `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §11 + `МОДУЛЬ-ФИНАНСЫ.md` §4 + `ЖУРНАЛ-ПРОГОНА.md` (R1-R4).

---

## 0. TL;DR — главная цепочка

**Happy path:**
```
КП (DRAFT) → КП (SENT) → КП (ACCEPTED) → КП (PAID → авто ЗК CREATED)
                                                    ↓
Договор (DRAFT) → Договор (SENT) → Договор (SIGNED → авто Order CREATED)
                                              ↓
ЗК (PLANNING) → ЗК (IN_PROGRESS) → ЗК (COMPLETED → авто приход Склад + Shipment)
                                                       ↓
Отгрузка (SHIPPED → авто StockMovement:OUT) → Доставка (DELIVERED → OrderClosing++)
                                                       ↓
Счёт-фактура + Payment → Invoice FULLY_PAID → Order CLOSED → МАРЖА
```

---

## 1. Главная диаграмма потоков (Mermaid + ASCII)

### 1.1 Mermaid

```mermaid
flowchart TD
    %% Участники
    Manager[Менеджер по продажам]
    Client[Клиент]
    Director[Директор]
    Storekeeper[Кладовщик]
    Accountant[Бухгалтер]
    Production[Начальник производства]

    %% Сущности — КП
    KP[КП Proposal<br/>number=КП-XXXX<br/>status: DRAFT/SENT/ACCEPTED/<br/>REJECTED/PAID/CONVERTED]
    Contract[Договор Contract<br/>number=Д-XXXX<br/>status: DRAFT/SENT/SIGNED/<br/>IN_PROGRESS/COMPLETED/<br/>ARCHIVED/TERMINATED]
    ZK[Производственный заказ<br/>ProductionOrder<br/>number=ЗК-XXXX<br/>status: 8 значений]
    Catchment[StockMovement<br/>IN reason=production]
    Shipment[Отгрузка Shipment<br/>number=ОТК-XXXX]
    OutFlow[StockMovement<br/>OUT reason=sale]
    OrderFinance[Order Финансы<br/>number=Order-XXXX]
    Invoice[Invoice Inv-XXXX]
    Payment[Payment Pay-XXXX<br/>type=INCOMING]
    Refund[Refund Ref-XXXX<br/>Возврат клиенту]
    Storno[Payment.type=STORNO<br/>amoutlt0]

    %% Потоки
    Manager -->|создаёт| KP
    KP -->|отправляет клиенту| Client
    Client -->|принимает| KP
    KP -->|оплачено → авто| ZK
    KP -->|конвертирует| Contract
    Contract -->|подписан → авто| OrderFinance
    Client -->|подписывает| Contract
    Production -->|планирует| ZK
    ZK -->|завершён → авто| Catchment
    Catchment -->|обновляет| StockRecord[(StockRecord<br/>availableQty)]
    Production -->|ЗК завершён + только ITEM| Shipment
    Storekeeper -->|shipped| Shipment
    Shipment -->|авто| OutFlow
    OutFlow --> StockRecord
    Shipment -->|delivered| OrderClosingUpdate[OrderClosing.progress++]
    Accountant -->|создаёт| Invoice
    Client -->|платит| Payment
    Payment -->|зачислено| Invoice
    Invoice -->|paidAmount = amount| Invoice
    Invoice -->|все оплачены| OrderFinance
    OrderFinance -->|ЗК отменён| Refund
    OrderFinance -->|ERROR в Payment| Storno
```

### 1.2 ASCII (читаемая версия)

```
═══════════════════════════════════════════════════════════════════════════
                         ГЛАВНАЯ ЦЕПОЧКА «КП → ДЕНЬГИ»
═══════════════════════════════════════════════════════════════════════════

  Менеджер                   Клиент              Главная цепочка
     │                          │                       │
     │ 1. Создать КП            │                       │
     ▼                          │                       │
   ┌─────────┐                  │                       │
   │ КП-X    │ DRAFT            │                       │
   │ status  │                  │                       │
   └────┬────┘                  │                       │
        │ Отправить             │                       │
        ▼                       │                       │
   ┌─────────┐                  │                       │
   │ КП-X    │ SENT       ─────▶│ Прочитать             │
   │ status  │                  │                       │
   └────┬────┘                  │                       │
        │ ◀─── Принять ────── ─┘                       │
        ▼                                              │
   ┌─────────┐                                          │
   │ КП-X    │ ACCEPTED                                │
   │ status  │                                          │
   └────┬────┘─────┬───────────────┐                    │
        │           │               │                    │
        │           │ Оплатить (авто=>ЗК)              │
        │           ▼               ▼                    │
        │     ┌─────────┐    ┌─────────────┐           │
        │     │  ЗК-Х   │    │ Договор (от │           │
        │     │ CREATED │◀───│ КП)         │           │
        │     └─────────┘    └──────┬──────┘           │
        │           │               │ Подписать         │
        │           │               ▼                   │
        │           │        ┌─────────────┐            │
        │           │        │ Договор     │            │
        │           │        │ SIGNED      │ ──▶ авто────▶ Заказ (Order)
        │           │        └─────────────┘            │
        │           ▼                                  │
        │     ЗК в работу (production_head)             │
        │     ┌─────────────┐                          │
        │     │  ЗК-Х       │                          │
        │     │ IN_PROGRESS │                          │
        │     └──────┬──────┘                          │
        │            │ Завершить (все задачи done)        │
        │            ▼                                  │
        │     ┌─────────────┐                          │
        │     │  ЗК-Х       │                          │
        │     │ COMPLETED   │                          │
        │     └──────┬──────┘                          │
        │            │ (только Product.kind=ITEM)       │
        │            ▼                                  │
        │     ┌─────────────┐    ┌─────────────┐      │
        │     │ ЗК→Склад    │───▶│Shipment ОТК-Х│      │
        │     │ авто-приход │    │ PLANNED     │      │
        │     │ (StockMvmt) │    └──────┬──────┘      │
        │     └─────────────┘           │ Упаковать    │
        │                                ▼             │
        │                          ┌─────────────┐      │
        │                          │Shipment     │      │
        │                          │ PACKED      │      │
        │                          └──────┬──────┘      │
        │                                 │ Отгрузить  │
        │                                 ▼             │
        │                          ┌─────────────┐      │
        │                          │Shipment     │      │
        │                          │ SHIPPED     │────▶ авто StockMvmt OUT
        │                          └──────┬──────┘      │
        │                                 │ Доставить  │
        │                                 ▼             │
        │                          ┌─────────────┐      │
        │                          │Shipment     │────▶ OrderClosing.progress++
        │                          │ DELIVERED   │      │
        │                          └─────────────┘      │
        │                                                │
        ▼                                                │
   Бухгалтер                                            │
     │ Создать счёт (Invoice)                            │
     ▼                                                │
   ┌─────────────┐                                    │
   │Invoice Inv-X│                                    │
   │ ISSUED      │                                    │
   └──────┬──────┘                                    │
          │ Клиент заплатил                            │
          ▼                                            │
   ┌─────────────┐                                    │
   │Payment Pay-X│                                    │
   │ INCOMING    │                                    │
   └──────┬──────┘                                    │
          │ зачислить                                  │
          ▼                                            │
   ┌─────────────┐                                    │
   │Invoice      │                                    │
   │ FULLY_PAID  │                                    │
   └──────┬──────┘                                    │
          │ все Invoice оплачены                       │
          ▼                                            │
   ┌─────────────┐                                    │
   │Order        │                                    │
   │ CLOSED      │ ──▶ МАРЖА = totalAmount - COGS     │
   └─────────────┘                                    │
                                                       ▼
                                                Сделка завершена

═══════════════════════════════════════════════════════════════════════════
```

---

## 2. Автоматические триггеры (явный список)

| Триггер | Что создаёт | Обязательно? |
|---|---|---|
| `Proposal.status = 'paid'` | авто `ProductionOrder` (ЗК-ХХХХ, status=CREATED) | ДА |
| `Contract.status = 'signed'` (СПОР-5) | авто `Order` (Order-ХХХХ, status=DRAFT → авто IN_PROGRESS) | ДА |
| `ProductionOrder.status = 'completed'` (только для `Product.kind='ITEM'`) | авто `StockMovement` (IN, reason=PRODUCTION) для каждой ITEM-задачи | ДА, опционально по типу |
| `ProductionOrder.status = 'completed'` + ЗК имеет ITEM-positions | авто-ПРЕДЛОЖЕНИЕ создать `Shipment` (кладовщик подтверждает кнопкой) | НЕТ — авто-предложение, кладовщик подтверждает |
| `Shipment.status = 'shipped'` | авто `StockMovement` (OUT, reason=SALE) для каждого `ShipmentItem` | ДА |
| `Shipment.status = 'delivered'` | `OrderClosing.progress += quantityActual` (в v1 ручной бухгалтером, v2 авто) | ЧАСТИЧНО |
| `SupplierDelivery.status = 'completed'` | авто `StockMovement` (IN, reason=PURCHASE) для каждого `SupplierDeliveryItem` | ДА |
| `WriteOffAct.status = 'completed'` | авто `StockMovement` (OUT, reason=WRITE_OFF) для каждого `WriteOffItem` | ДА |
| `ProductionOrder.status = 'completed'` (ЗК с НЕ-item позициями) | кладовщик получает **информационное сообщение** (без StockMovement) — GAP-009 ✓ | ДА (закрыто) |
| `availableQty < minStock` (ежедневный cron) | авто `PurchaseRequest` (status=pending, reason=LOW_STOCK) | ДА (через cron) |
| `Shipment.delivered` → StockRecord.quantity vs initial | если quantity < 50%: авто-триггер `ProductionOrder.status = PARTIAL` | v2 |

---

## 3. Sad paths (3 типичных сценария возврата/отмены)

### 3.1 ЗК отменён ПОСЛЕ оплаты клиентом

```
КП «Оплачено» → авто ЗК СОЗДАНА → ЗК в работе → всё оплачено
                                                        ↓
                                              ЗАКАЗЧИК ЗАХОТЕЛ ОТМЕНИТЬ
                                                        ↓
1. Менеджер останавливает производство → ЗК.status = CANCELLED
2. Бухгалтер в Модуле Финансы создаёт Сторно (если была ошибка в Payment)
   ИЛИ
3. Бухгалтер создаёт Refund (возврат реальных денег клиенту)
   - Refund.amount = оплаченная сумма
   - Refund.reason = "Отмена ЗК-ХХХХ по запросу клиента"
   - Refund.originalPaymentId = тот Payment, который был входящим
4. После проведения Refund: Order.status = CANCELLED (закреплено 24.06.2026)
5. КП остаётся в «Оплачено» (СПОР-12) — финальный статус
6. Договор.status = TERMINATED (закреплено 24.06.2026)
```

**Что НЕ происходит:**
- ❌ КП не возвращается в «Принято» (КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ретро-менять).
- ❌ Договор не возвращается в черновик.
- ❌ Никаких каскадных переходов (R4 зафиксировано).

### 3.2 Менеджер «Оплачено» по ошибке

```
Менеджер «случайно» нажал «Отметить как оплачено»
   ↓
КП.status = PAID → авто-создана ЗК-ХХХХ (ЗК.CREATED) → ЗК в работе → Shipment возможно отгружен
   ↓
Обнаружена ошибка (через банковскую сверку или просто звонок клиента)
   ↓
Что делать? (GAP-011 было, НО для Phase 1 Bootstrap принят консервативный путь):
1. НЕ автоматический откат (КП нельзя конвертировать из «Оплачено» если уже есть ЗК)
2. ТОЛЬКО через бухгалтера:
   - Если деньги НЕ приходили: бухгалтер создаёт STORNO по ошибке в Payment + Order закрывается с cancaled
   - Если деньги приходили и уже что-то отгрузили: Refund + ручное закрытие Order
3. ЗК остаётся в системе как «отменён канцелярски» с пометками в audit-trail
```

**R0 в v1:** Manual recovery через бухгалтера. Автоматического отката нет.

### 3.3 Клиент вернул товар через 2 недели после отгрузки

```
SHIPMENT.Delivered → клиент использовал товар → обнаружен брак
   ↓
Клиент просит возврат/замену
   ↓
В v1:
  - Товар НЕ возвращается на Склад (нет Shipment.status='returned', нет sale_return)
  - Брак фиксируется через WriteOffAct (reason='defect') — но это не возврат от клиента, а списание на нашей стороне
  - Деньги возвращаются через Refund в Модуле Финансы
В v2:
  - Полноценный flow: Shipment.status='returned' + StockMovement.reason='sale_return' + Refund
```

**Текущее:** Sad path возврата от клиента отложен в v2 (Q-SKOL-2).

---

## 3.4 Mermaid: Order trigger detail (СПОР-5)

> **Источник:** `МОДУЛЬ-ФИНАНСЫ.md` §4, `СПОРНЫЕ-МОМЕНТЫ.md` СПОР-5.

```mermaid
flowchart TD
    subgraph КП ["Модуль КП"]
        KP_SENT["КП SENT<br/>отправлен клиенту"]
        KP_ACCEPTED["КП ACCEPTED<br/>клиент принял"]
        KP_CONVERTED["КП CONVERTED<br/>сконвертировано в Договор"]
        KP_PAID["КП PAID<br/>оплачено"]
    end

    subgraph ДОГОВОР ["Модуль Договор"]
        D_DRAFT["Договор DRAFT<br/>создан из КП"]
        D_SENT["Договор SENT<br/>отправлен клиенту"]
        D_SIGNED["Договор SIGNED<br/>подписан клиентом"]
    end

    subgraph ФИНАНСЫ ["Модуль Финансы"]
        ORDER_DRAFT["Order DRAFT<br/>авто-создан"]
        ORDER_IN_PROGRESS["Order IN_PROGRESS<br/>авто-переход"]
        INVOICE["Invoice ISSUED<br/>счёт выставлен"]
        PAYMENT["Payment INCOMING<br/>оплата получена"]
        ORDER_CLOSED["Order CLOSED<br/>все оплачены"]
    end

    KP_SENT -->|"клиент принять"| KP_ACCEPTED
    KP_ACCEPTED -->|"конвертировать"| KP_CONVERTED
    KP_CONVERTED --> D_DRAFT
    D_DRAFT -->|"отправить"| D_SENT
    D_SENT -->|"клиент подписать"| D_SIGNED

    D_SIGNED -->|"СПОР-5: авто"| ORDER_DRAFT
    ORDER_DRAFT -->|"авто"| ORDER_IN_PROGRESS
    ORDER_IN_PROGRESS -->|"бухгалтер"| INVOICE
    INVOICE -->|"клиент платит"| PAYMENT
    PAYMENT -->|"зачислить"| ORDER_IN_PROGRESS
    ORDER_IN_PROGRESS -->|"все Invoice paid"| ORDER_CLOSED

    KP_PAID -->|"авто"| ZK["ЗК CREATED<br/>(Производство)"]

    style D_SIGNED fill:#4CAF50,color:#fff
    style ORDER_DRAFT fill:#2196F3,color:#fff
    style ORDER_CLOSED fill:#4CAF50,color:#fff
    style KP_PAID fill:#FF9800,color:#fff
```

**Caption:** Автоматическое создание Order при подписании Договора (СПОР-5). Order создаётся в `DRAFT` → авто `IN_PROGRESS`. Параллельно при оплате КП создаётся ЗК в Производстве.

---

## 3.5 Mermaid: Refund flow (СПОР-12)

> **Источник:** `МОДУЛЬ-ФИНАНСЫ.md` §6+§10, `СПОРНЫЕ-МОМЕНТЫ.md` СПОР-12.

```mermaid
flowchart TD
    subgraph ПРИЧИНА ["Причина Refund"]
        ZK_CANCELLED["ЗК CANCELLED<br/>отменён производством"]
        CLIENT_RETURN["Клиент вернул товар<br/>(v2)"]
        ERROR_PAYMENT["Ошибка в Payment<br/>(v1: сторно)"]
    end

    subgraph REFUND_FLOW ["Refund flow"]
        accountant["Бухгалтер<br/>создаёт Refund"]
        REFUND_DRAFT["Refund DRAFT<br/>amount > 0"]
        director_approve{"Сумма > 50 000 ₽?"}
        REFUND_APPROVED["Refund APPROVED"]
        REFUND_COMPLETED["Refund COMPLETED<br/>деньги возвращены"]
    end

    subgraph ЭФФЕКТ ["Эффект на документы"]
        ORDER_CANCELLED["Order → CANCELLED"]
        KP_PAID_STAYS["КП остаётся PAID<br/>СПОР-12: не ретро-менять"]
        CONTRACT_TERMINATED["Договор → TERMINATED"]
        STORNO["Payment.type=STORNO<br/>amount < 0"]
    end

    ZK_CANCELLED --> accountant
    CLIENT_RETURN --> accountant
    ERROR_PAYMENT --> STORNO

    accountant --> REFUND_DRAFT
    REFUND_DRAFT --> director_approve
    director_approve -->|"Да"| REFUND_APPROVED
    director_approve -->|"Нет"| accountant
    REFUND_APPROVED --> REFUND_COMPLETED

    REFUND_COMPLETED --> ORDER_CANCELLED
    REFUND_COMPLETED --> KP_PAID_STAYS
    REFUND_COMPLETED --> CONTRACT_TERMINATED

    STORNO -->|"correctsPaymentId"| ORDER_CANCELLED

    style ZK_CANCELLED fill:#f44336,color:#fff
    style REFUND_COMPLETED fill:#4CAF50,color:#fff
    style KP_PAID_STAYS fill:#FF9800,color:#fff
    style STORNO fill:#9C27B0,color:#fff
```

**Caption:** Refund flow — от отмены ЗК до возврата денег. СПОР-12: КП остаётся `PAID` (финальный статус). Refund ≠ Storno (GAP-023).

---

## 3.6 Mermaid: Cross-module happy path (высокий уровень)

> **Источник:** `МОДУЛЬ-ФИНАНСЫ.md` §4, `МОДУЛЬ-ПРОИЗВОДСТВО.md` §5, `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §11.

```mermaid
flowchart LR
    KP["КП<br/>MANAGER"]
    CONTRACT["Договор<br/>MANAGER"]
    ORDER["Order<br/>ФИНАНСЫ"]
    ZK["ЗК<br/>ПРОИЗВОДСТВО"]
    STOCK_IN["Приход<br/>СКЛАД"]
    SHIPMENT["Отгрузка<br/>СКЛАД"]
    STOCK_OUT["Расход<br/>СКЛАД"]
    INVOICE["Invoice<br/>ФИНАНСЫ"]
    PAYMENT["Payment<br/>ФИНАНСЫ"]
    CLOSED["Order CLOSED<br/>МАРЖА"]

    KP -->|"конвертировать"| CONTRACT
    CONTRACT -->|"подписан → авто"| ORDER
    KP -->|"оплачено → авто"| ZK
    ZK -->|"завершён → авто"| STOCK_IN
    STOCK_IN -->|"кладовщик"| SHIPMENT
    SHIPMENT -->|"shipped → авто"| STOCK_OUT
    SHIPMENT -->|"delivered"| ORDER
    ORDER -->|"бухгалтер"| INVOICE
    INVOICE -->|"клиент"| PAYMENT
    PAYMENT -->|"все paid"| CLOSED

    style KP fill:#FF9800,color:#fff
    style CONTRACT fill:#2196F3,color:#fff
    style ORDER fill:#4CAF50,color:#fff
    style ZK fill:#9C27B0,color:#fff
    style CLOSED fill:#4CAF50,color:#fff
```

**Caption:** Полный cross-module happy path: КП → Договор → Order → ЗК → Склад → Invoice → Payment → Closed. Автоматические триггеры помечены стрелками «→ авто».

---

## 3.4 Mermaid-диаграммы (cross-module потоки)

### Diagram 1: High-level — 5 модулей и их статусы

> **Источник:** `ФЛОВ-МАП` §1 + `МОДУЛЬ-ФИНАНСЫ.md` §4 + `СПОРНЫЕ-МОМЕНТЫ.md` все 15.

```mermaid
flowchart LR
    subgraph KP["01_КП"]
        D1[DRAFT] -->|отправлено| S1[SENT]
        S1 -->|принято| A1[ACCEPTED]
        A1 -->|оплачено → авто ЗК| P1[PAID]
        A1 -->|конвертация| C1[CONVERTED]
    end

    subgraph DOG["02_Договор"]
        D2[DRAFT] -->|отправлен| S2[SENT]
        S2 -->|подписан → авто Order| SIG[SIGNED]
        SIG -->|завершён| CO2[COMPLETED]
        SIG -->|отмена ЗК| T2[TERMINATED]
    end

    subgraph PR["03_Производство"]
        CR[CREATED] -->|планирование| PL[PLANNING]
        PL -->|в работу| IP[IN_PROGRESS]
        IP -->|завершён → авто приход Склад| CO3[COMPLETED]
        IP -->|отмена| CA[CANCELLED]
    end

    subgraph SK["04_Склад"]
        SH[PLANNED] -->|упакован| PA[PACKED]
        PA -->|отгружен → авто StockMvmt OUT| SH2[SHIPPED]
        SH2 -->|доставлен| DE[DELIVERED]
    end

    subgraph FI["05_Финансы"]
        OD[DRAFT] -->|авто от Order| IP2[IN_PROGRESS]
        IP2 -->|все Invoice оплачены| CL[CLOSED]
        IP2 -->|отмена| CN[CANCELLED]
    end

    P1 -.->|авто ЗК| CR
    SIG -.->|авто Order| OD
    CO3 -.->|авто StockMvmt IN| SK
    DE -.->|OrderClosing.progress++| FI
```

> *Caption: High-level карта 5 модулей с триггерами автоматических переходов между ними. Стрелки `-.->` = авто-триггеры, `-->` = ручные переходы.*

### Diagram 2: Order trigger detail (СПОР-5)

> **Источник:** `СПОРНЫЕ-МОМЕНТЫ.md` СПОР-5 + `МОДУЛЬ-ФИНАНСЫ.md` §4.

```mermaid
flowchart TD
    A["Contract.status = SIGNED<br/>(клиент подписал)"] --> B{"Есть parentProposalId?"}
    B -->|Да| C["Читаем Proposal.items<br/>(snapshot)"]
    B -->|Нет| ERR["❌ Ошибка: Договор без КП"]
    C --> D["Создаём Order<br/>status = DRAFT"]
    D --> E["Копируем позиции<br/>ContractItem → OrderItem"]
    E --> F["Order.status → IN_PROGRESS<br/>(авто)"]
    F --> G["Бухгалтер выставляет Invoice"]
    G --> H["Клиент платит → Payment"]
    H --> I["Invoice → FULLY_PAID"]
    I --> J{"Все Invoice оплачены?"}
    J -->|Да| K["Order → CLOSED<br/>Маржа рассчитана"]
    J -->|Нет| L["Order → AWAITING_PAYMENT"]
```

> *Caption: Детальная схема триггера создания Order при подписании Договора (СПОР-5). Все шаги автоматические除了 Invoice/Payment.*

### Diagram 3: Refund сценарий (СПОР-12)

> **Источник:** `СПОРНЫЕ-МОМЕНТЫ.md` СПОР-12 + `МОДУЛЬ-ФИНАНСЫ.md` §6.

```mermaid
flowchart TD
    A["ЗК-XXXX отменён<br/>(Орлов нажал «Отменить»)"] --> B["КП остаётся<br/>status = PAID<br/>(СПОР-12)"]
    A --> C["Order-XXXX<br/>status = IN_PROGRESS"]
    C --> D{"Была отгрузка?"}
    D -->|Да: частичная| E["Refund =<br/>paidAmount −<br/>стоимость отгрузки"]
    D -->|Нет| F["Refund =<br/>paidAmount"]
    D -->|Полная| F
    E --> G["Refund.amount ≤<br/>Payment.amount<br/>(инвариант §6.2)"]
    F --> G
    G --> H["Order.paidAmount<br/>пересчитан"]
    H --> I["Order → CANCELLED"]
    I --> J["Договор → TERMINATED<br/>(авто)"]
```

> *Caption: Схема возврата денег при отмене ЗК после оплаты (СПОР-12). КП остаётся «Оплачено» — ретро-менять ЗАПРЕЩЕНО.*

---

## 4. R1-R4 (4 архитектурных разрыва — все разрешены)

| # | Разрыв (R) | Решение (24.06.2026) |
|---|---|---|
| **R1** | «ЗК без товаров» — что видит кладовщик? | GAP-009 ✓ — кладовщик получает **информационное сообщение** в /warehouse (без StockMovement). |
| **R2** | Возврат клиентом | Отложен в v2 (Q-SKOL-2). Workaround: WriteOffAct + Refund. |
| **R3** | OrderClosing.trigger | **В v1 ручной** бухгалтером через UI ОрдерКлозинга. Авто-триггер запланирован в v2. |
| **R4** | Каскадные переходы статусов | **ЗАПРЕЩЕНЫ**. Каждый модуль управляет своими статусами. Финансы ЗАВИСЯТ от отгрузки, не наоборот. |

---

## 5. Связи между модулями — таблица FK и зависимостей

### 5.1 Кто кого вызывает (imperative)

| Откуда | Куда | Когда |
|---|---|---|
| КП Оплачено | → ЗК | авто, при `paid` |
| Договор Подписан | → Order (Финансы) | авто, при `signed` (СПОР-5) |
| ЗК Завершён | → StockMovement (IN) | авто, при `completed` (только ITEM) |
| ЗК Завершён + ITEM | → Shipment (предложение) | авто-предложение кладовщику |
| Shipment Shipped | → StockMovement (OUT) | авто, при `shipped` |
| Shipment Delivered | → OrderClosing.progress | ручной бухгалтером (v1), авто (v2) |
| availableQty < minStock | → PurchaseRequest | ежедневный cron |
| ЗК.cancelled (после оплаты) | → Refund (в Финансах) | вручную бухгалтером |

### 5.2 Кто кого ЧИТАЕТ (data-flow)

| Модуль | Читает | Когда |
|---|---|---|
| КП (`ProposalItem.basePrice`) | Product.basePrice | при формировании КП (snapshot) |
| КП (`Reservation`) | StockRecord.availableQty | при открытии корзины / витрины товаров |
| Договор (`ContractItem.*`) | Proposal + ProposalItem | при конвертации (snapshot) |
| ЗК (`ProductionTask.product`) | Product | при распределении |
| Склад (`StockRecord.availableQty`) | Reservation + StockMovement | при показе в /warehouse |
| Финансы (`Order.totalAmount`) | Contract | при создании (snapshot через разные поля) |
| Финансы (`OrderClosing.margin`) | Shipment + WriteOffAct | при ручном / авто расчёте маржи |

### 5.3 FK-связи (БД-уровень)

Все FK — см. `SCHEMA-CONSOLIDATED.md` §2 «Сводная таблица FK + ON DELETE» (50+ строк).

Ключевые ON DELETE = RESTRICT (НЕЛЬЗЯ удалить):
- `ProductionOrder.parentProposalId` — НЕЛЬЗЯ удалить КП пока есть ЗК
- `Contract.parentProposalId` — НЕЛЬЗЯ удалить КП пока есть Договор
- `Order.contractId` — НЕЛЬЗЯ удалить Договор пока есть Order
- `StockRecord.{warehouseId, productId}` — НЕЛЬЗЯ удалить Склад/Товар с ненулевым остатком

---

## 6. RBAC в потоках (кто может двигать что)

Сводная матрица — в `RBAC-MATRIX.md`. Здесь — критичные переходы по потокам:

| Поток | Кто может | RBAC |
|---|---|---|
| КП → ЗК (авто) | авто (система) | — |
| КП «Оплачено» | manager (свой), director, admin | без бухгалтера! (СПОР-4) |
| Договор «Подписан» | manager (свой) | — |
| ЗК → Завершить | production (свой), director | НЕ manager (он уже сделал «Оплачено» — нет) |
| Shipment «Отгрузить» | storekeeper, admin, director | НЕ manager (он создал КП, но не отгружает) |
| WriteOff Approve | accountant (≤ 5000₽), director (любая сумма) | — |
| Refund создать | accountant, director, admin | НЕ manager |
| Payment регистрировать | accountant | — |

---

## 7. Триггеры v2 (отложено)

| Триггер v2 | Что делает |
|---|---|
| Shipment.delivered → авто OrderClosing.progress | вместо ручного бухгалтером |
| Shipment.delivered → авто OrderClosing.recalculate_margin | с учётом WriteOff и Refund |
| Shipment.partial → авто follow-up отгрузка | если quantityActual < quantityPlanned |
| PurchaseRequest разрешён → авто PurchaseOrder (если approved_закупщик) | ускорение закупок |
| Bank statement import → авто reconcile к Payments | заменяет ручной ввод |

---

## 8. Временная шкала типичной сделки

```
День 0:   Менеджер рисует КП-0001
День 1:   КП отправлен клиенту
День 2:   Клиент «Принято»
День 3:   Менеджер конвертирует в Договор-0001 → подписан
День 5:   Клиент «Оплачено» → авто ЗК-0001 (production_head увидел)
День 6:   Материалы в наличии → ЗК.IN_PROGRESS
День 7:   Производство завершено → ЗК.COMPLETED → авто приход Склад
День 8:   Кладовщик упаковал Shipment-0001, отгрузил → Shipment.DELIVERED
День 9:   Бухгалтер выставил Invoice-0001 → клиент платит → Payment-0001 → Order.CLOSED
День 12:  МАРЖА рассчитана ✓
```

---

## Связанные документы

- `BIG-BOOK.md` — Главный консолидатор. Цепочка «КП → Деньги» внутри в сжатой форме.
- `99_Справочники/SCHEMA-CONSOLIDATED.md` §6 — инварианты цепочки на уровне БД.
- `99_Справочники/МАСТЕР-АУДИТ-V6.md` §6 — обоснование этой карты.
- `99_Справочники/OPEN-QUESTIONS-MASTER.md` — все Q, на основании которых согласованы автоматические триггеры.
- `99_Справочники/RBAC-MATRIX.md` — кто может двигать что в потоках.

---

> **Статус:** ✅ V0 (24.06.2026). Единая карта потоков готова. Phase 1 Bootstrap миграций Prisma разблокирован.
