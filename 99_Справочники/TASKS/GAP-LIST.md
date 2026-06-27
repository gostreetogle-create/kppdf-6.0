# GAP-LIST.md — ТЗП-001 INTEGRITY-OVERSIGHT

> **Назначение.** Полный перечень нарушений, обнаруженных в ходе аудита целостности KPPDF CRM v6.

---

## §0. Header

| Поле | Значение |
|---|---|
| **Агент** | AUDITOR / MiMo Code Agent (mimo-auto) |
| **Дата** | 2026-06-27 |
| **Всего gaps** | 5 (3 исправлено, 2 ожидает ТЗ-004) |
| **Breakdown** | 🔴 P0: 0 / 🟡 P1: 4 (2 ✅ / 2 ⏳) / 🟢 P2: 1 (✅) |

---

## §1. 🔴 P0 BLOCKING

Нет блокирующих нарушений. Все P0 категории (C1-C5) прошли без FAIL.

---

## §2. 🟡 P1 IMPORTANT

### GAP-001: Битая ссылка на AGENT-REVIEW.md

| Поле | Значение |
|---|---|
| **ID** | GAP-001 |
| **Severity** | 🟡 P1 |
| **Status** | ✅ ИСПРАВЛЕНО (2026-06-27) |
| **File** | BIG-BOOK.md:3 |
| **Rule violated** | C2 (Cross-references × broken) |
| **Detail** | Ссылка `[AGENT-REVIEW.md §1.6](../../AGENT-REVIEW.md)` ведёт на `D:\AGENT-REVIEW.md` (два уровня выше корня). Относительный путь `../../` некорректен для файла в корне проекта. |
| **Recommendation** | Заменить на `[AGENT-REVIEW.md §1.6](AGENT-REVIEW.md)` |

### GAP-002: Битая ссылка на МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md (×2)

| Поле | Значение |
|---|---|
| **ID** | GAP-002 |
| **Severity** | 🟡 P1 |
| **Status** | ✅ ИСПРАВЛЕНО (2026-06-27) |
| **File** | BIG-BOOK.md:141, BIG-BOOK.md:525 |
| **Rule violated** | C2 (Cross-references × broken) |
| **Detail** | Две ссылки `[МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md](01_КП/МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md)` ведут на удалённый файл (декомпозирован в 20 STUB по PSL-004). |
| **Recommendation** | Заменить на `[01_КП/README.md](01_КП/README.md)` (entypoint модуля после декомпозиции) |

### GAP-003: Comment entity отсутствует в schema.prisma

| Поле | Значение |
|---|---|
| **ID** | GAP-003 |
| **Severity** | 🟡 P1 |
| **File** | prisma/schema.prisma |
| **Rule violated** | C5 (Schema-doc alignment) |
| **Detail** | SCHEMA-CONSOLIDATED.md определяет сущность `Comment: { id, packageTag, authorId, text, createdAt, isArchived }`. В schema.prisma эта сущность отсутствует. Также отсутствуют: Workshop, Reservation, SupplierDelivery/Item, WriteOffAct/Item, PurchaseOrder/Item, Payment, Refund, Order (Finance). |
| **Recommendation** | Ожидаемо: ТЗ-004 (Phase 1 Bootstrap Prisma) добавит все 9 сущностей. Проверить после завершения ТЗ-004. |

### GAP-004: packageTag отсутствует в Proposal/Contract/ProductionOrder

| Поле | Значение |
|---|---|
| **ID** | GAP-004 |
| **Severity** | 🟡 P1 |
| **File** | prisma/schema.prisma |
| **Rule violated** | C4 (SPEC compliance × Phase 1 Bootstrap) |
| **Detail** | SCHEMA-CONSOLIDATED.md определяет `packageTag: String?` для Proposal, Contract, ProductionOrder. В текущем schema.prisma (v5 baseline) эти поля отсутствуют. |
| **Recommendation** | Ожидаемо: ТЗ-004 миграция E добавит packageTag. Проверить после завершения ТЗ-004. |

---

## §3. 🟢 P2 NICE-TO-HAVE

### GAP-005: PSL-013 не в хронологическом порядке

| Поле | Значение |
|---|---|
| **ID** | GAP-005 |
| **Severity** | 🟢 P2 |
| **Status** | ✅ ИСПРАВЛЕНО (2026-06-27) |
| **File** | PROJECT-STATE-LOG.md |
| **Rule violated** | C3 (ID conflicts × PSL) |
| **Detail** | PSL-013 расположен после PSL-016 (строка 246), хотя должен быть выше PSL-014 (строка 134). Правило PROJECT-STATE-LOG §0: «новые записи сверху (свежее = выше)». |
| **Recommendation** | Переместить запись PSL-013 выше PSL-014. Косметика, не влияет на логику. |

---

## §4. Шаблон GAP-карточки

```
### GAP-NNN: <Краткое описание>

| Поле | Значение |
|---|---|
| **ID** | GAP-NNN |
| **Severity** | 🔴 P0 / 🟡 P1 / 🟢 P2 |
| **File** | path/to/file.md:line |
| **Rule violated** | C# (название категории) |
| **Detail** | Конкретное описание проблемы с файлом:строкой |
| **Recommendation** | Конкретное действие по исправлению |
```
