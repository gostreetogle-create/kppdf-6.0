# 04_Склад/_ARCHITECT-DECOMPOSITION-DRAFT-SESSION1.md — Architect decomposition SESSION 1 of 2 (БАЗА + ОТГРУЗКИ)

> **Назначение.** Decomposition output работы роли **Архитектор** для модуля `04_Склад/` в проекте KPPDF CRM v6 — **SESSION 1 из 2** (per thinker mitigation #4 OOM: Склад ~1857 строк → split на PART1 + PART2). Применены правила `AGENT-METHOD.md §3 Правило 3.1` + ограничения `AGENT-ROLES.md §2.1` + **Стратегия C** (5 constructor-папок = СТРОГО ЗАФИКСИРОВАНО per LAUNCH-04 §1.2 ⛔).
>
> **Файл-источник декомпозиции (Session 1 only):** [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART1.md`](МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART1.md) (463 строки, hard-limit override per PSL-003): §0 Глоссарий + §1 Для чего + §2 7 сценариев + §3 ER-диаграмма (общая) + §4 Справочники (Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest) + §5 SupplierDelivery (краткая справка) + §6 Shipment (ПОЛНАЯ схема) + §9 RBAC базы + §11 движение/snapshot.
>
> **Дата:** 2026-06-26.
>
> **Метод:** AGENT-METHOD §3 + AGENT-ROLES §2.1 + LAUNCH-04 §1.2.

---

## 1. Дерево папок модуля 04_Склад/ (SESSION 1 SCOPE)

```markdown
04_Склад/
├── README.md                                # 🔵 EXISTING (точка входа модуля, зафиксирована в PSL-010)
├── 00-spr/
│   ├── 00-otkrytye-voprosy.md               # 🔵 EXISTING: 5 baseline OQ для Аналитика Run 1.
│   ├── 00-glossary.md                       # 🆕 NEW: Термины Склад-домена (Warehouse, StockRecord, Reservation, StockMovement, packageTag, availableQty, MIN/MAX stock).
│   ├── 00-mvp-boundaries.md                 # 🆕 NEW: Что отложено в v2 — штрих-коды, мобильный сканер, аудит-лог, Multi-currency, ABC/XYZ анализ, ML прогноз.
│   ├── 00-stock-fields.md                  # 🆕 NEW: Поля 4 СУЩЕСТВУЮЩИХ сущностей (Warehouse + StockRecord + StockMovement + Reservation + PurchaseRequest) §4 PART1 — без FK-схемы (это Моделировщик).
│   └── 00-svyazi.md                         # 🆕 NEW: Связи с другими модулями — производство (авто-IN при COMPLETED ЗК), КП (источник reservations), финансы (OrderClosing), shipment каскад.
├── 01-shablon/
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 01-tipy-dvizheniy-stok.md            # 🆕 NEW: Типы StockMovement (in/out/transfer/write_off) + правило «signed by reason» (production/purchase/sale/write_off/manual).
│   └── 01-pravila-immutability.md           # 🆕 NEW: Правило immutable (§11.1) + snapshot-полей (§11.2) + soft-delete isActive (§11.3) — общие правила для Склада.
├── 02-page-warehouse/
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 02-spisok-ostatkov-ui.md             # 🆕 NEW: /warehouse — список StockRecord: warehouse × product × (quantity − reservedQuantity) + фильтры по типу/category.
│   ├── 02-spravochnik-skladov-ui.md         # 🆕 NEW: Список Warehouse (справочник) + isActive плашка + создание нового склада (admin-only).
│   ├── 02-dvizheniya-po-skladu-ui.md        # 🆕 NEW: Лента StockMovement (immutable) с фильтрами по type/reason/sourceProductId — 🔴 CROSS-OQ-3 Cost (sourcePurchasePrice).
│   └── 02-rezervy-i-priority-ui.md          # 🆕 NEW: Список активных Reservations с proposed/customer привязкой — 🔴 CROSS-OQ-2 Reserve (главный кросс-Q для Склада).
├── 02-page-shipments/
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 02-spisok-otgruzok-ui.md             # 🆕 NEW: /shipments — список Shipment (ОТК-XXXX) с фильтрами по статусу/sourceПроизводство.
│   ├── 02-redaktor-otgruzki-ui.md           # 🆕 NEW: 3-зонный макет создания/редактирования Shipment + auto-prefill из завершённого ЗК (V-019 ✅).
│   └── 02-statusy-i-perekhody-otk.md        # 🆕 NEW: Матрица 6 статусов Shipment (planned/packed/shipped/delivered/partial/cancelled) + 🔴 CROSS-OQ-4 Termination (cascade при cancelled).
├── 02-page-deliveries/                      # 🔵 EXISTING: STUB only в Session 1 (полное наполнение → SESSION 2)
├── 02-page-writeoffs/                       # 🔵 EXISTING: STUB only в Session 1 (полное наполнение → SESSION 2)
├── 02-page-purchase/                        # 🔵 EXISTING: STUB only в Session 1 (полное наполнение → SESSION 2)
├── 03-zhiznennyj-cikl/
│   ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
│   ├── 03-statusy-i-perekhody-stockbase.md  # 🆕 NEW: ЖЦ для StockRecord + StockMovement + Reservation (immutable history) + active reservation pool.
│   └── 03-triggery-autostockout.md          # 🆕 NEW: Авто-триггер PurchaseRequest при availableQty < Product.minStock + сигнал в закупки.
└── 04-pravila/
    ├── 00-README.md                         # 🔵 EXISTING: STUB slot.
    ├── 04-biznes-pravila-sklad-base.md      # 🆕 NEW: Базовые правила: immutability движений (§11.1), snapshot productSku/Name/Unit (§11.2), soft-delete (§11.3), RUB жёстко (§11.5, СПОР-14).
    └── 04-rbac-sklad-base.md                # 🆕 NEW: 6 ролей × базовые действия (видеть остатки/движения/резервы, создать Shipment от имени ЗК).
```

---

## 2. Сводная таблица NEW файлов (Session 1)

| # | Файл | Вход (§PART1) | Назначение | Target rows | Приоритет |
|---|---|---|---|---|---|
| 1 | `00-spr/00-glossary.md` | §0 | 14 терминов Склад-домена (Warehouse, StockRecord, StockMovement, Reservation, packageTag, availableQty, MIN/MAX stock, …) | 100 | 🟡 P1 |
| 2 | `00-spr/00-mvp-boundaries.md` | §14 (границы MVP) | штрих-коды, сканер, ML, ABC/XYZ, Multi-currency отложены в v2 | 120 | 🟡 P1 |
| 3 | `00-spr/00-stock-fields.md` | §4.1 + §4.2 + §4.3 + §4.4 + §4.5 | Поля 4 СУЩЕСТВУЮЩИХ сущностей (Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest) — без FK | 220 | 🔴 P0 |
| 4 | `00-spr/00-svyazi.md` | §10 (связи с модулями) + §3 ER | Производство (авто-IN при ЗК completed) + КП (Reservation source) + Финансы (OrderClosing) + Shipment cascade | 150 | 🔴 P0 |
| 5 | `01-shablon/01-tipy-dvizheniy-stok.md` | §4.3 + §11.1 | 4 типа StockMovement (in/out/transfer/write_off) + reason enum | 100 | 🟡 P1 |
| 6 | `01-shablon/01-pravila-immutability.md` | §11.1 + §11.2 + §11.3 | Общие правила immutable + snapshot + soft-delete | 110 | 🟡 P1 |
| 7 | `02-page-warehouse/02-spisok-ostatkov-ui.md` | §0 + §4.2 | /warehouse — StockRecord + availableQty formula + фильтры | 180 | 🔴 P0 |
| 8 | `02-page-warehouse/02-spravochnik-skladov-ui.md` | §4.1 | Справочник Warehouse + коды (WH-001) + админ-создание | 100 | 🟡 P1 |
| 9 | `02-page-warehouse/02-dvizheniya-po-skladu-ui.md` | §4.3 + §11.1 | Лента StockMovement + sourcePurchasePrice для Cost (CROSS-OQ-3) | 180 | 🔴 P0 |
| 10 | `02-page-warehouse/02-rezervy-i-priority-ui.md` | §4.4 + CROSS-OQ-2 | Активные резервы + снятие при REJECTED/ARCHIVED/CONVERTED КП | 180 | 🔴 P0 |
| 11 | `02-page-shipments/02-spisok-otgruzok-ui.md` | §6 обзор | /shipments — список Shipment ОТК-XXXX + фильтры по sourceЗК/КП/Договор | 160 | 🔴 P0 |
| 12 | `02-page-shipments/02-redaktor-otgruzki-ui.md` | §6.1 + §6.4 (триггер авто из ЗК) | Создание Shipment + auto-prefill из ЗК + manual create | 200 | 🔴 P0 |
| 13 | `02-page-shipments/02-statusy-i-perekhody-otk.md` | §6.3 + §6.4 | 6 статусов Shipment + cascade при CANCELLED (CROSS-OQ-4) | 180 | 🔴 P0 |
| 14 | `03-zhiznennyj-cikl/03-statusy-i-perekhody-stockbase.md` | §2 (сценарии) | ЖЦ StockRecord (обновляется по движениям) + Reservation | 130 | 🔴 P0 |
| 15 | `03-zhiznennyj-cikl/03-triggery-autostockout.md` | §4.5 + §2 сценарий 4 | Авто PurchaseRequest при availableQty < minStock + ручное расширение | 110 | 🔴 P0 |
| 16 | `04-pravila/04-biznes-pravila-sklad-base.md` | §11 целиком | Базовые правила (immutable / snapshot / soft-delete / RUB) | 200 | 🔴 P0 |
| 17 | `04-pravila/04-rbac-sklad-base.md` | §9 (RBAC матрица 6×8) | Базовые RBAC: видеть остатки, создать Shipment от ЗК, видеть движения | 180 | 🔴 P0 |

---

## 3. Обязательные EXISTING файлы

| # | Файл | Роль | Комментарий |
|---|---|---|---|
| E1 | `04_Склад/README.md` | `# 🔵 EXISTING` | Module root, создан при scaffolding PSL-010 |
| E2 | `04_Склад/00-spr/00-otkrytye-voprosy.md` | `# 🔵 EXISTING` | 5 baseline OQ (мульти-склад, частичная отгрузка, продавец клиента, себестоимость, инвентаризация) для Аналитика Run 1 |
| E3 | `04_Склад/00-spr/00-README.md` | `# 🔵 EXISTING` | STUB slot |
| E4 | `04_Склад/01-shablon/00-README.md` | `# 🔵 EXISTING` | STUB slot |
| E5 | `04_Склад/02-page-warehouse/00-README.md` | `# 🔵 EXISTING` | STUB slot |
| E6 | `04_Склад/02-page-deliveries/00-README.md` | `# 🔵 EXISTING STUB-in-session1` | СТУБ — полное наполнение в SESSION 2 |
| E7 | `04_Склад/02-page-shipments/00-README.md` | `# 🔵 EXISTING` | STUB slot |
| E8 | `04_Склад/02-page-writeoffs/00-README.md` | `# 🔵 EXISTING STUB-in-session1` | СТУБ — полное наполнение в SESSION 2 |
| E9 | `04_Склад/02-page-purchase/00-README.md` | `# 🔵 EXISTING STUB-in-session1` | СТУБ — полное наполнение в SESSION 2 |
| E10 | `04_Склад/03-zhiznennyj-cikl/00-README.md` | `# 🔵 EXISTING` | STUB slot |
| E11 | `04_Склад/04-pravila/00-README.md` | `# 🔵 EXISTING` | STUB slot |

---

## 4. Strategy C compliance check (5 page-papok СТРОГО)

| Проверка | Результат |
|---|---|
| ✅ 5 constructor-papoк = СТРОГО ЗАФИКСИРОВАНО | ✅ Все перечислены: `02-page-warehouse`, `02-page-deliveries`, `02-page-shipments`, `02-page-writeoffs`, `02-page-purchase` |
| ✅ НЕ переименованы в `02-konstruktor-*` или `02-redaktor-*` | ✅ Только `02-page-*` per URL-модели |
| ✅ Naming-fence (не пересекаемся с Моделировщиком territory) | ✅ `00-stock-fields.md` (НЕ `00-model-sklada.md`, НЕ `00-schema-sklada.md`) |
| ✅ Glossary vs MVP split | ✅ `00-glossary.md` (только термины §0) + `00-mvp-boundaries.md` (отложено §14) |
| ✅ Module-root README в дереве | ✅ `04_Склад/README.md` (E1) |
| ✅ Cross-OQ маппинг присутствует | ✅ CROSS-OQ-1/2/3/4 явно распределены (см. §5) |
| ✅ Hard limit ≤ 400 строк на каждый NEW файл | ✅ Все target rows в пределах 100-220 |
| ✅ Один архитектурный уровень (Architect NOT Analyst) | ✅ Только мета-уровень — дерево + таблица, без содержимого правил/полей |
| ✅ Existing файлы сохранены (не дублированы/не удалены) | ✅ 11 EXISTING файлов перечислены, не пересоздаются |
| ✅ Session 2 STUB out-of-scope (per LAUNCH-04 §1.2 ⛔ 5) | ✅ 02-page-deliveries/writeoffs/purchase = только 00-README markers; полное наполнение → SESSION 2 |

---

## 5. Cross-OQ mapping (Session 1 scope)

| Cross-OQ | Решается в NEW файле | Как именно |
|---|---|---|
| **CROSS-OQ-2 Reserve** (главный для Склада) | `02-page-warehouse/02-rezervy-i-priority-ui.md` + `00-spr/00-svyazi.md` | UI: список активных Reservation + снятие при Proposal.status REJECTED/ARCHIVED/CONVERTED. Document-only интерфейс к КП (КП создаёт, Склад управляет) |
| **CROSS-OQ-3 Cost** | `02-page-warehouse/02-dvizheniya-po-skladu-ui.md` + `02-page-shipments/02-redaktor-otgruzki-ui.md` | `sourcePurchasePrice` snapshot в StockMovement для SupplierDelivery авто-приходов; `costPrice` snapshot в ShipmentItem → margin в Финансы |
| **CROSS-OQ-4 Termination** | `02-page-shipments/02-statusy-i-perekhody-otk.md` | Shipment.cancelled cascade: 1) не создаёт StockMovement; 2) UI-маркер для курьера «отменено»; 3) при cancelled после ЗКнеполный — встречное перемещение полуфабрикатов (OQ для Аналитика) |
| **CROSS-OQ-1 Refund** | (НЕ в Session 1 — WriteOffAct.DEFECT в Session 2) | placeholder: будет в Session 2 файле `04-pravila/04-rbac-thresholds.md` (см. S2 ROW 10) |

