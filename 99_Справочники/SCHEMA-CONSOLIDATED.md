# SCHEMA-CONSOLIDATED — Единая схема БД проекта v6

> **Дата:** 2026-06-24
> **Назначение:** Сводный Prisma schema-ready документ. Содержит все сущности всех модулей в одном месте.
>
> **Источники:** АНАЛИЗ-П1.md §1 + МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md §0/§6/§7 + МОДУЛЬ-ДОГОВОР.md §7 + МОДУЛЬ-ПРОИЗВОДСТВО.md §7 + МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md §3 + МОДУЛЬ-ФИНАНСЫ.md §10 + Правки A-G + СПОР-1..15 + GAP-001..026.
>
> **Это НЕ готовый schema.prisma** — это **человекочитаемая спецификация** для разработчика, который создаст prisma/schema.prisma.

---

## 0. ПРИНЦИПЫ СХЕМЫ

### 0.1 Глобальные правила

1. **Все таблицы имеют `id: UUID @default(uuid())`** — кроме `Counter` и `Comment` (там id назначается клиентом для снижения race conditions на горячем пути).
2. **Soft delete через `isActive: Boolean @default(true)`** — единообразно для всех бизнес-сущностей.
3. **Snapshot-поля** на `*Item`-таблицах: `productSku, productName, productUnit` — копируются в момент создания, НЕ обновляются при изменении справочника.
4. **Counter-таблица защищена от race conditions** через `SELECT ... FOR UPDATE` в одной Prisma-транзакции (см. раздел Счётчики).
5. **`createdAt`/`updatedAt`** на всех сущностях (auto).
6. **ON DELETE правила** — явно для каждого FK (см. ER-таблицу ниже).

