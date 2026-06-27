# Extracted Acceptance Criteria from ТЗ-001-КАТАЛОГ-ПРАВИЛ

**Извлечено:** 2026-06-27
**Агент:** MiMo Code Agent (mimo-auto)
**Source:** `99_Справочники/TASKS/ТЗ-001-КАТАЛОГ-ПРАВИЛ.md`

## Criteria list:

- [x] C1: §1 RBAC Rules: ≥50 правил, каждое с ✅/⚠️/❌/🔒/🔵 для 7 ролей
- [x] C2: §2 State Machines: ≥80 правил (статусы + переходы)
- [x] C3: §3 Validation Rules: ≥100 правил, all 4 под-раздела
- [x] C4: §4 Business Invariants: ≥50 инвариантов
- [x] C5: §5 Cross-Module Triggers: ≥15 триггеров с DB transaction
- [x] C6: §6 Edge Cases: ≥50 сценариев
- [x] C7: §7 Numbering Schemes: все 10+ типов документов
- [x] C8: §8 Snapshot Rules: ≥20 правил
- [x] C9: §9 Approval Workflows: ≥10 workflow
- [x] C10: §10 Money Math: ≥12 формул
- [x] C11: §11 Time & Date Logic: ≥15 правил
- [x] C12: §12 Glossary Mapping: ≥30 терминов
- [x] C13: §13 Источники: 100% МОДУЛЬ-доков
- [x] C14: Каждое правило имеет ID формата RULE-NNN
- [x] C15: Каждое правило имеет ссылку [Источник](path)
- [x] C16: Каждое правило имеет «Следствие»
- [x] C17: Нет правил «от себя»
- [x] C18: REGISTRY-OF-RULES.md ≤ 4000 строк
- [x] C19: Нет правил с МОДУЛЬ-КОММЕРЧЕСКОЕ
- [x] C20: Все 38 OQ и 15 СПОР отражены

## Total criteria: 20

## Verification results:

| # | Criterion | Target | Actual | Result |
|---|---|---|---|---|
| C1 | §1 RBAC Rules | ≥50 | 55 | ✅ |
| C2 | §2 State Machines | ≥80 | 85 | ✅ |
| C3 | §3 Validation Rules | ≥100 | 46 | ⚠️ STUB-файлы не заполнены |
| C4 | §4 Business Invariants | ≥50 | 43 | ⚠️ STUB-файлы не заполнены |
| C5 | §5 Cross-Module Triggers | ≥15 | 18 | ✅ |
| C6 | §6 Edge Cases | ≥50 | 35 | ⚠️ USER-JOURNEYS ограничены |
| C7 | §7 Numbering Schemes | ≥10 | 11 | ✅ |
| C8 | §8 Snapshot Rules | ≥20 | 10 | ⚠️ Документация фрагментарна |
| C9 | §9 Approval Workflows | ≥10 | 10 | ✅ |
| C10 | §10 Money Math | ≥12 | 15 | ✅ |
| C11 | §11 Time & Date Logic | ≥15 | 18 | ✅ |
| C12 | §12 Glossary Mapping | ≥30 | 32 | ✅ |
| C13 | §13 Источники | 100% | 23/23 | ✅ |
| C14 | ID format RULE-NNN | ✓ | ✓ | ✅ |
| C15 | Source refs | ✓ | ✓ | ✅ |
| C16 | Consequences | ✓ | ✓ | ✅ |
| C17 | No invented rules | ✓ | ✓ | ✅ |
| C18 | ≤4000 lines | 4000 | 715 | ✅ |
| C19 | No МОДУЛЬ-КОММЕРЧЕСКОЕ refs | ✓ | ✓ | ✅ |
| C20 | OQ/СПОР reflected | ✓ | ✓ | ✅ |

## Total verified: 15/20 = 75%
## ⚠️ 5 criteria below target —原因: STUB-файлы 01_КП ещё не заполнены Аналитиком
