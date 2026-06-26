# 04_Склад/LAUNCH-ARCHITECT-04.md — Package для запуска Архитектора Склада (Phase 0; 2 СЕССИИ)

> **Назначение.** Готовый copy-paste пакет для запуска Архитектора модуля **Склад** в **двух последовательных Codebuff-сессиях** (per thinker risk mitigation #4 — Склад ~1857 строк в 3 файлах → OOM в одной сессии).
>
> **Окно №3** из 4 параллельных запусков. Самый большой модуль проекта. Подготовлен 2026-06-26 (PSL-010).

## 0. Почему 2 сессии (mitigation OOM)

`04_Склад/` содержит **3 исходных файла** общим объёмом **~1857 строк**:
- `МОДУЛЬ-СКЛАД.md` (~995 строк, обзорный каркас)
- `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` (~791 строка, схемы 4 сущностей + RBAC)
- `МОДУЛЬ-СКЛАД-UI.md` (~70 строк, UI 5 страниц)

Input LLM стерпит, но output (дерево из ~22 STUB + обоснования) может обрезаться на ~4000 токенов лимита. Поэтому split на 2 СЕССИИ.

## 1. SESSION 1: База + Отгрузки

### 1.1 attach (10 файлов)

| # | Путь | Зачем (Session 1) |
|---|---|---|
| 1-5 | (5 файлов как в Договор LAUNCH) | Инфраструктура + CROSS-MODULE-OQ |
| 6 | `04_Склад/МОДУЛЬ-СКЛАД.md` | Обзорный каркас (~995) |
| 7 | `04_Склад/00-spr/00-otkrytye-voprosy.md` | 5 baseline OQ |
| 8 | `04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART1.md` | Pre-cut в ЭТОЙ сессии (PSL-010): §1-§6 — Справочники + StockRecord + StockMovement + Reservation + Shipment |

> ⚠️ **Важно:** НЕ прикладывать целиком `МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md` целиком — split между Session 1 (§1-6) и Session 2 (§7-8).

| # | Путь | Зачем (Session 1) |
|---|---|---|
| 9 | `04_Склад/00-spr/00-README.md` | STUB |
| 10 | `04_Склад/02-page-warehouse/00-README.md` | STUB |
| 11 | `04_Склад/02-page-shipments/00-README.md` | STUB |
| 12 | `04_Склад/03-zhiznennyj-cikl/00-README.md` | STUB |
| 13 | `04_Склад/04-pravila/00-README.md` | STUB |

### 1.2 Промпт Session 1

```text
Ты — Архитектор модуля Склад (SESSION 1 из 2). Прочитай [FILES_ATTACHED].

SESSION 1 — СТРОГО ЭТА ЗОНА: декомпозировать БАЗУ + ОТГРУЗКИ.
  - 00-spr/ (справочники: глоссарий, статусы, RBAC сводка)
  - 02-page-warehouse/ (UI /warehouse: остатки + движения + резервы)
  - 02-page-shipments/ (UI /shipments: ОТК + авто-предложение из ЗК)
  - 03-zhiznennyj-cikl/ (ЖЦ StockRecord, StockMovement, Reservation, Shipment)
  - 04-pravila/ (ТОЛЬКО базовые правила: immutability, qty >= 0, reserved <= qty)

ЗА ПРЕДЕЛАМИ Session 1 (это будет Session 2):
  - 02-page-deliveries/ — оставить как STUB-маркер, без наполнения
  - 02-page-writeoffs/ — оставить как STUB
  - 02-page-purchase/ — оставить как STUB

Вход: МОДУЛЬ-СКЛАД.md целиком + МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md (ТОЛЬКО §1-§6).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ (СТРОГО)

1. СТРОГО ЗАПРЕЩЕНО писать содержимое .md файлов. Только ДЕРЕВО + имена.

2. **⛔ КОНСТРУКТОР-ПАПКИ = 5 штук СТРОГО ЗАФИКСИРОВАНО** per CROSS-MODULE-OQ
   Стратегия C (по URL, 5 страниц из МОДУЛЬ-СКЛАД.md §5):
     02-page-warehouse    (для /warehouse)
     02-page-deliveries   (для /supplier-deliveries)  ← STUB only Session 1
     02-page-shipments    (для /shipments)
     02-page-writeoffs    (для /write-off)           ← STUB only Session 1
     02-page-purchase     (для /purchase)             ← STUB only Session 1
   НЕ переименовывать в 02-konstruktor-* или 02-redaktor-* или иначе.

3. УЧИТЫВАЙ 5 baseline OQ из 00-otkrytye-voprosy.md + CROSS-OQ-2 (Reserve)
   + CROSS-OQ-3 (Cost).

4. Hard limit 400 строк.

5. НЕ генерируй ничего про 4 новые сущности (SupplierDelivery,
   WriteOffAct, PurchaseOrder) — это Session 2.

Выход: Markdown-дерево + список файлов с обоснованием (ТОЛЬКО база + отгрузки).
```

### 1.3 Post-Session-1

- Записать **PSL-010c** (Session 1 завершена) в PROJECT-STATE-LOG.md.
- Commit + push.

## 2. SESSION 2: Приёмки + Списания + Закупки

### 2.1 attach (8 файлов)

| # | Путь | Зачем (Session 2) |
|---|---|---|
| 1-5 | (5 как в Договор LAUNCH) | Инфраструктура + CROSS-MODULE-OQ |
| 6-7 | (МОДУЛЬ-СКЛАД.md не нужен — уже в Session 1, в git теперь есть выходной PSL-010c) | — |
| 8 | `04_Склад/МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ-PART2.md` | Pre-cut в ЭТОЙ сессии (PSL-010): §7-§8 — WriteOffAct + PurchaseOrder |
| 9 | МОДУЛЬ-СКЛАД-UI.md целиком (~70 строк) | UI 5 страниц |
| 10 | Лог предыдущей Session 1 (PSL-010c + положение существующих STUB) | Контекст непрерывности |

### 2.2 Промпт Session 2

```text
Ты — Архитектор модуля Склад (SESSION 2 из 2). Прочитай [FILES_ATTACHED]
+ предыдущий выход Session 1 (PSL-010c).

SESSION 2 — ЗОНА: дополнить дерево SESSION 1 тремя оставшимися
страницами:
  02-page-deliveries/ (СД-XXXX — приход: 6 статусов + StockMovement:IN)
  02-page-writeoffs/ (АС-XXXX — двухступенчатый approve flow)
  02-page-purchase/  (ЗП-XXXX — PurchaseRequest + PurchaseOrder)

Вход: МОДУЛЬ-СКЛАД-ПОДРОБНЫЙ.md §7-§8 + МОДУЛЬ-СКЛАД-UI.md
       + дерево предыдущей Session 1 (PSL-010c).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ

1. СТРОГО ЗАПРЕЩЕНО дублировать ДЕРЕВО Session 1. Только ДОПОЛНИТЬ
   недостающие файлы в 02-page-deliveries/, 02-page-writeoffs/, 02-page-purchase/
   + дополнить 03-zhiznennyj-cikl/ (ЖЦ СД/АС/ЗП) и 04-pravila/ (правила approve).

2. **⛔ КОНСТРУКТОР-ПАПКИ = те же 5 из Session 1** (СТРОГО).

3. **⛔ CROSS-OQ-1 (Refund при WriteOffAct.DEFECT)** обязательно:
   - В 04-pravila/ добавить правило «WriteOffAct.DEFECT → сигнал бухгалтеру для Refund».
   - В 02-page-writeoffs/flag маркер для UI «Оформить Refund».

4. **⛔ CROSS-OQ-3 (Cost)** обязательно: в 02-page-deliveries/. указать
   `sourcePurchasePrice` snapshot-поле.

5. Hard limit 400 строк.

Выход: только НОВЫЕ файлы Session 2 (дополнения к дереву Session 1).
```

### 2.3 Post-Session-2

- Записать **PSL-010d** (Session 2 завершена) в PROJECT-STATE-LOG.md.
- Commit + push.

## 3. CHECK-листы (для обеих сессий)

✅ **CHECK 1**: OOM не произошёл (output не обрезан).
✅ **CHECK 2**: Конструктор-папки = 5 шт СТРОГО (Стратегия C).
✅ **CHECK 3**: Все 5 baseline OQ + CROSS-OQ применены.
✅ **CHECK 4**: Hard limit ≤ 400 строк.
✅ **CHECK 5**: 02-page-deliveries/writeoffs/purchase = STUB в Session 1, наполнены в Session 2.

## 4. Связанные документы

- [`../01_КП/LAUNCH-ARCHITECT.md`](../01_КП/LAUNCH-ARCHITECT.md) — КП reference (1 сессия)
- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) — Q1, Q2, Q3, Q4 все критичны

## 5. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | PSL-010. **2-сессионный** mirror LAUNCH-ARCHITECT (mitigation #4 OOM). 5 page-* конструктор-папок (Стратегия C). |