### 0.2 Связь между модулями (визуальная карта)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            KPPDF CRM v6 SCHEMA MAP                       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    1:N    ┌──────────────┐    1:N    ┌──────────────┐
  │   USER   │──────────▶│  ORGANIZATION│◀─────────│   PRODUCT    │
  └──────────┘   createdBy  │  (Клиент/Мы/│          │ (Товар/Усл.) │
        ▲       │       Поставщик)│          └──────────────┘
        │       ▼           │                      │
       FK     roles[]       │ FK                   │ FK (item)
        │       └──▶ Контакты│ Подписанты            │
        │                  │  Шаблоны               │
        │                  └──────────────┘           │
        │                         ▲                   │
        │                         │ FK                │
        │            ┌────────────┴─────────┐         │
        │            │ DOCUMENT_TEMPLATE     │         │
        │            │ (Конструктор шабл., v1│         │
        │            │  hardcoded 4 шаблона) │         │
        │            └──────────────────────┘         │
        │                                              │
        │                                              │
        │      ┌────────────────────────┐             │
        │      │      PROPOSAL (КП)      │             │
        └──┬───┤ id, number=КП-ХХХХ       │             │
           │ N1│ status, customerId→Org    │             │
              │ contractorId→Org           │             │
              │ templateId→DocumentTemplate│             │
              │ parentProposalId→Proposal │             │
              │ designSnapshot JSON       │             │
              │ packageTag?               │             │
              │ createdById→User          │             │
              │ ...                       │             │
              │ items[] (ProposalItem)────┼─────────────┘ 1:N
              └────────────┬───────────────┘
                           │ FK parentProposalId
                           │ (конвертация → Contract)
                           ▼
              ┌────────────────────────┐
              │      CONTRACT (Договор)  │
              │ id, number=Д-ХХХХ        │
              │ status = 6 enum          │
              │ parentProposalId→Prop   │
              │ parentContractId→Contract│ (versioning)
              │ templateId→DocTemplate   │
              │ customerId/contractorId  │
              │ paymentTermDays?         │
              │ currency = 'RUB' (жёстко)│
              │ packageTag?              │
              │ signedByClientAt?        │
              │ completedAt?             │
              │ items[] (ContractItem)   │
              │  ↳ productSku/name/qty   │
              │  ↳ priceWithoutVat=NUL    │ (рамочный)
              │  ↳ vatRate               │
              │  ↳ total                 │
              │  ↳ lineDiscountPercent?  │
              └────────────┬───────────────┘
                           │ FK parentContractId? (nullable)
                           │
                           ▼
              ┌────────────────────────┐
              │ PRODUCTION_ORDER (ЗК)   │
              │ id, number=ЗК-ХХХХ      │
              │ status = 8 enum         │
              │ parentProposalId→Prop   │ (строгий FK!)
              │ parentContractId→Contract│ (nullable)
              │ customerId/contractorId  │
              │ plannedStartDate?        │
              │ plannedEndDate?          │
              │ packageTag?              │
              │ items[] (ProductionTask)│
              │  ↳ productSku/name (snap)│
              │  ↳ workshopId→Workshop?  │
              │  ↳ responsibleUserId→User │
              │  ↳ quantityPlanned       │
              │  ↳ quantityActual?       │
              │  ↳ status (created→done) │
              └─────┬────────┬───────────┘
                    │        │
       ┌────────────┘        └────────────────┐
       │ (ЗК завершён →                         │
       │  авто-приход СД)                       │
       │                                         │
       ▼                                         │
  ┌──────────────────────────┐                   ▼
  │      WAREHOUSE (Склад)   │         ФИНАНСЫ (после подписания Договора)
  │ id, code, name, address   │         ┌───────────────────────┐
  │ isActive                  │◀────────│       ORDER            │
  └──────────┬───────────────┘          │ id, number=OrderXXXX  │
             │ FK                         │ status = 4 enum       │
             │                            │ proposalId→Proposal   │
             ▼                            │ contractId→Contract   │
  ┌──────────────────────┐                │ customerId/contractorId│
  │    STOCKRECORD        │                │ totalAmount           │
  │ id                    │                │ paidAmount            │
  │ warehouseId→Warehouse │                │ balance               │
  │ productId→Product     │                │ margin? (=total-COGS) │
  │ quantity (>=0)        │                │ closedAt?             │
  │ reservedQuantity (>=0)│                └──────┬─────┬─────────┘
  │ lastMovementAt        │                       │     │
  │ UNIQUE (wh,prod)      │                       │FK   │FK
  └──────────┬───────────┘                       │     │
             │ FK                                │     │
             ▼                                    │     │
  ┌──────────────────────┐                 ┌─────┘     │
  │     STOCKMOVEMENT     │                 │           │
  │ id, type              │                 ▼           ▼
  │ (in/out/transfer/w_off)│      ┌──────────────┐  ┌──────────────┐
  │ quantity (>=0)         │      │   INVOICE    │  │   PAYMENT     │
  │ reason (prod/purc/...)│      │ id, Inv-XXXX │  │ id, Pay-XXXX  │
  │ sourceProductionOrderId│      │ orderId→Order │  │ orderId→Order │
  │ sourceProposalId      │      │ amount, paid │  │ invoiceId→Inv?│
  │ sourceSupplierDeliveryId│     │ balance, due  │  │ amount (>=0!!)│
  │ transferFromWarehouseId│     │ status enum  │  │ method enum   │
  │ writeOffReason?        │      │ invoiceTypeenum│ │ receivedAt    │
  │ createdById→User      │      │  (advance/   │  │ notes?        │
  └──────────┬───────────┘       │   main/      │  └──────┬───────┘
             │ FK                │   corrective) │         │ FK (negative)
             │                  └──────┬───────┘         │
             ▼                         │                  ▼
   ┌────────────────────────────────┐  │            ┌──────────────┐
   │ НОВЫЕ сущности Склада:         │  │            │   REFUND     │
   │ ┌────────────────────────────┐ │  │            │ id           │
   │ │ SUPPLIER_DELIVERY (СД-XXXX) │ │  │            │ paymentId→Pm │
   │ │  id, status = 6 enum        │ │  │            │ amount (<0)  │
   │ │  supplierId→Org (isSuppler) │ │  │            │ reason       │
   │ │  warehouseId, supplierPOId  │ │  │            │ createdById  │
   │ │  items[] (SDItem)           │ │  │            │ createdAt    │
   │ └────────────────────────────┘ │  │            └──────────────┘
   │ ┌────────────────────────────┐ │
   │ │       SHIPMENT (ОТК-XXXX)   │ │
   │ │  id, status = 6 enum        │ │
   │ │  warehouseId                │ │
   │ │  productionOrderId?         │ │
   │ │  proposalId? (R1)           │ │
   │ │  contractId?                │ │
   │ │  customerId→Org             │ │
   │ │  items[] (ShipmentItem)     │ │
   │ └────────────────────────────┘ │
   │ ┌────────────────────────────┐ │
   │ │  WRITEOFF_ACT (АС-XXXX)     │ │
   │ │  id, status = 5 enum        │ │
   │ │  warehouseId                │ │
   │ │  reason enum (7 значений)   │ │
   │ │  approvedById?              │ │
   │ │  items[] (WriteOffItem)     │ │
   │ └────────────────────────────┘ │
   │ ┌────────────────────────────┐ │
   │ │  PURCHASE_ORDER (ЗП-XXXX)   │ │
   │ │  id, status = 8 enum        │ │
   │ │  supplierId→Org             │ │
   │ │  warehouseId                │ │
   │ │  parentContractId? (tender) │
   │ │  purchaseRequestId?         │ │
   │ │  items[] (PurchaseOrderItem)│ │
   │ └────────────────────────────┘ │
   └────────────────────────────────┘
