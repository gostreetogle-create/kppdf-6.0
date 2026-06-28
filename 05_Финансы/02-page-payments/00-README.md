# 05_Финансы/02-page-payments/00-README.md — UI регистрации платежей и Refund

> **Назначение.** Специализированная страница для бухгалтера: регистрация входящих Payment + оформление Refund + Сторно.

## 0. Контекст

В v1 — все платежи ручной ввод по выписке. Никакой интеграции с банк-клиентом.

## 1. Ожидаемое содержимое

- `02-registraciya-payment.md` — форма: дата получения, сумма, type=INCOMING (default), dropdown выбора Invoice (СПОР-7 ✅) или «без привязки к счёту»
- `02-oformlenie-refund.md` — форма: originalPaymentId (FK), linkedProductionOrderId/ShipmentId/WriteOffId (опц.), amount > 0, reason ≥ 3 симв (NOT NULL)
- `02-storno-flow.md` — Сторно: выбор исходного Payment → `type='STORNO'`, `amount < 0`, `correctsPaymentId`, `notes NOT NULL`
- [`02-saldo-perechet.md`](02-saldo-perechet.md) — авто-пересчёт `saldo = totalAmount - paidAmount` + перевод Order → `AWAITING_PAYMENT` / `CLOSED`

## 2. Связанные документы

- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §1 (Refund)
- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §6 правила Refund

## ⚠️ Статус STUB

Рабочий слот. **Стратегия C**: папка = URL/воркспейс.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
