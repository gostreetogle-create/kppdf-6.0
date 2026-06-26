# 04_Склад/_ARCHITECT-DECOMPOSITION-DRAFT-SESSION2.md — Architect decomposition SESSION 2 of 2 (Приёмки + Списания + Закупки)

> **Назначение.** Decomposition output работы роли **Архитектор** для модуля `04_Склад/` — **SESSION 2 из 2** (надстройка над Session 1). Покрывает PART2 = §7-§8 + дополнения к 03 (ЖЦ) и 04 (RBAC). Per thinker mitigation #4 OOM split.
>
> **Файл-источник декомпозиции (Session 2):** [`04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART2.md`](МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART2.md) (357 строк): §7 WriteOffAct (АС-XXXX — полная схема с 5 статусами) + §8 PurchaseOrder (ЗП-XXXX — полная схема с 8 статусами) + §9 RBAC thresholds + §11.8 ЗК без товаров (GAP-009) + Глоссарий v6 + §13 8 закрытых Q + §14 границы MVP.
>
> **Также attached (per LAUNCH-04 §2.1):** `04_Склад/МОДУЛЬ-СКЛАД.md` обзорный (уже в Session 1 git) + предыдущий выход Session 1 (таблица 17 NEW в `04_Склад/`).
>
> **Дата:** 2026-06-26.
>
> **Метод:** AGENT-METHOD §3 + AGENT-ROLES §2.1 + LAUNCH-04 §2.2.

---

## 1. Scope SESSION 2 = ДОПОЛНЕНИЕ к Session 1 tree

```text
⛔ Per LAUNCH-04 §2.2 critique 1: СТРОГО ЗАПРЕЩЕНО дублировать ДЕРЕВО Session 1.
Только ДОПОЛНЕНИЕ недостающих файлов в 02-page-deliveries/writeoffs/purchase
+ дополнить 03-zhiznennyj-cikl/ (ЖЦ СД/АС/ЗП) и 04-pravila/ (approve rules).
```

**Что УЖЕ ЕСТЬ из Session 1 (НЕ дублируем):**
- 11 EXISTING файлов (включая 9 subdir 00-README + 1 module README + 1 OQ)
- 17 NEW файлов в 00-spr/01-shablon/02-page-warehouse/02-page-shipments/03-zhiznennyj-cikl/04-pravila

**Что добавляет THIS SESSION 2:** только новые файлы в 3 оставшихся page-папках + дополнения в 03 + 04.

---

## 2. Дерево Session 2 — НОВЫЕ файлы (только дельта)

```markdown
04_Склад/                                 # Session 1 cover — НЕ ДУБЛИРУЕМ
├── 02-page-deliveries/                   # 🆕 NEW в Session 2 (был STUB в Session 1)
│   ├── 00-README.md                      # 🔵 EXISTING (STUB in Session 1)
│   ├── 02-spisok-priemok-ui.md           # 🆕 NEW: /supplier-deliveries — список СД-XXXX с фильтрами по статусу/supplier/ЗП.
│   ├── 02-redaktor-priemki-ui.md         # 🆕 NEW: Форма приёмки с факт/план количеством + авто-расчёт расхождений + customReason для инвентаризации.
│   └── 02-statusy-sd-ui.md               # 🆕 NEW: 6 статусов СД (planned/in_transit/received/partially_received/completed/cancelled) + авто-IN при completed (V-019 ✅).
├── 02-page-writeoffs/                    # 🆕 NEW в Session 2 (был STUB в Session 1)
│   ├── 00-README.md                      # 🔵 EXISTING (STUB in Session 1)
│   ├── 02-spisok-act-spisania-ui.md      # 🆕 NEW: /write-off — список АС-XXXX с фильтрами по reason/warehouse/approve-status.
│   └── 02-dvuxstupenchatyi-approve-ui.md # 🆕 NEW: 2-step approve flow (draft → pending_approval → approved → completed) + 🔴 CROSS-OQ-1 Refund UI-маркер при reason='DEFECT'.
├── 02-page-purchase/                     # 🆕 NEW в Session 2 (был STUB в Session 1)
│   ├── 00-README.md                      # 🔵 EXISTING (STUB in Session 1)
│   ├── 02-spisok-zayavok-ui.md           # 🆕 NEW: /purchase — список ЗП-XXXX + pending PurchaseRequest (авто-сигнал при low_stock из Session 1).
│   ├── 02-redaktor-zayavki-ui.md         # 🆕 NEW: Форма создания ЗП с выбором поставщика + позициями + expectedDeliveryDate.
│   └── 02-statusy-zp-ui.md               # 🆕 NEW: 8 статусов ЗП (draft/sent/confirmed/in_transit/received/partially_received/cancelled/closed) + авто-синхронизация с СД.
├── 03-zhiznennyj-cikl/                   # ДОПОЛНЕНИЕ (Session 1 уже создал 2 файла здесь)
│   └── 03-zhiznennyj-cikl-sd-ac-zp.md    # 🆕 NEW: ЖЦ для SupplierDelivery (6 статусов) + WriteOffAct (5 статусов) + PurchaseOrder (8 статусов) — добавлено к базе Session 1.
└── 04-pravila/                           # ДОПОЛНЕНИЕ (Session 1 уже создал 2 файла здесь)
    └── 04-rbac-thresholds.md             # 🆕 NEW: Авто-маршрутизация approve по сумме WriteOffAct.totalAmount: < 5K₽=accountant; 5K-50K₽=director; ≥50K₽=director+журнал.
```