```

---

## 1. СВОДНАЯ ТАБЛИЦА СУЩНОСТЕЙ (22 модели)

| # | Сущность | Префикс номера | Источник | FK → которые читает/пишет |
|---|---|---|---|---|
| 1 | `User` | — | АНАЛИЗ-П1 §1.22 + GAP-005 | (referenced всеми) |
| 2 | `Organization` | — | АНАЛИЗ-П1 §1.2 + GAP-002 (supplier role) | (referenced многими) |
| 3 | `OrganizationSigner` | — | АНАЛИЗ-П1 §1.3 | `organizationId` |
| 4 | `OrganizationContact` | — | АНАЛИЗ-П1 §1.4 | `organizationId` |
| 5 | `Product` | артикул (SKU) | АНАЛИЗ-П1 §1.1 + GAP-001 (kind) | `kind: ITEM\|SERVICE\|WORK`, `productType` |
| 6 | `DocumentTemplate` | — | АНАЛИЗ-П1 §1.20 + GAP-004 (blocks) | `createdById` |
| 7 | `Workshop` | — | ПРОИЗВОДСТВО §7.11 | (referenced ProductionTask) |
| 8 | `Warehouse` | — | СКЛАД §7.1 | (referenced многими) |
| 9 | `Proposal` (КП) | `КП-XXXX` | КП-ДОК §6 + СПОР-13 | `customerId`, `contractorId`, `templateId`, `parentProposalId`, `createdById`, `packageTag` |
| 10 | `ProposalItem` | — | АНАЛИЗ-П1 §1.6 + КП-ДОК §6 | `proposalId`, `productId` (snapshot SKU/name) |
| 11 | `Contract` (Договор) | `Д-XXXX` | ДОГОВОР §7 + СПОР-13 | `parentProposalId` (строгий), `parentContractId`, `customerId`, `contractorId`, `templateId`, `createdById` |
| 12 | `ContractItem` (Спецификация) | — | ДОГОВОР §7 + правка A | `contractId`, `productId` (snapshot полей) |
| 13 | `ProductionOrder` (ЗК) | `ЗК-XXXX` | ПРОИЗВОДСТВО §7 | `parentProposalId` (строгий FK!), `parentContractId?`, `customerId`, `contractorId`, `createdById` |
| 14 | `ProductionTask` | — | ПРОИЗВОДСТВО §7 | `productionOrderId`, `productId?`, `workshopId?`, `responsibleUserId?` |
| 15 | `StockRecord` | — | АНАЛИЗ-П1 §1.13 + СКЛАД §7.2 | `warehouseId`, `productId` (UNIQUE) |
| 16 | `StockMovement` | — | АНАЛИЗ-П1 §1.14 + СКЛАД §7.3 + GAP-008 часть 1 | `warehouseId`, `productId` + source FKs (nullable) |
| 17 | `Reservation` | — | АНАЛИЗ-П1 §1.15 | `proposalId`, `productId` |
| 18 | `PurchaseRequest` | — | АНАЛИЗ-П1 §1.16 | `productId` |
| 19 | `Order` (Финансы) | `Order-XXXX` | ФИНАНСЫ §10 + СПОР-13 | `proposalId`, `contractId`, `customerId`, `contractorId` |
| 20 | `Invoice` (Счёт) | `Inv-XXXX` | ФИНАНСЫ §10 + СПОР-13 | `orderId` |
| 21 | `Payment` (Платёж) + `Payment.type` enum | `Pay-XXXX` | ФИНАНСЫ §10 + СПОР-13 | `orderId`, `invoiceId?` |
| 22 | `Comment` (История) | — | правка F + GAP-007 + GAP-013 | `packageTag`, `authorId`, polymorphic FK (опционально) |
| 23 | `Counter` (нумерация) | — | СПОР-13 + `archive/MIGRATION-PLAN` | (нет FK) |
| 24 | `SupplierDelivery` (СД-ХХХХ) | `СД-XXXX` | СКЛАД-ПОДРОБНЫЙ §5 | `supplierId`, `warehouseId`, `supplierPurchaseOrderId?`, `parentContractId?`, `receivedById?` |
| 25 | `SupplierDeliveryItem` | — | СКЛАД-ПОДРОБНЫЙ §5.2 | `supplierDeliveryId`, `productId` |
| 26 | `Shipment` (ОТК-ХХХХ) | `ОТК-XXXX` | СКЛАД-ПОДРОБНЫЙ §6 | `warehouseId`, `productionOrderId?`, `proposalId?`, `contractId?`, `customerId`, `responsibleUserId?` |
| 27 | `ShipmentItem` | — | СКЛАД-ПОДРОБНЫЙ §6.2 | `shipmentId`, `productId` |
| 28 | `WriteOffAct` (АС-XXXX) | `АС-XXXX` | СКЛАД-ПОДРОБНЫЙ §7 | `warehouseId`, `createdById`, `approvedById?` |
| 29 | `WriteOffItem` | — | СКЛАД-ПОДРОБНЫЙ §7.2 | `writeOffActId`, `productId` |
| 30 | `PurchaseOrder` (ЗП-XXXX) | `ЗП-XXXX` | СКЛАД-ПОДРОБНЫЙ §8 + GAP-008 | `supplierId`, `warehouseId`, `parentContractId?`, `purchaseRequestId?`, `createdById` |
| 31 | `PurchaseOrderItem` | — | СКЛАД-ПОДРОБНЫЙ §8.2 | `purchaseOrderId`, `productId` |
| 32 | `Refund` (возврат клиенту — отдельная сущность, НЕ отрицательный Payment) | `Ref-XXXX` | GAP-023 ✅ РЕШЕНО (24.06.2026) + СПОР-12 + МОДУЛЬ-ФИНАНСЫ.md §6+§10 | `orderId`, `originalPaymentId` (NOT NULL, RESTRICT), `linkedProductionOrderId?` (SET NULL), `linkedShipmentId?` (SET NULL), `linkedWriteOffId?` (SET NULL), `reason` (NOT NULL, ≥ 3 символа), `amount > 0` (вычитается математически; НЕ отрицательный Payment), `processedAt`, `registeredAt`, `createdById` |

> 🟢 **Итого: 32 сущности** в схеме v6. Это включает 4 новые сущности Склада (SupplierDelivery, Shipment, WriteOffAct, PurchaseOrder + их Item-таблицы), а также новые сущности `Refund` и `Counter`.

---

## 2. СВОДНАЯ ТАБЛИЦА FK + ON DELETE

| Связь | FK | Тип связи | ON DELETE | Где обосновано |
|---|---|---|---|---|
| Proposal → Organization (продавец) | `contractorId` | N:1 | **RESTRICT** | КП-ДОК §9 |
| Proposal → Organization (клиент) | `customerId` | N:1 | **RESTRICT** | КП-ДОК §9 |
| Proposal → DocumentTemplate | `templateId` | N:1 | SET NULL | archive/ANALYSIS + GAP-019 |
| Proposal → Proposal (версия) | `parentProposalId` | N:1 | SET NULL | КП-ДОК §0 (на вырост) |
| Proposal → User | `createdById` | N:1 | RESTRICT | auto |
| ProposalItem → Proposal | `proposalId` | 1:N | **CASCADE** | child FK |
| ProposalItem → Product | `productId` | N:1 | RESTRICT | КП-ДОК §6 |
| Contract → Proposal | `parentProposalId` | N:1 | **RESTRICT** | ДОГОВОР §6.1 (НЕЛЬЗЯ удалить КП пока есть Договор) |
| Contract → Contract (версия) | `parentContractId` | N:1 | SET NULL | на вырост |
| Contract → Organization (продавец/клиент) | `contractorId/customerId` | N:1 | RESTRICT | ДОГОВОР §6.5 |
| ContractItem → Contract | `contractId` | 1:N | CASCADE | child FK |
| ContractItem → Product | `productId` | N:1 | RESTRICT | ДОГОВОР §7 |
| ProductionOrder → Proposal | `parentProposalId` | N:1 | **RESTRICT** | ПРОИЗВОДСТВО §6.1 (строгий FK!) |
| ProductionOrder → Contract | `parentContractId` | N:1 | SET NULL | ПРОИЗВОДСТВО §7 |
| ProductionOrder → Organization | `customerId/contractorId` | N:1 | RESTRICT | ПРОИЗВОДСТВО §7 |
| ProductionTask → ProductionOrder | `productionOrderId` | 1:N | CASCADE | child FK |
| ProductionTask → Product | `productId` | N:1 | RESTRICT | ПРОИЗВОДСТВО §7 |
| ProductionTask → Workshop | `workshopId` | N:1 | SET NULL | при удалении цеха |
| ProductionTask → User (ответственный) | `responsibleUserId` | N:1 | SET NULL | при увольнении сотрудника |
| StockRecord → Warehouse | `warehouseId` | N:1 | RESTRICT | СКЛАД §7.2 |
| StockRecord → Product | `productId` | N:1 | RESTRICT | СКЛАД §6.5 |
| StockMovement → Warehouse | `warehouseId` | N:1 | RESTRICT | СКЛАД §7.3 |
| StockMovement → Product | `productId` | N:1 | RESTRICT | СКЛАД §7.3 |
| StockMovement → ProductionOrder | `sourceProductionOrderId` | N:1 | SET NULL | при удалении ЗК (audit log сохраняется) |
| StockMovement → Proposal | `sourceProposalId` | N:1 | SET NULL | при удалении КП |
| StockMovement → SupplierDelivery | `sourceSupplierDeliveryId` | N:1 | SET NULL | при удалении СД |
| StockMovement → Warehouse (transfer) | `transferFromWarehouseId` | N:1 | SET NULL | при удалении склада |
| Reservation → Proposal | `proposalId` | 1:N | **CASCADE** | при удалении КП резерв снимается |
| Reservation → Product | `productId` | N:1 | RESTRICT | СКЛАД §5.2 |
| PurchaseRequest → Product | `productId` | N:1 | RESTRICT | СКЛАД §7.4 |
| Order → Proposal | `proposalId` | N:1 | RESTRICT | ФИНАНСЫ §10 |
| Order → Contract | `contractId` | N:1 | RESTRICT | ФИНАНСЫ §10 |
| Order → Organization | `customerId/contractorId` | N:1 | RESTRICT | ФИНАНСЫ §10 |
| Invoice → Order | `orderId` | 1:N | **CASCADE** | при удалении Order — все Invoice тоже |
| Payment → Order | `orderId` | N:1 | RESTRICT | при удалении Order нужно сначала отсторнировать все платежи |
| Payment → Invoice | `invoiceId` | N:1 | SET NULL | платёж может быть «в кучу», без привязки |
| Refund → Payment | `paymentId` | N:1 | RESTRICT | каскад на Refund: НЕТ — нужно явно знать о возвратах |
| Refund → User | `createdById` | N:1 | RESTRICT | кто создал |
| Comment → User | `authorId` | N:1 | RESTRICT | автор комментария |
| Comment → PackageTag | `packageTag` | (string) | — | идентификатор сделки (СПОР-10) |
| OrganizationSigner → Organization | `organizationId` | 1:N | CASCADE | child FK |
| OrganizationContact → Organization | `organizationId` | 1:N | CASCADE | child FK |
| DocumentTemplate → User | `createdById` | N:1 | RESTRICT | КП-ДОК §5 |
| Workshop → (none) | — | — | — | справочник |
| Warehouse → (none) | — | — | — | справочник |
| **SupplierDelivery → Organization** | `supplierId` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §5 (isSupplier=true) |
| **SupplierDelivery → Warehouse** | `warehouseId` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §5 |
| **SupplierDelivery → PurchaseOrder** | `supplierPurchaseOrderId` | N:1 | SET NULL | можно принять без ЗП |
| **SupplierDelivery → Contract** | `parentContractId` | N:1 | SET NULL | для тендеров |
| SupplierDeliveryItem → SupplierDelivery | `supplierDeliveryId` | 1:N | CASCADE | child FK |
| SupplierDeliveryItem → Product | `productId` | N:1 | RESTRICT | |
| **Shipment → Warehouse** | `warehouseId` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §6 |
| **Shipment → ProductionOrder** | `productionOrderId` | N:1 | SET NULL | опционально |
| **Shipment → Proposal** | `proposalId` | N:1 | SET NULL | для R1 (отгрузка со склада по КП) |
| **Shipment → Contract** | `contractId` | N:1 | SET NULL | отгрузка по Договору |
| **Shipment → Organization** | `customerId` | N:1 | RESTRICT | кто забирает |
| ShipmentItem → Shipment | `shipmentId` | 1:N | CASCADE | child FK |
| ShipmentItem → Product | `productId` | N:1 | RESTRICT | |
| WriteOffAct → Warehouse | `warehouseId` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §7 |
| WriteOffAct → User | `createdById` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §7 |
| WriteOffAct → User (approver) | `approvedById` | N:1 | SET NULL | уволенный, запись остаётся |
| WriteOffItem → WriteOffAct | `writeOffActId` | 1:N | CASCADE | child FK |
| WriteOffItem → Product | `productId` | N:1 | RESTRICT | |
| PurchaseOrder → Organization | `supplierId` (isSupplier) | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §8 |
| PurchaseOrder → Warehouse | `warehouseId` | N:1 | RESTRICT | СКЛАД-ПОДРОБНЫЙ §8 |
| PurchaseOrder → Contract | `parentContractId` | N:1 | SET NULL | тендер |
| PurchaseOrder → PurchaseRequest | `purchaseRequestId` | N:1 | SET NULL | оставили связь |
| PurchaseOrder → User | `createdById` | N:1 | RESTRICT | закупщик |
| PurchaseOrderItem → PurchaseOrder | `purchaseOrderId` | 1:N | CASCADE | child FK |
| PurchaseOrderItem → Product | `productId` | N:1 | RESTRICT | |

---

## 3. ENUM-ы (нужно формализовать из всех документов)

### 3.1 Proposal.status (КП) — 6 значений

```
enum ProposalStatus {
  DRAFT          // черновик
  SENT           // отправлено
  ACCEPTED       // принято
  REJECTED       // отклонено
  PAID           // оплачено
  CONVERTED      // конвертировано (финальный!)
}
```

### 3.2 Contract.status (Договор) — 6 значений

```
enum ContractStatus {
  DRAFT          // черновик (только что конвертирован из КП)
  SENT           // отправлен клиенту
  SIGNED         // подписан клиентом
  IN_PROGRESS    // в работе
  COMPLETED      // завершён
  ARCHIVED       // архив
  TERMINATED     // расторгнут (добавлено 24.06.2026 — для явного закрытия контракта при отказе после оплаты)
}
```

### 3.3 ProductionOrder.status (ЗК) — 8 значений

```
enum ProductionOrderStatus {
  CREATED              // только что создан (триггер Оплачено)
  PLANNING             // начальник думает
  AWAITING_MATERIALS   // материалов не хватает
  IN_PROGRESS          // в работе
  PARTIAL              // часть готова (>= 50%)
  COMPLETED            // всё готово
  CANCELLED            // отменён
  ARCHIVED             // архив
}
```

### 3.4 ProductionTask.status — 6 значений

```
enum ProductionTaskStatus {
  CREATED
  PLANNED
  IN_WORK
  PARTIAL
  DONE
  CANCELLED
}
```

### 3.5 StockMovement.type — 4 значения + reason — 7 значений

```
enum StockMovementType {
  IN
  OUT
  TRANSFER
  WRITE_OFF
}

