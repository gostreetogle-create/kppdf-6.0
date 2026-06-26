# 05_Финансы/03-zhiznennyj-cikl/00-README.md — Жизненный цикл Order и Invoice

> **Назначение.** Статусы Order (5) + Invoice (5) + переходы + триггер СПОР-5 (SIGN Договора → авто-создание Order).

## 0. Контекст

ЖЦ сердце модуля: каскадные авто-действия при сменах статусов.

## 1. Ожидаемое содержимое

- [`03-statusy-svodka.md`](03-statusy-svodka.md) — таблица Order (5) + Invoice (5) + Payment (2)
- `03-perehody-order.md` — `DRAFT → IN_PROGRESS → AWAITING_PAYMENT → CLOSED / CANCELLED`
- `03-perehody-invoice.md` — `DRAFT → ISSUED → PARTIAL → FULLY_PAID / OVERDUE`
- `03-triggery.md` — при `Contract.SIGNED` → создаётся Order (СПОР-5); при ЗК `CANCELLED` + post-paid → Refund; при `balance=0` → Invoice FULLY_PAID (авто)

## 2. Связанные документы

- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) §4 (Termination)
- [`../МОДУЛЬ-ФИНАНСЫ.md`](../МОДУЛЬ-ФИНАНСЫ.md) §3 Жизненный цикл

## ⚠️ Статус STUB

Рабочий слот.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
