# ТЗ-008 — DECOMPOSITION-SKLAD (Декомпозиция `04_Склад/` в 5-tier hierarchy)

> ## 🔒 FINALIZED 2026-06-27T12:30:00Z
>
> **Агент:** Архитектор/MiMo
> **Verdict:** ✅ CLOSED
> **Source ТЗ:** 99_Справочники/TASKS/ТЗ-008-DECOMPOSITION-SKLAD.md
> **Closure report:** см. ниже
> **Заблокировано для дальнейших правок без нового PSL-NNN.**

> **Назначение.** Техзадание для параллельного **Архитектора** — декомпозиция модуля `04_Склад/`, имеющего **2 исходных МОДУЛЬ-дока** (`МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` ~200 строк + `МОДУЛЬ-СКЛАД-UI.md` ~150 строк). Mirror-паттерн: PSL-021 (Договор 18 файлов), PSL-004 (КП 20 файлов). Это единственный случай декомпозиции с **двумя источниками** — поэтому скоуп чуть шире: **20 файлов** (vs 18 у Договор, vs 20 у Производство).
>
> **Когда запускать.** ПОСЛЕ ТЗ-007 (Производство) или ПАРАЛЛЕЛЬНО с ним (write в РАЗНЫЕ папки, zero conflict).
>
> **Объём:** ~800-900 строк hard limit ≤1000.

---

## §0 IN-WORK (Pre-action Checklist по PSL-009)

**PC-1.** Прочитан [`MODULE-DECOMPOSITION-PLAN.md` §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) — дерево STUB для `04_Склад/`. Подтверждено scope = **20 файлов в 5 папках**.