enum StockMovementReason {
  PRODUCTION         // от производства
  PURCHASE           // от поставщика
  SALE               // клиенту
  SALE_RETURN        // возврат от клиента (v2)
  CLIENT_ORDER       // по прямому КП без ЗК (R1)
  WRITE_OFF          // списание
  MANUAL             // ручная корректировка
}
```

### 3.6 SupplierDelivery.status — 6 значений

```
enum SupplierDeliveryStatus {
  PLANNED
  IN_TRANSIT
  RECEIVED
  PARTIALLY_RECEIVED
  COMPLETED
  CANCELLED
}
```

### 3.7 Shipment.status — 6 значений

```
enum ShipmentStatus {
  PLANNED
  PACKED
  SHIPPED
  DELIVERED
  PARTIAL
  CANCELLED
}
```

### 3.8 WriteOffAct.reason — 6 значений + status — 5

```
enum WriteOffReason {
  DEFECT
  EXPIRY
  LOSS
  DAMAGE
  INVENTORY_SHORTAGE
  INVENTORY_SURPLUS
  OTHER
}

enum WriteOffActStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  COMPLETED
  CANCELLED
}
```

### 3.9 PurchaseOrder.status — 8 значений

```
enum PurchaseOrderStatus {
  DRAFT
  SENT
  CONFIRMED
  IN_TRANSIT
  RECEIVED
  PARTIALLY_RECEIVED
  CANCELLED
  CLOSED
}
```

### 3.10 PurchaseRequest.status — 4 значения + reason — 2

```
enum PurchaseRequestStatus {
  PENDING
  PROCESSED
  CLOSED
  CANCELLED
}

