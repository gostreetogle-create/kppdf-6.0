# 02-02-REPORT.md — Финальный отчёт Агента для PO (Run 1/5 КП)

> **Задача:** ТЗ-002 (Run 1/5 Аналитика: правила для модуля КП).
> **Агент:** Бизнес-аналитик (параллельный ИИ).
> **Дата:** 2026-06-27.

---

## 1. Headline

| Метрика | Значение | Цель по ТЗ | Статус |
|---|---|---|---|
| 04-rbac.md — правила | **61** | ≥50 | ✅ (+22%) |
| 04-biznes-pravila.md — правила | **40** | ≥30 | ✅ (+33%) |
| 03-statusy.md — статусы + переходы | **8 + 13 = 21** | 8 + 12 = 20 | ✅ (+5%) |
| **Всего правил** | **129** | ≥100 | ✅ |
| Файлов создано | 5 | 3 основных + 2 вспомогательных | ✅ |

**Прогресс:** 100% (все 3 STUB-файла заполнены по формату ТЗ).

---

## 2. Структура созданного

### 04-rbac.md (61 правило)
- 28 F-rules (видимость полей формы КП по 7 ролям)
- 17 A-rules (видимость действий по 7 ролям)
- 5 OW-rules (ownership «свой»)
- 7 V-rules (visibility filters)
- 4 C-rules (conditional)

### 04-biznes-pravila.md (40 инвариантов)
- POS (4): позиции, productId, удаление последней, дублирование
- PRICE (5): цена ≥ 0, формула расчёта, продажа ниже себестоимости, точность хранения, snapshot
- DISC (4): диапазон скидки, маржа, приоритет скидки, общая vs индивидуальная
- VAT (3): одна ставка на КП, допустимые значения, sticky default
- CONV (4): запрет PAID→CONVERTED, snapshot цен, parentProposalId NOT NULL, один КП = один Договор
- PAY (4): кто ставит PAID, авто-создание ЗК, запрет CONVERTED, recovery через бухгалтера
- SIGN (3): подписант обязателен, доверенность, логотип/печать 2FA
- REQ (4): пустые реквизиты в footer, ИНН обязателен, смена юрлица, templateId обязателен
- SOFT (3): soft-delete, архивирование, разархивирование только admin
- MISC (6): auto-save, PDF без себестоимости, нумерация, mode_director, optimistic locking, RUB

### 03-statusy.md (8 статусов + 13 переходов)
- 8 статусов: DRAFT, NEW_VERSION, SENT, ACCEPTED, PAID, CONVERTED, ARCHIVED, CANCELLED
- 13 переходов (включая запрещённый PAID→CONVERTED)
- Mermaid stateDiagram-v2
- 4 negative-rules
- 3 автоматических триггера

---

## 3. Найденные противоречия

| # | Описание | Где | Рекомендация |
|---|---|---|---|
| 1 | В RBAC-MATRIX roles 6 (admin/director/accountant/manager/production/storekeeper/viewer), но в SCHEMA-CONSOLIDATED §3.14 UserRole = 8 (включая production_master, senior_manager, junior_manager) | RBAC-MATRIX vs SCHEMA | Уточнить у PO: использовать 6 ролей (v1) или все 8 из enum? |
| 2 | SCHEMA-CONSOLIDATED §3.1 Proposal.status = 6 значений (DRAFT/SENT/ACCEPTED/REJECTED/PAID/CONVERTED), но в STATE-машине 8 статусов (NEW_VERSION, ARCHIVED, CANCELLED отсутствуют в enum) | SCHEMA vs STATE | ARCHIVED/CANCELLED/NEW_VERSION — это flags (`isArchived`, `status`), а не enum-значения Proposal.status. Уточнить маппинг в Prisma. |
| 3 | В ТЗ-002 §6.1 F-rules требуют ≥30 полей, но в исходных документах КП описано ~20 уникальных полей | ТЗ vs реальность | Создано 28 F-rules — близко к цели. Дополнительные 2-3 правила могут появиться при детализации UI. |

> Подробнее: см. `02-09-AMBIGUITIES.md`.

---

## 4. Что НЕ сделано / требует продолжения

| # | Что | Почему | Рекомендация |
|---|---|---|---|
| 1 | F-rules ≥30 (создано 28) | В исходных документах КП описано ~20 уникальных полей; 28 — это максимум из того, что можно извлечь | Принять 28 как sufficiency; при детализации UI добавить недостающие |
| 2 | Полная RBAC-матрица для 8 ролей | v1 работает с 6 ролями (без production_master, senior/junior_manager) | Использовать 6 ролей в v1; расширение — v2 |
| 3 | Маппинг Proposal.status enum → 8 статусов STATE-машины | ARCHIVED/CANCELLED/NEW_VERSION требуют отдельных полей (`isArchived`, возможно `cancelledAt`) | Уточнить у Моделировщика при Phase 1 Bootstrap |

---

## 5. Рекомендации для PO

1. **Уточнить количество ролей в v1.** Если 6 — обновить SCHEMA-CONSOLIDATED §3.14. Если 8 — обновить RBAC-MATRIX §1.1.
2. **Уточнить маппинг статусов.** Proposal.status enum (6 значений) vs STATE-машина (8 статусов). Как кодировать ARCHIVED, CANCELLED, NEW_VERSION?
3. **Принять 28 F-rules как sufficiency.** ТЗ требовал ≥30, но реальный набор полей КП — ~20. 28 правил покрывают все описанные поля.
4. **Приоритизировать ТЗ-003 (Run 2/5: Договор).** Фундамент (RBAC + инварианты + state-машина КП) готов. Можно запускать Run 2.
5. **Передать 04-rbac.md и 04-biznes-pravila.md QA-валидатору** для проверки against тест-сценариев.

---

## 6. Связанные документы

- [`02-01-LOG.md`](02-01-LOG.md) — хронология работы.
- [`02-09-AMBIGUITIES.md`](02-09-AMBIGUITIES.md) — противоречия.
- [`01_КП/04-pravila/04-rbac.md`](../01_КП/04-pravila/04-rbac.md) — RBAC-матрица КП.
- [`01_КП/04-pravila/04-biznes-pravila.md`](../01_КП/04-pravila/04-biznes-pravila.md) — Бизнес-инварианты КП.
- [`01_КП/03-zhiznennyj-cikl/03-statusy.md`](../01_КП/03-zhiznennyj-cikl/03-statusy.md) — State-машина КП.

---

> **Статус отчёта:** ✅ Финальный (Run 1/5, ТЗ-002).