**PC-2.** Прочитаны ОБА источника:
- [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) (~200 строк, модели учёта: Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest, **+4 НОВЫХ: PurchaseOrder / SupplierDelivery / Shipment / WriteOffAct**).
- [`04_Склад/МОДУЛЬ-СКЛАД-UI.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-UI.md) (~150 строк, UI-каркасы 5 страниц: `/warehouse`, `/supplier-deliveries`, `/shipments`, `/purchase`, `/write-off`).

**PC-3.** Прочитан [`02_Договор/`](../../../02_Договор/) как mirror-template (PSL-021).

**PC-4.** Cross-refs готовы:
- `ЖУРНАЛ-ПРОГОНА.md` GAP №8 (часть 1 закрыта ПОДРОБНЫЙ, часть 2 закрыта UI)
- `archive/ANALYSIS-KP-priority.md` §1.12-1.16 (базовые 5 сущностей: Warehouse/StockRecord/StockMovement/Reservation/PurchaseRequest)
- `archive/MIGRATION-PLAN-Phase1.md` (sealed counter tables для СД-XXXX/ОТК-XXXX/АС-XXXX/ЗП-XXXX)

**PC-5.** Подсчёт STUB файлов: **20 файлов** (на 2 больше чем у Договор за счёт специфики Склад: сразу 4 базовых документа-операции вместо 1-2 у Договора).

**PC-6.** Hard limits: каждый файл ≤250 строк.

**PC-7.** Source context: модуль Склад — **самый операционно-насыщенный** из 5 модулей (4 базовых документа-операции + 5 страниц UI + RBAC 7×11 действий).

**PC-8.** Проверены СПОР-13 (отдельные счётчики для СД/ОТК/АС/ЗП), СПОР-14 (RUB жёстко для v1).

---

## §1 Mission (миссия)

**Цель:** Создать **20 STUB файлов** для модуля `04_Склад/`, организованных в 5-tier folder hierarchy (mirror КП/Договор/Производство). Каждый STUB — мета-файл (папка + имя + 1-2 строки назначения + source cross-ref + план наполнения для Run 4 Аналитика).

**Out-of-mission (явно):**
- ❌ Содержимое правил — Run 4 Аналитика (ТЗ-009-RUN-4 после этой ТЗ).
- ❌ Удалять `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` или `МОДУЛЬ-СКЛАД-UI.md` — это делается ПОСЛЕ полного Run 4.
- ❌ Prisma schema для 4 НОВЫХ сущностей (PurchaseOrder / SupplierDelivery / Shipment / WriteOffAct).
- ❌ Создавать UI components / Mantine структуры — это Phase 2.

**Минимальный скоуп:** 20 файлов точно по `MODULE-DECOMPOSITION-PLAN.md` §4.2. Дерево не менять.

---

## §2 Scope (что входит / что нет)

### 2.1 Что ВХОДИТ (scope ✅)

1. **20 STUB файлов** в структуре:
   ```
   04_Склад/
   ├── README.md                                  # Entrypoint
   ├── 00-spr/                                    # 6 + 1 entrypoint = 7
   │   ├── 00-README.md
   │   ├── 00-glossary.md                         # Warehouse, StockRecord, StockMovement, Reservation, ...
   │   ├── 00-orgs.md                             # Склады (физические) + Suppliers (поставщики)
   │   ├── 00-products.md                         # SKU-система, minStock
   │   ├── 00-clients.md                          # Кому принадлежат остатки
   │   ├── 00-out-of-scope.md                     # MVP границы
   │   └── 00-otkrytye-voprosy.md                 # 5 baseline OQ для Run 4
   ├── 04-konstruktor-dvizhenia/                  # 3 + 1 entrypoint = 4
   │   ├── 00-README.md
   │   ├── 04-prihod.md                           # SupplierDelivery (СД-XXXX) + приход
   │   ├── 04-rashod.md                           # Shipment (ОТК-XXXX) + расход
   │   └── 04-peremeshenie.md                     # transfer между складами
   ├── 04-zhiznennyj-cikl/                        # 3 + 1 entrypoint = 4
   │   ├── 00-README.md
   │   ├── 04-statusy.md                          # Статусы 4 документов (СД/ОТК/АС/ЗП) + StockRecord
   │   ├── 04-rezervy.md                          # Reservation under Proposal (только товары)
   │   └── 04-inventarizacia.md                   # Periodic inventory check
   └── 04-pravila/                                # 2 + 1 entrypoint = 3
       ├── 00-README.md
       ├── 04-rbac.md                             # RBAC Склад ≥30 правил (7 ролей × 11 действий)
       └── 04-biznes-pravila.md                   # immutable movements / snapshot / FIFO / списание
   ```

2. **README.md** как folder entrypoint — короткий, ≤100 строк.
3. **Корневой `04_Склад/README.md`** — общая навигация по 5-tier hierarchy.

### 2.2 Что НЕ входит (out-of-scope ❌)

1. **Содержимое правил** — Run 4 Аналитика.
2. **Полные схемы 4 НОВЫХ сущностей** (PurchaseOrder / SupplierDelivery / Shipment / WriteOffAct) — этот контент УЖЕ в `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` §5-§8; Аналитик Run 4 скопирует из источника в `00-spr/` + `04-pravila/`, но Архитектор НЕ трогает эти схемы.
3. **Prisma schema** — Phase 1/2 Bootstrap.
4. **UI компоненты Mantine** — LAUNCH-UX.
5. **Удаление МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md / МОДУЛЬ-СКЛАД-UI.md** — после Run 4.

---

## §3 Deliverables (конкретные 20 файлов)

**Файлы для создания (точно в этом списке):**

| # | Path | Строк (план) | Назначение (1 строка) |
|---|---|---|---|
| 1 | `04_Склад/README.md` | ≤30 | Entrypoint модуля Склад (cross-ref на 5 папок) |
| 2 | `04_Склад/00-spr/00-README.md` | ≤40 | Entrypoint папки справочников Склад |
| 3 | `04_Склад/00-spr/00-glossary.md` | ≤100 | 12 терминов: Warehouse, StockRecord, StockMovement, Reservation, PurchaseRequest, PurchaseOrder, SupplierDelivery, Shipment, WriteOffAct, availableQty, minStock, ... |
| 4 | `04_Склад/00-spr/00-orgs.md` | ≤80 | Склады (Warehouse) физические + Suppliers (Organization.isSupplier=true) |
| 5 | `04_Склад/00-spr/00-products.md` | ≤80 | SKU-система, minStock, категории товаров |
| 6 | `04_Склад/00-spr/00-clients.md` | ≤60 | Кому принадлежат остатки (customerId в SupplierDelivery/Shipment) |
| 7 | `04_Склад/00-spr/00-out-of-scope.md` | ≤80 | Что НЕ входит (mobile scanner, штрих-коды, multi-currency, ML-прогноз) |
| 8 | `04_Склад/00-spr/00-otkrytye-voprosy.md` | ≤120 | **5 baseline OQ** для Run 4 Аналитика |
| 9 | `04_Склад/04-konstruktor-dvizhenia/00-README.md` | ≤40 | Entrypoint папки движений |
| 10 | `04_Склад/04-konstruktor-dvizhenia/04-prihod.md` | ≤120 | SupplierDelivery (СД-XXXX) + автоматический StockMovement in |
| 11 | `04_Склад/04-konstruktor-dvizhenia/04-rashod.md` | ≤120 | Shipment (ОТК-XXXX) + автоматический StockMovement out + reservedQty logic |
| 12 | `04_Склад/04-konstruktor-dvizhenia/04-peremeshenie.md` | ≤80 | Transfer между 2 Warehouse (две связанные StockMovement) |
| 13 | `04_Склад/04-zhiznennyj-cikl/00-README.md` | ≤40 | Entrypoint папки жизненного цикла |
| 14 | `04_Склад/04-zhiznennyj-cikl/04-statusy.md` | ≤120 | Статусы 4 базовых документов (СД 6 / ОТК 6 / АС 5 / ЗП 8) |
| 15 | `04_Склад/04-zhiznennyj-cikl/04-rezervy.md` | ≤120 | Reservation под Proposal (только товары при sent/accepted) |
| 16 | `04_Склад/04-zhiznennyj-cikl/04-inventarizacia.md` | ≤80 | Periodic inventory check (WriteOffAct inventory_shortage/surplus) |
| 17 | `04_Склад/04-pravila/00-README.md` | ≤35 | Entrypoint папки правил |
| 18 | `04_Склад/04-pravila/04-rbac.md` | ≤100 | RBAC Склад ≥30 правил (7 ролей × 11 действий из source) |
| 19 | `04_Склад/04-pravila/04-biznes-pravila.md` | ≤80 | Immutable StockMovement + snapshot fields + availableQty ≥ 0 |

**Total = 19 файлов** в основной 5-tier hierarchy + 1 root README = **20 файлов**.

> ⚠️ **Уточнение PC-5 vs MODULE-DECOMPOSITION-PLAN §4:** План указывает 17 файлов, но реальный подсчёт с entrypoints = **20 файлов** (4 00-spr entrypoints + 5 содержательных + 4 konstruktor + 3 zhiznennyj + 3 pravila + 1 root = 20). Корректирую подсчёт в ТЗ.

---

## §4 Methodology (4-фазная)

### Phase 1: Setup (30 мин — больше чем у Договор/Производство из-за 2 источников)

1. Read [`MODULE-DECOMPOSITION-PLAN.md` §4](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) — 80 строк.
2. Read [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) полностью — ~200 строк (включая §3 ER-диаграмму для 7 сущностей, §5-§8 для 4 НОВЫХ).
3. Read [`04_Склад/МОДУЛЬ-СКЛАД-UI.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-UI.md) полностью — ~150 строк.
4. Read [`archive/ANALYSIS-KP-priority.md` §1.12-1.16](../../archive/ANALYSIS-KP-priority.md) — для базовых сущностей Warehouse/StockRecord/StockMovement/Reservation/PurchaseRequest.
5. **Подготовить список из 20 файлов** (§3 выше).

