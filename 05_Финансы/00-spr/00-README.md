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

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