enum PurchaseRequestReason {
  LOW_STOCK
  MANUAL_REQUEST
}
```

### 3.11 Order.status (Финансы) — 4 значения (нужно расширить для «Расторгнут»)

```
enum OrderStatus {
  DRAFT             // черновик (создан, но Договор ещё не подписан)
  IN_PROGRESS       // в работе (Договор подписан)
  AWAITING_PAYMENT  // ожидает оплаты (все позиции отгружены)
  CLOSED            // всё оплачено, заказ уходит в архив
  CANCELLED         // отменён (ЗК отменён + Refund на всю или частичную сумму; добавлено 24.06.2026 — правка #3 из МАСТЕР-АУДИТ-V6.md)
}
```

### 3.12 Invoice.status — 5 значений + invoiceType — 3

```
enum InvoiceStatus {
  DRAFT
  ISSUED
  PARTIALLY_PAID
  FULLY_PAID
  OVERDUE
}

enum InvoiceType {
  ADVANCE
  MAIN
  CORRECTIVE
}
```

### 3.13 Payment.method — 3 значения

```
enum PaymentMethod {
  BANK_TRANSFER
  CASH
  CARD
}
```

### 3.13a Payment.type — 2 значения (добавлено 24.06.2026, правка #3 из МАСТЕР-АУДИТ-V6.md)

```
enum PaymentType {
  INCOMING  // обычное поступление от клиента, amount > 0 (default)
  STORNO    // компенсирующий корректирующий платёж при ошибочном INCOMING, amount < 0
}
```

> **Важно:** `STORNO` — это техническая корректировка опечатки бухгалтера. Деньги физически не двигались. Реальный возврат денег клиенту при отменённом ЗК / возврате товара — это **отдельная сущность `Refund`** (таблица #32) с `amount > 0`, вычитаемая математически из `Order.paidAmount`. Не путать с STORNO.

### 3.14 User.role — 6 значений (финальный набор v6)

```
enum UserRole {
  ADMIN          // полный доступ
  DIRECTOR       // управление, видит себестоимость, approves
  ACCOUNTANT     // видит себестоимость (read-only), регистрирует платежи, approves WriteOff <5000
  MANAGER        // работает с КП, НЕ видит себестоимость
  PRODUCTION     // начальник производства
  PRODUCTION_MASTER  // мастер цеха (подвид, ФИНАЛЬНОЕ РЕШЕНИЕ ОТЛОЖЕНО)
  STOREKEEPER    // кладовщик
  VIEWER         // read-only
}
```

> **Примечание:** В разных МОДУЛЬ-документах `production-master` фигурирует как отдельная роль, но в archive/ её нет. Продакт-оунер должен выбрать: либо отдельная роль, либо подвид `production` с дополнительными разрешениями.

### 3.15 Organization.roles — multi-role

```
enum OrganizationRole {
  CONTRACTOR    // мы (юрлица наша)
  CUSTOMER      // клиент
  SUPPLIER      // поставщик
}
```

> Роли multi — `Organization` может быть одновременно нашим юрлицом И поставщиком (для взаимозачётов). **СПОР-9** добавил `isActive Boolean` на Organization.

### 3.16 Product.kind — 3 значения (GAP-001 закрывает!)

```
enum ProductKind {
  ITEM          // штучный товар (кольцо баскетбольное)
  SERVICE       // услуга (монтаж)
  WORK          // работа (разработка чертежа)
}
```

> В отличие от `productType (purchased|manufactured)` — это **физическая** классификация, а не бизнес-процессная.

### 3.17 Product.productType — 2 значения

```
enum ProductType {
  PURCHASED         // покупаем у поставщика
  MANUFACTURED      // производим сами
}
```

---

## 4. СЧЁТЧИКИ (Counter-table)

### 4.1 Counter — таблица

| Поле | Тип | Комментарий |
|---|---|---|
| `id` | String (PK) | уникальный ключ типа: `"proposal"`, `"contract"`, `"production"`, `"order"`, `"invoice"`, `"payment"`, `"supplier_delivery"`, `"shipment"`, `"write_off"`, `"purchase_order"`, `"comment"`, ... |
| `year` | Int (nullable) | null = единый счётчик по всей истории; year = счётчик на год |
| `value` | BigInt | текущее значение счётчика |

### 4.2 Safe-increment через транзакцию

Prisma-код (псевдо):

```ts
async function nextNumber(type: CounterType, year?: number): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const counter = await tx.$queryRaw`
      SELECT * FROM "Counter"
      WHERE id = ${type} AND year IS NOT DISTINCT FROM ${year}
      FOR UPDATE
    `;
    const next = (counter.value || 0) + 1;
    await tx.$executeRaw`
      UPDATE "Counter" SET value = ${next}
      WHERE id = ${type} AND year IS NOT DISTINCT FROM ${year}
    `;
    return formatNumber(type, next, year);
  });
}
```

**Гарантии:**
- `SELECT FOR UPDATE` блокирует все параллельные транзакции на этом row.
- В PostgreSQL serializable isolation level — две одновременные транзакции НЕ получат одинаковый number.
- Код форматирования: `КП-${String(value).padStart(4, '0')}` → `КП-0001`.

> **Важно:** Это критично для Phase 1 Bootstrap. Без safe-increment возможны дубликаты номеров при multi-pod.

---

## 5. РЕЗЕРВ-КОНТРАКТ (availableQty = quantity − reservedQuantity)

### 5.1 Формула

В каждой `StockRecord`:

```
availableQty = quantity − reservedQuantity
```

Где `reservedQuantity = SUM(Reservation.quantity WHERE productId = X AND proposalId IN (active KPs))`.

### 5.2 Правила обновления

| Ситуация | Что меняется |
|---|---|
| КП становится «отправлено» | `Reservation.qty` += позиции из КП |
| КП становится «отклонено» или «архив» | `Reservation.qty` −= (резерв снимается) |
| Кладовщик отгружает (Shipment.shipped) | `StockRecord.quantity` −= `ShipmentItem.quantityActual` |
| Кладовщик принимает (SupplierDelivery.completed) | `StockRecord.quantity` += `SupplierDeliveryItem.quantityReceived` |
| Кладовщик списывает (WriteOffAct.completed) | `StockRecord.quantity` −= `WriteOffItem.quantity` |

### 5.3 Защитные правила

1. `quantity >= 0` всегда — нельзя физически уйти в минус.
2. `availableQty >= 0` — резерв не может превышать `quantity`.
3. **Перед Shipment:** проверка `quantityPlanned <= availableQty`. Если больше — **WARN** + ручное подтверждение менеджера (не блокировка в v1, см. Q4 в `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §13).

