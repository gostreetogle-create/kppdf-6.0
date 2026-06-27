# 02-09-AMBIGUITIES.md — Противоречия между правилами (Run 1/5 КП)

> **Задача:** ТЗ-002 (Run 1/5 Аналитика: правила для модуля КП).
> **Дата:** 2026-06-27.

---

## A-001: Количество ролей в RBAC — 6 или 8?

| Поле | Значение |
|---|---|
| **ID** | A-001 |
| **Где** | RBAC-MATRIX §1.1 (6 ролей) vs SCHEMA-CONSOLIDATED §3.14 (8 ролей: admin, director, accountant, manager, production, production_master, storekeeper, viewer + senior_manager, junior_manager) |
| **Суть** | RBAC-MATRIX использует 6 базовых ролей. SCHEMA-CONSOLIDATED enum UserRole включает production_master, senior_manager, junior_manager. |
| **Влияние на 04-rbac.md** | Текущий файл использует 6 ролей (по RBAC-MATRIX). Если PO выберет 8 — потребуется расширить все таблицы F/A-rules. |
| **Рекомендация** | Использовать 6 ролей в v1 (как в RBAC-MATRIX). senior/junior_manager и production_master — отложить в v2. |

---

## A-002: Proposal.status enum vs 8 статусов STATE-машины

| Поле | Значение |
|---|---|
| **ID** | A-002 |
| **Где** | SCHEMA-CONSOLIDATED §3.1 (6 значений enum: DRAFT/SENT/ACCEPTED/REJECTED/PAID/CONVERTED) vs STATE-машина (8 статусов: +NEW_VERSION, ARCHIVED, CANCELLED) |
| **Суть** | Enum ProposalStatus имеет 6 значений. STATE-машина описывает 8 статусов. ARCHIVED, CANCELLED, NEW_VERSION не входят в enum. |
| **Влияние** | В Phase 1 Bootstrap Prisma потребуется решить: (а) добавить в enum 3 значения, (б) использовать отдельные boolean-флаги (`isArchived`, `isCancelled`), (в) комбинацию. |
| **Рекомендация** | Уточнить у Моделировщика. Вероятно: `status` enum (6 значений) + `isArchived: Boolean` + `isNewVersion: Boolean`. |

---

## A-003: Связь «Картотека сделки» и packageTag

| Поле | Значение |
|---|---|
| **ID** | A-003 |
| **Где** | GLOSSARY-MASTER §3 (packageTag — уникальный тег сделки) vs 00-otkrytye-voprosy OQ-005 (термин «Картотека сделки» не канонизирован) |
| **Суть** | packageTag связывает документы одной сделки, но термин «Картотека сделки» (UX-контейнер) нигде не определён в GLOSSARY-MASTER. |
| **Влияние** | Минимальное — терминологический дрейф. Влияет на UX-документацию, не на код. |
| **Рекомендация** | Добавить в GLOSSARY-MASTER определение «Картотека сделки» (перенесено из OQ-005). |

---

## A-004: Формула расчёта итога — наценка до или после скидки?

| Поле | Значение |
|---|---|
| **ID** | A-004 |
| **Где** | 04-biznes-pravila INV-КП-DISC-003 vs 02-tablica-pozicij.md (контекст) |
| **Суть** | В ТЗ-002 §6.2 указана формула `price × qty × (1 - discount)`. В 02-tablica-pozicij.md — `qty × price × (1 + markup) × (1 - discount)`. Приоритет наценки vs скидки: МОДУЛЬ §4 утверждает «наценка применяется ДО скидки». |
| **Влияние** | Текущая формула в 04-biznes-pravila INV-КП-PRICE-002 использует `qty × price × (1 + markup) × (1 - discount)` — это КОРРЕКТНО (наценка до скидки). |
| **Рекомендация** | Принять текущую формулу как каноническую. Уточнить в 02-tablica-pozicij.md. |

---

## A-005: Восстановление из архива — creator или только admin?

| Поле | Значение |
|---|---|
| **ID** | A-005 |
| **Где** | 03-perehody.md (STUB: «любой → ARCHIVED (только из DRAFT или CANCELLED)») vs RBAC-MATRIX §1.1 (admin/director видят все) |
| **Суть** | Восстановление из ARCHIVED: 03-perehody.md не указывает явно. RBAC-MATRIX не содержит действия «восстановить из архива». |
| **Влияние** | Если creator не может восстановить — нужна роль admin. Если creator может — нужно добавить A-rule. |
| **Рекомендация** | В v1: только admin может восстановить (conservative path). Creator получит «обратитесь к администратору». |

---

> **Статус:** ✅ 5 противоречий зафиксировано. Ни одно не является блокером для Run 1/5.
