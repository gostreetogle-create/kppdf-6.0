# 02-REPORT-CHANGES.md — ТЗП-001 INTEGRITY-OVERSIGHT (TSV Diff)

> **Назначение.** Машиночитаемый diff «что изменилось» для автоматизированной обработки.

---

## Формат

```
file_path<TAB>line_number<TAB>severity<TAB>rule_violated<TAB>recommendation
```

---

## Данные

```
BIG-BOOK.md	3	🟡 P1	C2 (Cross-references)	Заменить ../../AGENT-REVIEW.md на AGENT-REVIEW.md
BIG-BOOK.md	141	🟡 P1	C2 (Cross-references)	Заменить 01_КП/МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md на 01_КП/README.md
BIG-BOOK.md	525	🟡 P1	C2 (Cross-references)	Заменить 01_КП/МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md на 01_КП/README.md
prisma/schema.prisma	0	🟡 P1	C5 (Schema-doc alignment)	Добавить Comment entity после ТЗ-004 (ожидаемо)
prisma/schema.prisma	0	🟡 P1	C4 (SPEC compliance)	Добавить packageTag в Proposal/Contract/ProductionOrder после ТЗ-004 (ожидаемо)
PROJECT-STATE-LOG.md	246	🟢 P2	C3 (ID conflicts)	Переместить PSL-013 выше PSL-014 (косметика)
```
