# 05-konstruktor-finansov/ — Точка входа подпапки конструктора финансов

> **Назначение.** Оглавление подпапки `05-konstruktor-finansov/` модуля Финансы — содержит файлы по конструктору счетов (Invoice), платежей (Payment) и рефандов (Refund). Источник: `МОДУЛЬ-ФИНАНСЫ.md` §4 «Ключевой сценарий» + §5 «Экраны (UI)».

> ⚠️ **STUB** (создан Архитектором 2026-06-27, ТЗ-009). Будет заполнен Бизнес-аналитиком в Run 5 Аналитика (ТЗ-010).

## Содержание

| Файл | Назначение |
|---|---|
| `05-scheta.md` | Конструктор счетов (Invoice): аванс / основной / корректировочный |
| `05-platezhi.md` | Конструктор платежей (Payment): INCOMING + STORNO + авто-привязка к Invoice |
| `05-refundy.md` | Конструктор рефандов (Refund): отдельная сущность per GAP-023 |

## Ключевые связи

- **Invoice → Order:** `Invoice.orderId → Order.id` (FK NOT NULL, ON DELETE CASCADE).
- **Payment → Invoice:** ручной выбор через dropdown (СПОР-7: в v1 без авто-FIFO).
- **Refund → Payment:** `Refund.originalPaymentId → Payment.id` (ON DELETE RESTRICT).
- **Refund ≠ Payment:** Refund — отдельная сущность (GAP-023 ✅ РЕШЕНО), НЕ отрицательный Payment.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-27 | STUB создан Архитектором (ТЗ-009). |