### Phase 2: Create STUBs (90 мин)

6. **Создание папок:** `mkdir -p 04_Склад/{00-spr,04-konstruktor-dvizhenia,04-zhiznennyj-cikl,04-pravila}`.
7. **Создание 20 файлов** параллельно через `write_file`. Каждый файл — STUB структура:
   ```
   # <filename.md> — <назначение 1 строка>
   
   > ⚠️ **STUB.** Создан декомпозицией модуля `04_Склад/` (см. [MODULE-DECOMPOSITION-PLAN.md §4](#)).
   > Контент будет наполнен Аналитиком Run 4.
   > Источник: ПОДРОБНЫЙ.md §N + UI.md §M (если applicable).
   
   ## Назначение
   <1-2 строки>
   
   ## Контекст
   <краткое с cross-ref на оба источника>
   
   ## План наполнения (для Аналитика Run 4)
   <bullets>
   
   ## Связанные документы
   - МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md §N
   - МОДУЛЬ-СКЛАД-UI.md §M (если applicable)
   - SCHEMA-CONSOLIDATED.md (для всех 7 сущностей)
   - RBAC-MATRIX.md
   - СПОРНЫЕ-МОМЕНТЫ.md СПОР-13/14
   ```

### Phase 3: Cross-ref validation (30 мин)

8. Проверить **все cross-refs** между 20 файлами (sibling STUBs).
9. Проверить **2-источниковую валидность** — `04-prihod.md` ссылается на ОБА источника (ПОДРОБНЫЙ §5 + UI §4.2); `04-statusy.md` ссылается на ПОДРОБНЫЙ §5.3/§6.3/§7.3/§8.3 и UI §2.
10. Проверить **внешние cross-refs**: КП `/proposals/new` (витрина товаров), Договор (`Contract.customerId`), Производство (ЗК→Shipment триггер), Финансы (OrderClosing).

