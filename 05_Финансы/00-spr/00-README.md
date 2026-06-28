<<<<<<< HEAD
# 00-spr/ — Точка входа подпапки справочников модуля «Финансы»

> **Назначение.** Оглавление подпапки `00-spr/` модуля Финансы — содержит перечень справочников (Глоссарий, Организации, Продукты, Клиенты, Out-of-Scope, Открытые вопросы), их назначение и порядок чтения.

> ⚠️ **STUB** (создан Архитектором 2026-06-27, ТЗ-009). Будет заполнен Бизнес-аналитиком в Run 5 Аналитика (ТЗ-010). Источник: МОДУЛЬ-ФИНАНСЫ.md §0 глоссарий + MODULE-DECOMPOSITION-PLAN.md §5.

## 0. Контекст

Это **фундамент** модуля — все остальные папки (05-konstruktor-finansov, 05-zhiznennyj-cikl, 05-pravila) ссылаются сюда за определениями сущностей и терминов. Содержание справочников должно быть синхронизировано с мастер-файлами в `99_Справочники/`.

## Порядок чтения

1. `00-glossary.md` — ключевые термины (Order, Invoice, Payment, Refund, OrderClosing, Balance, Себестоимость)
2. `00-orgs.md` — организации (банки, налоговые, контрагенты)
3. `00-products.md` — себестоимость (costOfGoodsSold из Склад)
4. `00-clients.md` — контрагенты (hard-link с КП/Договор)
5. `00-out-of-scope.md` — границы MVP
6. `00-otkrytye-voprosy.md` — 5 baseline OQ для Run 5
=======
# 05_Финансы/00-spr/00-README.md — Справочники модуля Финансы

> **Назначение.** Справочные материалы: типы Invoice (ADVANCE/MAIN/CORRECTIVE), типы Payment (INCOMING/STORNO), сущность Refund (отдельная от Payment).

## 0. Контекст

Фундамент модуля — самое критичное различие: Storno vs Refund (2 разные сущности).

## 1. Ожидаемое содержимое

- [`00-glossary.md`](00-glossary.md) — термины Order / Invoice / Payment / Refund
- [`00-otkrytye-voprosy.md`](00-otkrytye-voprosy.md) — ✅ 5 baseline OQ
- `00-payment-types.md` — Payment.type: `INCOMING` (amount > 0) / `STORNO` (amount < 0)
- `00-invoice-types.md` — InvoiceType: ADVANCE / MAIN / CORRECTIVE (V-Finance-Q1 ✅)
- `00-refund-vs-storno.md` — критичное разделение Refund (отдельная сущность, GAP-023 ✅) vs Storno (через Payment.type='STORNO')
- `00-rbac-summary.md` — 5 ролей (manager/accountant/director/admin/viewer) × действия

## 2. Связанные документы

- [`../../99_Справочники/GLOSSARY-MASTER.md`](../../99_Справочники/GLOSSARY-MASTER.md) §0 + §1.2
- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §1 (Refund)

## ⚠️ Статус STUB

Рабочий слот.
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb

## Версия

| Версия | Дата | Что |
|---|---|---|
<<<<<<< HEAD
| 0.1 | 2026-06-27 | STUB создан Архитектором (ТЗ-009). |
=======
| 0.1 | 2026-06-26 | STUB. PSL-010. |
>>>>>>> 75a9ca68d258c69e233ea565481b72ead3c4cedb