---

## 6. СОГЛАСОВАННАЯ ЦЕПОЧКА ИНВАРИАНТОВ

### 6.1 Инварианты уровня БД (NOT NULL / UNIQUE / check)

- `Proposal.number`: UNIQUE
- `Contract.number`: UNIQUE
- `Contract.parentProposalId`: NOT NULL (Договор всегда от КП)
- `ProductionOrder.parentProposalId`: NOT NULL + **RESTRICT** (НЕЛЬЗЯ удалить КП с активным ЗК)
- `ProductionTask.productId`: NULL если тип INSTALLATION/SERVICE/WORK
- `StockRecord(warehouseId, productId)`: UNIQUE (одна запись на пару)
- `ProposalItem.quantity > 0`, `quantity <= 1000000` (sanity check)
- `ContractItem.priceWithoutVat >= 0` (NULL допустимо для рамочного)
- `Invoice.balance >= 0`
- `Payment.amount > 0` для `type='INCOMING'`. `Payment.amount < 0` для `type='STORNO'` (компенсирующий). Корректирующие STORNO образуют с INCOMING нулевую пару: `Σ |INCOMING.amount| = Σ |STORNO.amount|` в пределах одного `correctsPaymentId`.
- `Refund.amount > 0` (всегда положительная сумма возврата; вычитается математически из `Order.paidAmount`, НЕ является отрицательным платежом).
- `Refund.amount > 0` всегда (положительная; вычитается программно)
- `Refund.originalPaymentId`: NOT NULL
- `Order.balance >= 0`
- `Comment.authorId`: NOT NULL
- Все `*Item.quantity*` поля: Decimal `>= 0`