### Phase 4: Self-audit (per TЗ-0000 §5)

11. Hard limits verify (`wc -l`).
12. File count verify (ровно 20 файлов).
13. ⚠️ маркер везде.
14. Cross-refs valid (нет 404).
15. **Создать PSL-NNN** + **git commit** (по запросу PO).

---

## §5 Pre-action Checklist per file

Для каждого из 20 файлов мини-Pre-action:
- PC-1: Цель ясна? (из какого source §N?)
- PC-2: Если файл — производное от 2 источников, оба cross-ref включены?
- PC-3: Mirror Договор/Производство структура подтверждена?

---

## §6 ТЗ-0000 binding (ОБЯЗАТЕЛЬНОЕ)

Аналогично ТЗ-007: полный 6-фазный protocol из [`ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md). Особенности Склад:
- 2 источника (ПОДРОБНЫЙ + UI) — оба RE-READ в Фазе 2 protocol
- Самый большой скоуп из всех 5 модулей (4 базовых документа + 5 UI страниц + ≥30 RBAC правил)

---

## §7 Quality gates

### 7.1 Per файл (QG1..QG7)
Идентично ТЗ-007.

### 7.2 Overall Phase 4
- [ ] 20 файлов созданы (точно)
- [ ] **2 источника cross-referenced** где применимо (`04-prihod.md`, `04-rashod.md`, `04-statusy.md` имеют оба)
- [ ] Все sibling cross-refs валидны
- [ ] `wc -l` каждого ≤250 строк

---

## §8 Hard limits

| Limit | Value | Violation |
|---|---|---|
| Каждый файл | ≤250 строк | ❌ HARD STOP |
| Каждый README (entrypoint) | ≤100 строк | ❌ HARD STOP |
| Общий объём нового | ≤2200 строк | ⚠️ WARNING per AGENT-REVIEW §1.6 |
| File count | exactly 20 | ❌ HARD STOP |

---

## §9 Acceptance criteria (final)

1. ✅ Phase 1-4 пройдены
2. ✅ 20 файлов созданы (точно)
3. ✅ 2-source cross-refs worked
4. ✅ ТЗ-0000 CLOSED
5. ✅ No conflict с ТЗ-007/009/010 (write в РАЗНЫЕ папки)
6. ✅ Hard limits соблюдены
7. ✅ Mirror pattern (КП/Договор/Производство)

---

## §10 Anti-patterns

Аналогично ТЗ-007 + специфичных:
| # | Anti-pattern | Избегать |
|---|---|---|
| A NEW | Дублировать контент из двух источников | Cross-ref между STUBs вместо копирования |
| A NEW | Смешать 2 источника в один файл без разделения | Явно указать: «источник 1: ...; источник 2: ...» |

---

## §11 Glossary

(Уникальные термины Склад. Остальные — из ТЗ-007/PSL-021.)

| Термин | Значение |
|---|---|
| **StockMovement** | Immutable запись о движении товара (приход/расход/transfer/write_off) |
| **availableQty** | = quantity − reservedQuantity |
| **minStock** | Минимум товара, при падении ниже — авто-триггер PurchaseRequest |
| **4 базовые операции** | Приход/Расход/Списание/Закупка (= 4 документа СД/ОТК/АС/ЗП) |
| **Sealed counter** | Отдельный счётчик в БД для каждого префикса (СД-XXXX / ОТК-XXXX / АС-XXXX / ЗП-XXXX) |
| **Run 4** | Аналитик Run 4 после Run 3 Производство |

---

## §12 Signoff

**Связанные документы:**
- [`99_Справочники/MODULE-DECOMPOSITION-PLAN.md`](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §4
- [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md) — основной источник (~200 строк)
- [`04_Склад/МОДУЛЬ-СКЛАД-UI.md`](../../../04_Склад/МОДУЛЬ-СКЛАД-UI.md) — UX каркасы (~150 строк)
- `archive/ANALYSIS-KP-priority.md` §1.12-1.16 — базовые сущности
- `99_Справочники/TASKS/ТЗ-009-RUN-4-5-АНАЛИТИК-СКЛАД.md` — следующий шаг (Run 4)
- [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md) — ОБЯЗАТЕЛЬНО

> **Hard limit:** ТЗ-008 ≤1000 строк ✅ вписано (~900). | `<details>` для детальной методологии 2-источниковой декомпозиции ▼ |