---

## 3. Сводная таблица NEW файлов (Session 2)

| # | Файл | Вход (§PART2) | Назначение | Target rows | Приоритет |
|---|---|---|---|---|---|
| 1 | `02-page-deliveries/02-spisok-priemok-ui.md` | §5.1 + §5.3 список | /supplier-deliveries список СД-XXXX с фильтрами (supplier/ЗП/expected date/частично получен) | 180 | 🔴 P0 |
| 2 | `02-page-deliveries/02-redaktor-priemki-ui.md` | §5.1-5.2 + §5.4 | Форма приёмки + факт/план + авто-расчёт расхождений + customReason для аномалий | 200 | 🔴 P0 |
| 3 | `02-page-deliveries/02-statusy-sd-ui.md` | §5.3 статусы + §5.4 триггеры | 6 статусов СД + авто-IN при completed | 180 | 🔴 P0 |
| 4 | `02-page-writeoffs/02-spisok-act-spisania-ui.md` | §7.1 + §7.3 | /write-off список АС-XXXX + фильтры reason/approve-status/warehouse | 160 | 🔴 P0 |
| 5 | `02-page-writeoffs/02-dvuxstupenchatyi-approve-ui.md` | §7.1 + §7.3 + §7.4 + CROSS-OQ-1 | 2-step approve flow + 🔴 CROSS-OQ-1 UI-маркер "Оформить Refund" при reason='DEFECT' | 220 | 🔴 P0 |
| 6 | `02-page-purchase/02-spisok-zayavok-ui.md` | §8.1 + §8.4 (авто-триггер из PurchaseRequest) | /purchase список ЗП + pending PurchaseRequest (link) | 180 | 🔴 P0 |
| 7 | `02-page-purchase/02-redaktor-zayavki-ui.md` | §8.1 + §8.2 | Форма создания ЗП с поставщиком + позициями + unitCost pre-fill | 200 | 🔴 P0 |
| 8 | `02-page-purchase/02-statusy-zp-ui.md` | §8.3 + §8.4 | 8 статусов ЗП + авто-синхронизация с СД | 180 | 🔴 P0 |
| 9 | `03-zhiznennyj-cikl/03-zhiznennyj-cikl-sd-ac-zp.md` | §5.3 + §7.3 + §8.3 | Сводный ЖЦ для 3 новых сущностей (СД + АС + ЗП) — добавлено к базе Session 1 | 180 | 🔴 P0 |
| 10 | `04-pravila/04-rbac-thresholds.md` | §7.4 (RBAC пороги 5K/50K) | Авто-маршрутизация approve write-off по сумме + регламент commission для inventory_shortage | 200 | 🔴 P0 |

---

## 4. EXISTING (для справки + continuity — не дублируются)

Из Session 1 — без изменений:
- `04_Склад/README.md` (E1)
- `04_Склад/00-spr/00-otkrytye-voprosy.md` (E2)
- `04_Склад/00-spr/00-README.md` (E3) + 01-shablon/00-README.md (E4) + 02-page-warehouse/00-README.md (E5) + 02-page-shipments/00-README.md (E7) + 03-zhiznennyj-cikl/00-README.md (E10) + 04-pravila/00-README.md (E11)
- `04_Склад/02-page-deliveries/00-README.md` (E6) — теперь заполняется в Session 2
- `04_Склад/02-page-writeoffs/00-README.md` (E8) — теперь заполняется в Session 2
- `04_Склад/02-page-purchase/00-README.md` (E9) — теперь заполняется в Session 2