### 6.2 Инварианты уровня приложения (бизнес-правила)

- **Статус КП «оплачено»** → блокирует «конвертировать в договор» (правка B, КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО в v1).
- **КП «конвертировано»** — финальный (СПОР-11), правки только через новую версию.
- **ЗК «завершён»** → авто-создаётся `StockMovement: type='IN', reason='PRODUCTION'` только для товаров (`Product.kind='ITEM'`), не для услуг/работ.
- **Shipment.status='SHIPPED'** → авто-создаётся `StockMovement: type='OUT', reason='SALE'`.
- **Payment.amount > 0** для `type='INCOMING'`. **Payment.amount < 0** для `type='STORNO'` (корректировка опечатки). Sum (Payment.amount по orderId) = net payment для Order.
- **Σ Refund.amount ≤ originalPayment.amount** по каждому `originalPaymentId` (полный или частичный возврат). Refund = отдельная сущность, сумма **строго > 0**, вычитается математически: `Order.paidAmount = Σ INCOMING.amount - Σ STORNO.amount - Σ Refund.amount`.
- **Order закрывается** только когда все его Invoice полностью оплачены И нет незавершённых Refund.
- **Contract.status = 'SIGNED'** → триггер СПОР-5 создаёт Order (status='DRAFT' → авто-'IN_PROGRESS'). Один Contract = один Order (FK NOT NULL, RESTRICT).

