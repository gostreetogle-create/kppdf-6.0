# 05_Финансы/LAUNCH-ARCHITECT-05.md — Package для запуска Архитектора модуля Финансы (Phase 0)

> **Назначение.** Готовый copy-paste пакет для запуска Архитектора модуля **Финансы** в **новой Codebuff-сессии** (Окно №4 из 4 параллельных — ПОСЛЕДНЕЕ из 4). Подготовлен 2026-06-26 (PSL-010).
>
> ⚠️ Запускать ОКНОМ №4 потому что Финансы замыкают все cross-Q (Refund/Storno vs Refund, Termination→Order CANCELLED). После 3 предыдущих модулей Договор→Производство→Склад→Финансы цепочка полная.

## 0. Что должно произойти

1. Открыть новое окно Codebuff (Окно №4).
2. Прикрепить 12 файлов (на 1 больше чем другие — Refund отдельный attach).
3. Скопировать промпт из §2.
4. Получить дерево 05_Финансы/ с конструктор-папками `02-page-orders` + `02-page-payments` (Стратегия C).
5. Записать **PSL-010e** в PROJECT-STATE-LOG.md.

## 1. Файлы для attach (12 шт)

### Пакет A — Агентная инфраструктура (5)

| # | Путь | Зачем |
|---|---|---|
| 1 | `AGENT-ENTRYPOINT.md` | |
| 2 | `AGENT-ROLES.md` | |
| 3 | `AGENT-METHOD.md` | |
| 4 | `AGENT-PROMPTS.md` | |
| 5 | `99_Справочники/CROSS-MODULE-OQ.md` | ⛔ ОБЯЗАТЕЛЬНО — все 4 Q |

### Пакет B — Доменный вход (2)

| # | Путь | Зачем |
|---|---|---|
| 6 | `05_Финансы/МОДУЛЬ-ФИНАНСЫ.md` | Главный target (~400 строк) |
| 7 | `05_Финансы/00-spr/00-otkrytye-voprosy.md` | 5 baseline OQ |

### Пакет C — Готовые слоты (5)

| # | Путь | Зачем |
|---|---|---|
| 8 | `05_Финансы/01-shablon/00-README.md` | Слот шаблонов |
| 9 | `05_Финансы/02-page-orders/00-README.md` | Слот заказов |
| 10 | `05_Финансы/02-page-payments/00-README.md` | Слот регистрации |
| 11 | `05_Финансы/03-zhiznennyj-cikl/00-README.md` | Слот ЖЦ |
| 12 | `05_Финансы/04-pravila/00-README.md` | Слот правил |

## 2. Промпт для Codebuff

```text
Ты — Архитектор модуля Финансы. Прочитай [FILES_ATTACHED].

Твоя задача: декомпозировать МОДУЛЬ-ФИНАНСЫ.md (~400 строк) по
AGENT-METHOD.md §3 Правило 3.1:
  00-spr → 01-shablon → 02-page-orders/02-page-payments → 03-zhiznennyj-cikl → 04-pravila

Вход: 05_Финансы/МОДУЛЬ-ФИНАНСЫ.md.

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ

1. СТРОГО ЗАПРЕЩЕНО писать содержимое .md. Только ДЕРЕВО + 1-2 предложения.

2. УЧИТЫВАЙ существующие файлы:
   - 05_Финансы/00-spr/00-otkrytye-voprosy.md (5 baseline OQ) — ВКЛЮЧИ.
   - Сам МОДУЛЬ-ФИНАНСЫ.md распускается по подфайлам или становится 00-spr/00-glossary.md.

3. **⛔ КОНСТРУКТОР-ПАПКИ = 2 штуки СТРОГО ЗАФИКСИРОВАНО** per
   CROSS-MODULE-OQ Стратегия C:
     02-page-orders    (для /finance/orders — список + карточка Order)
     02-page-payments  (для регистрации Payment + Refund + Сторно)
   НЕ переименовывать.

4. **⛔ CROSS-OQ-1 (Refund) ОБЯЗАТЕЛЬНО:**
   - В 00-spr/ добавить файл `00-refund-vs-storno.md` (если Архитектор считает
     нужным для иллюстрации разделения — кладёт в дерево как новый файл).
   - В 02-page-payments/ добавить файл `02-oformlenie-refund.md`.
   - В 04-pravila/ добавить правила «Storno НЕ Refund» + «Refund.amount > 0
     + originalPaymentId NOT NULL + RESTRICT».

5. **⛔ CROSS-OQ-4 (Termination→Order.CANCELLED) ОБЯЗАТЕЛЬНО:**
   - В 03-zhiznennyj-cikl/ отразить переходы с TERMINATED Договора на
     CANCELLED Order + ручной Refund на prepaid.

6. Соблюдай агентную границу.

7. Hard limit 400 строк на файл.

Выход: Markdown-дерево + список файлов с обоснованием.
```

## 3. Ожидаемый формат

Dерево + сводная таблица (без содержимого).

## 4. Пост-обработка

1. `wc -l` hard limit.
2. ⛛ 2 конструктор-папки = `02-page-orders` + `02-page-payments`.
3. ⛛ Все 5 baseline OQ + 4 CROSS-OQ применены.
4. PSL-010e.
5. Commit + push.

## 5. CHECK-листы (5)

✅ OOM / Содержимое НЕ написано / Существующие учтены / Hard limit / Конструктор-папки = 2 шт (Стратегия C).

## 6. Связанные документы

- [`../01_КП/LAUNCH-ARCHITECT.md`](../01_КП/LAUNCH-ARCHITECT.md) — reference (1 сессия)
- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md) — все 4 Q критичны

## 7. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | PSL-010. Mirror КП LAUNCH-ARCHITECT. Специфика: 5 сущностей (Order/Invoice/Payment/Refund/Counter) + Storno vs Refund + CROSS-OQ-1/Q4. |