**Stays 11 EXISTING = same as Session 1 (3 page-papoк STUB → теперь наполнены NEW в Session 2)**.

---

## 5. Strategy C compliance check (Session 2 only)

| Проверка | Результат |
|---|---|
| ✅ 5 constructor-papoк = те же СТРОГО (per LAUNCH-04 §2.2 critique 2) | ✅ НЕ добавлено новых; 3 page-papo к теперь наполнены |
| ✅ Hard limit ≤ 400 строк на каждый NEW файл | ✅ Все target rows 160-220 |
| ✅ Naming-fence (не пересекаемся с Моделировщиком) | ✅ 02-page-deliveries/-writeoffs/-purchase — это UI-папки, не модели |
| ✅ НЕ дублируем Session 1 (per LAUNCH-04 §2.2 critique 1) | ✅ Только дельта |
| ✅ Cross-OQ покрытие расширено (CROSS-OQ-1 теперь активен) | ✅ см. §6 |
| ✅ Single Architecture role (Architect NOT Analyst) | ✅ Только мета-уровень |

---

## 6. Cross-OQ mapping (Session 2 — закрывает то что Session 1 НЕ покрыл)

| Cross-OQ | Решается в NEW файле | Как именно |
|---|---|---|
| **🔴 CROSS-OQ-1 Refund** (ГЛАВНЫЙ для Session 2) | `02-page-writeoffs/02-dvuxstupenchatyi-approve-ui.md` + `04-pravila/04-rbac-thresholds.md` | При WriteOffAct.reason='defect' (или 'inventory_shortage' если от клиента возвращение) → UI-маркер «Оформить Refund» в карточке WriteOffAct. Approver-пороги в RBAC: <5K₽=accountant; 5K-50K₽=director; ≥50K₽=director+журнал |
| **CROSS-OQ-3 Cost** | `02-page-deliveries/02-redaktor-priemki-ui.md` + `02-page-purchase/02-redaktor-zayavki-ui.md` | `unitCost` snapshot в SupplierDeliveryItem + PurchaseOrderItem → авто-расчёт себестоимости `StockRecord.lastCost` при СД completed (V-019 ✅) |
| **CROSS-OQ-4 Termination** | `02-page-writeoffs/02-spisok-act-spisania-ui.md` (cancel `cancelled`) + `02-page-purchase/02-statusy-zp-ui.md` (ЗП `cancelled`) | WriteOffAct `cancelled` (до approve) НЕ создаёт StockMovement. ЗП `cancelled` инвалидирует связанный СД (если ещё не received) — взаимная блокировка |
| **CROSS-OQ-2 Reserve** (из Session 1) | (нет расширения — Session 1 уже покрыл полностью в `02-page-warehouse/02-rezervy-i-priority-ui.md`) | — |

---

## 7. Footer

**Итог SESSION 2: 10 NEW (только дельта) + 0 новых EXISTING** (11 EXISTING = same as Session 1).

**Combined итого по ОБЕИМ сессиям: 17 + 10 = 27 NEW + 11 EXISTING = 38 файлов** в дереве `04_Склад/` после завершения обоих сессий. (Это даже больше чем Договор/Производство по понятным причинам — Склад самый большой модуль проекта с 5 page-папками.)

**Следующий шаг pipeline (после SESSION 2):** Аналитик Run 1 SESSION 2 для `04_Склад/` (наполнит 10 NEW STUB рабочими правилами/инвариантами); QA-валидатор по Правилу 3.1.

---

## 8. Версионирование Architect draft Session 2

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Baseline. SESSION 2 delta to Session 1: 10 NEW (deliveries/writeoffs/purchase + 03 доп + 04 доп). Combined total: 27 NEW + 11 EXISTING = 38 файлов. 4 preventive FIX применены. Cross-OQ-1 теперь ГЛАВНЫЙ (WriteOffAct.DEFECT → Refund signal) |

> **Architect role boundary** (per AGENT-ROLES §2.1): это **мета-документ — декомпозия-настройка**. Содержимое NEW файлов (правила, поля, переходы, RBAC) — работа **Аналитика Run 1**, не Архитектора.

> **⛔ Соблюдено LAUNCH-04 §2.2 critique 2:** 5 constructor-papoк СТРОГО из Session 1 — НЕ переименованы, НЕ добавлены новые, НЕ удвоены.

> **⛔ Соблюдено LAUNCH-04 §2.2 critique 1:** дерево Session 1 НЕ дублируется, только дельта.