---

## 7. МИГРАЦИОННЫЙ ПЛАН (для разработчика)

### 7.1 Какие таблицы создаются в Phase 1 Bootstrap

| Пакет | Сколько таблиц | Источник |
|---|---|---|
| Справочники | 5 (User, Organization, OrganizationSigner, OrganizationContact, Product) | `archive/ANALYSIS-KP-priority.md` + GAP-005 + GAP-001 |
| Templates | 1 (DocumentTemplate + блоки JSON) | GAP-004 |
| Proposals | 2 (Proposal, ProposalItem) | КП-ДОК |
| Contracts | 2 (Contract, ContractItem) | ДОГОВОР §7 |
| Production | 4 (Workshop, ProductionOrder, ProductionTask, Counter) | ПРОИЗВОДСТВО §7 + СПОР-13 |
| Warehouse | 11 (Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest, SupplierDelivery, SupplierDeliveryItem, Shipment, ShipmentItem, WriteOffAct, WriteOffItem, PurchaseOrder, PurchaseOrderItem) | СКЛАД-ПОДРОБНЫЙ + GAP-008 |
| Finance | 4 (Order, Invoice, Payment, Refund) | ФИНАНСЫ §10 + GAP-023 |
| Comments | 1 (Comment) | правка F + GAP-007 |
| **ИТОГО** | **30 таблиц + Counter** | |

### 7.2 Что применяется поверх baseline v5

Перед началом разработчик должен:
1. Скопировать baseline из `kppdf-5.0`.
2. Применить правки A-G (модель данных).
3. Удалить несовместимые старые таблицы (если есть).
4. Применить миграции (Prisma version последовательно).
5. Прогнать тесты — должны пройти 88 baseline + новые тесты на новые модели.

---

## 8. СВЯЗЬ С ДРУГИМИ ДОКУМЕНТАМИ

- `OPEN-QUESTIONS-MASTER.md` — открытые Q по этим таблицам
- `TOOLS-FOR-THEORY-TESTING.md` — как автоматически проверять эту схему
- `USER-JOURNEYS.md` — реальные сценарии, использующие эту схему
- `МАСТЕР-АУДИТ-V6.md` — главный отчёт аудита
- `МОДУЛЬ-*.md` (15 файлов) — исходные документы для этой схемы