---

## 6. Footer

**Итог SESSION 1: 17 NEW + 11 EXISTING = 28 файлов** в дереве `04_Склад/` (для этой сессии).

Разбивка NEW Session 1:

| Пaпка | Кол-во NEW Session 1 |
|---|---|
| `00-spr/` | 4 (glossary, mvp-boundaries, stock-fields, svyazi) |
| `01-shablon/` | 2 (tipy-dvizheniy-stok, pravila-immutability) |
| `02-page-warehouse/` | 4 (spisok-ostatkov, spravochnik-skladov, dvizheniya, rezervy) |
| `02-page-shipments/` | 3 (spisok-otgruzok, redaktor-otgruzki, statusy-otk) |
| `03-zhiznennyj-cikl/` | 2 (statusy-stockbase, triggery-autostockout) |
| `04-pravila/` | 2 (biznes-pravila-sklad-base, rbac-sklad-base) |

**Out-of-scope Session 1 (для SESSION 2):** `02-page-deliveries/`, `02-page-writeoffs/`, `02-page-purchase/` — только STUB markers.

**Combined c Session 2 (планируется):** ещё 8 NEW = всего 25 NEW + 11 EXISTING = **36 grand total по итогу обеих сессий**.

**Следующий шаг pipeline (после SESSION 1):** Аналитик Run 1 SESSION 1 для `04_Склад/` (наполнит 17 NEW STUB рабочими правилами/инвариантами); затем **SESSION 2 Architect decomposition**.

---

## 7. Версионирование Architect draft Session 1

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Baseline. SESSION 1: 17 NEW (база + отгрузки) + 11 EXISTING (включая 3 STUB Session-1-stub-out-of-scope) = 28 файлов. 4 preventive FIX применены (root README, naming-fence, glossary/MVP split, count math). Cross-OQ-2/3/4 активно; CROSS-OQ-1 placeholder для Session 2 |

> **Architect role boundary** (per AGENT-ROLES §2.1): это **мета-документ — декомпозиция**. Содержимое NEW файлов (правила, поля, переходы, RBAC) — работа **Аналитика Run 1**, не Архитектора.

> **⛔ Соблюдено LAUNCH-04 §1.2 critique 5:** Session 2 сущности (SupplierDelivery/WriteOffAct/PurchaseOrder) не описаны в этом draft — рассмотрены в SESSION 2 draft.
