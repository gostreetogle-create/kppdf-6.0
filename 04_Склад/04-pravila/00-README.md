# 04_Склад/04-pravila/00-README.md — Ограничения и правила Склада

> **Назначение.** Ключевые правила: `StockMovement immutable`, `reservedQuantity <= quantity`, approve-пороги.

## 0. Контекст

Самые регламентированные правила в проекте (8 ключевых правил в `МОДУЛЬ-СКЛАД.md` §3).

## 1. Ожидаемое содержимое

- `04-biznes-pravila.md` — 8 правил: immutability movement, qty >= 0, reserved <= qty, snapshot в Items, writeoff require approve, services → нет StockMovement, RUB жёстко (СПОР-14), sealed counters (СПОР-13)
- `04-rbac.md` — 7 ролей × 11 действий Склада (из `МОДУЛЬ-СКЛАД.md` §6)
- `04-edge-keisy.md` — типовые edge-кейсы: возврат клиента (ещё не в v1), мульти-склад (2 Shipment), приход без ЗП (NULL)

## 2. Связанные документы

- [`../../99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md)
- [`../МОДУЛЬ-СКЛАД.md`](../МОДУЛЬ-СКЛАД.md) §3 Ключевые правила

## ⚠️ Статус STUB

Рабочий слот.

## Версия

| Версия | Дата | Что |
|---|---|---|
| 0.1 | 2026-06-26 | STUB. PSL-010. |
