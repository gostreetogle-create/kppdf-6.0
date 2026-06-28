# ID-ALIAS-MAP.md — Canonical ID Alias Table (Pipeline v6 ID Drift Resolution)

> Назначение. Системный source-of-truth маппинга старых -> новых ID-префиксов для решения REVERSE DRIFT (по [PSL-043](#)). Применяемость: когда Run-N+1 Аналитик hard-link ссылается на ID в upstream proven Run и не находит (олд имя -> новое имя в downstream spec, но frozen upstream не изменён).
>
> **Создан**: 2026-06-27 (по architect-than decision по анализу thinker-with-files-gemini, option D: Hybrid marker approach).
>
> **Важно**: Этот **ТОЛЬКО** для архитектурной справки. Агент-Аналитик читает этот файл ТОЛЬКО если в его ТЗ есть ссылка «alias-map на ID-ALIAS-MAP.md». Иначе in-line DEPRECATED маркеры в upstream тз достаточны.

---

## 0. Format

Каждая строка таблицы в формате:

| OLD ID (frozen) | →   | NEW ID (canonical) | Reason | Supersedes at (PSL) |
| --------------- | --- | ------------------ | ------ | ------------------- |

---

## 1. CHAIN-* group prefix (proven Run 2/5 + 3/5 upstream)

| OLD ID (frozen)                | →   | NEW ID (canonical)                      | Reason                                                                            | Supersedes at (PSL)               |
| ------------------------------ | --- | --------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| `INV-ПРД-CHAIN-КЛАД-NNN`       | →   | `СКЛ-NNN` `INV-ПРД-CHAIN-СКЛ-NNN`       | «Клад» = полное имя, «Склад» = аббревиатура для ID prefix                         | PSL-043                           |
| `INV-ПРД-CHAIN-ФИНАНСЫ-NNN`    | →   | `INV-ПРД-CHAIN-ФИН-NNN`                 | «Финансы» избыточно, аббревиатура `-ФИН` каноническа                              | PSL-043                           |
| `INV-ДОГ-CHAIN-PRODUCTION-NNN` | →   | `INV-ДОГ-CHAIN-ПРД-NNN + CHAIN-ФИН-NNN` | Уже разделён на ПРД/ФИН в downstream ТЗ (в upstream ДОГ сщё «Производство» общий) | TBD ПО                            |
| `INV-ДОГ-CHAIN-PURCHASE-NNN`   | →   | `INV-ДОГ-CHAIN-СКЛ-NNN`                 | NEW группа в ТЗ-013 (fabricated), PO confirm                                      | TBD ПО (может SUPERSEDE upstream) |
| `INV-ДОГ-CHAIN-SHIPMENT-NNN`   | →   | `INV-ДОГ-CHAIN-СКЛ-NNN`                 | То же, ПО confirm                                                                 | TBD ПО                            |
| `INV-ДОГ-CHAIN-ORDER-NNN`      | →   | `INV-ДОГ-CHAIN-ФИН-NNN`                 | Order = финансовый entity, не договорный                                          | PSL-043                           |
| `INV-КП-CHAIN-KP-NNN`          | →   | `INV-КП-CHAIN-КП-NNN`                   | LOW severity: латинская/cyrillic каноническая                                     | TBD ПО                            |
| `INV-КП-PAYMENT-NNN`           | →   | `INV-КП-PAY-NNN`                        | «Payment» в Run-N+1 = DOWNSTREAM, Run-1 использовал «PAY»                         | TBD ПО                            |

---

## 2. Decision Log

Ключевые решения по [PSL-043](#) (Hybrid marker approach, option D):

- **A) Frozen upstream NOT renamed** (option A).
- **B) Downstream canonical preserved** (ТЗ-013 + ТЗ-014).
- **C) In-line DEPRECATED markers** в ТЗ-011, ТЗ-012, ТЗ-002 показывают Агенту правильный alias (NEW ID).
- **D) Этот файл (ID-ALIAS-MAP.md)** = единый canonical source-of-truth, на который может ссылаться ПО и Координатор.
- **E) Hard-link в downstream ТЗ-013 + ТЗ-014** сохраняется каноническим (СКЛ, ФИН). При hard-link resolution Агент читает этот файл если не находит в upstream.

---

## 3. Связанные файлы

- [PROJECT-STATE-LOG.md](../../PROJECT-STATE-LOG.md) (запись PSL-043)
- [ТЗ-013-RUN-4-5АНАЛИТИК-СКЛАД.md](../../99_Справочники/TASKS/ТЗ-013-RUN-4-5-АНАЛИТИК-СКЛАД.md)
- [ТЗ-014-RUN-5-5-АНАЛИТИК-ФИНАНСЫ.md](../../99_Справочники/TASKS/ТЗ-014-RUN-5-5-АНАЛИТИК-ФИНАНСЫ.md)
- [ТЗ-012-RUN-3-5АНАЛИТИК-ПРОИЗВОДСТВО.md](../../99_Справочники/TASKS/ТЗ-012-RUN-3-5-АНАЛИТИК-ПРОИЗВОДСТВО.md) (frozen, DEPRECATED markers added per PSL-043)
- [ТЗ-011-RUN-2-5АНАЛИТИК-ДОГОВОР.md](../../99_Справочники/TASKS/ТЗ-011-RUN-2-5-АНАЛИТИК-ДОГОВОР.md) (frozen, DEPRECATED markers if needed per PSL-043)

---

## 4. Версия

| Версия | Дата       | Что                                                                                                                                                                        |
| ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0    | 2026-06-27 | Создан по thinker-with-files-gemini option D (Hybrid marker) в рамках reverse-drift resolution per PSL-043. 8 алиасов в 3 группах (CHAIN prefix + payment + cross-module). |
