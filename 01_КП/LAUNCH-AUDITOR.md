# LAUNCH-AUDITOR.md — Package для запуска AUDITOR (Phase 1 Bootstrap integrity audit)

> **Назначение.** Готовый copy-paste пакет для запуска **надзорного** агента AUDITOR в **новой сессии Codebuff**. Подготовлен 2026-06-27 после создания ТЗП-001 + ТЗ-0000 (PSL-013, PSL-016). **Это не Phase-1/Phase-2 запускающий роль** — это верификатор готовности проекта к старту кодинга.
>
> **Когда использовать.** ТОЛЬКО после завершения ≥3 из 6 рабочих ТЗ (ТЗ-001..006) — иначе AUDITOR будет проверять воздух. Тригер по INTEGRATION-PLAN §6.2: **Full audit** (все 6 готовы), **Partial Tier-1** (≥3 готовы, минимальный блокер-чек), **Hot-fix audit** (после FAIL → fix → re-audit).
>
> **Trigger от PO:** фраза *«Пожалуйста, прочитай `LAUNCH-AUDITOR.md` + `ТЗП-001-INTEGRITY-OVERSIGHT.md` + `ТЗ-0000-CLOSURE-PROTOCOL.md` и начни аудит»* или явный *«запусти ТЗП-001 в режиме <X>»*.

---

## 0. Что должно произойти (READ THIS FIRST)

> **⚠️ ПОРЯДОК ЧТЕНИЯ ОБЯЗАТЕЛЕН:**
>
> 1. Прочитай [`LAUNCH-AUDITOR.md`](LAUNCH-AUDITOR.md) полностью (этот файл).
> 2. Прочитай [`99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md`](../99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md) — основная спецификация твоей работы (1100 строк).
> 3. Прочитай [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](../99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md) — протокол закрытия твоей работы (когда закончишь).
> 4. Прочитай [`99_Справочники/INTEGRATION-PLAN.md`](../99_Справочники/INTEGRATION-PLAN.md) §6 — какой trigger режим сейчас активный.
> 5. Прочитай [`99_Справочники/CHECKLIST.md` §12.5](../99_Справочники/INTEGRATION-PLAN.md) — integration plan индекс.
> 6. **По завершении аудита — ОБЯЗАТЕЛЬНО примени ТЗ-0000 к себе** (6 фаз closure). PO не выключит тебя пока нет ✅ CLOSED verdict.

После прочтения всех 5 файлов — следуй §1 (открой сессию Codebuff + attach + промпт).

---

## 1. Файлы для attach (3 режима)

> ⚠️ **Выбор режима — по `INTEGRATION-PLAN.md` §6.2 или явному указанию PO.** Если не уверен — стартуй с **Partial Tier-1** (8 файлов, покрывает 5 🔴 P0 категорий + 1-2 semantic checks).

### Режим A — **Full audit** (все 6 ТЗ готовы, comprehensive +19 проверок)

| # | Путь | Размер | Зачем |
|---|---|---|---|
| 1 | `AGENT-METHOD.md` | 500 | §5.3 автономия + §5.6 IN-WORK CHECKLIST протокол |
| 2 | `AGENT-FORMAT.md` | 350 | анти-паттерны A1-A11 |
| 3 | `AGENT-PROMPTS.md` | 250 | §3 канонический промпт Auditor если есть |
| 4 | `CHECKLIST.md` | 400 | snapshot текущего состояния + §12 архистратор running notes |
| 5 | `PROJECT-STATE-LOG.md` | 600 | последние 5 PSL (для C3 ID conflicts) |
| 6 | `99_Справочники/SCHEMA-CONSOLIDATED.md` | 600 | 32 сущности (для C5 schema-doc) |
| 7 | `99_Справочники/RBAC-MATRIX.md` | 300 | 7 ролей × 30 действий (для S2 RBAC consistency) |
| 8 | `99_Справочники/DECISION-METHODOLOGY.md` | 800 | 5 фаз (если ТЗ-005 ready; для S5/S7) |
| 9 | `99_Справочники/REGISTRY-OF-RULES.md` | 700-2500 | правила по 5 модулям (для C7, C8) |
| 10 | `01_КП/04-pravila/04-rbac.md` | 50-150 | STUB КП (если Run 1/5 ready) |
| 11 | `01_КП/04-pravila/04-biznes-pravila.md` | 30-100 | STUB КП инварианты |
| 12 | `01_КП/03-zhiznennyj-cikl/03-statusy.md` | 30-80 | STUB КП state-машина |
| 13 | `01_КП/LAUNCH-UX.md` | 600 | UI pattern (если ТЗ-003 ready) |
| 14 | `kppdf-6.0/prisma/schema.prisma` | 600 | Phase 1 Bootstrap (если ТЗ-004 ready, иначе N/A) |
| 15 | `99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md` | 1100 | **твоя собственная спецификация** — перечитай |

**Итого Full:** 15 файлов ≈ 6800 строк. 

### Режим B — **Partial Tier-1 audit** (≥3 ТЗ готовы, минимальный блокер-чек)

Используется когда нужно быстро проверить **только критичные 🔴 P0**:
- C1 hard limits
- C2 cross-references
- C3 ID conflicts
- C4 SPEC compliance (если применим)
- C5 schema-doc alignment

| # | Путь | Размер | Зачем |
|---|---|---|---|
| 1 | `AGENT-METHOD.md` | 500 | §5.6 протокол (для проверки IN-WORK блоков) |
| 2 | `CHECKLIST.md` | 400 | §3 snapshot + §12 архистратор notes |
| 3 | `PROJECT-STATE-LOG.md` | 600 | §1 журнал (для C3 ID conflicts монотонность) |
| 4 | `99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md` | 1100 | твоя спецификация |
| 5 | `99_Справочники/INTEGRATION-PLAN.md` | 500 | §6.2 для trigger selection |
| 6 | `99_Справочники/DECISION-METHODOLOGY.md` | 800 | если ТЗ-005 ready (для S5) |
| 7 | `99_Справочники/REGISTRY-OF-RULES.md` | 700-2500 | если ТЗ-001 ready |
| 8 | `kppdf-6.0/prisma/schema.prisma` | 600 | если ТЗ-004 ready |

**Итого Partial Tier-1:** 8 файлов ≈ 4500 строк.

### Режим C — **Hot-fix audit** (после ❌ BLOCKED → fix → re-audit)

Минимальный re-audit ТОЛЬКО на исправленных gaps из предыдущего AUDIT-REPORT:

| # | Путь | Зачем |
|---|---|---|
| 1 | `99_Справочники/TASKS/AUDIT-REPORT.md` | прошлый verdict + GAP-LIST (что было FAIL) |
| 2 | `99_Справочники/TASKS/BLOCKING-ISSUES.md` | конкретные 🔴 P0 для re-check |
| 3 | `PROJECT-STATE-LOG.md` | свежие PSL после fix |
| 4 | затронутые fix-файлы (из gap-list) | вручную |

**Итого Hot-fix:** 3-7 файлов ≈ 1500 строк.

### Trigger detection algorithm (если PO не указал режим)

Если PO не указал явно режим (Full / Partial / Hot-fix) — самостоятельно определи по состоянию working tree:

| # | Проверка (через `file_exists` + `wc -l`) | Результат = «готово» если |
|---|---|---|
| 1 | `99_Справочники/REGISTRY-OF-RULES.md` (ТЗ-001) | >100 строк (baseline 715 строк) |
| 2 | `01_КП/04-pravila/04-rbac.md` (ТЗ-002) | >30 строк (baseline RBAC matrix) |
| 3 | `01_КП/LAUNCH-UX.md` (ТЗ-003) | exists |
| 4 | `kppdf-6.0/prisma/schema.prisma` (ТЗ-004) | exists |
| 5 | `99_Справочники/DECISION-METHODOLOGY.md` (ТЗ-005) | exists |
| 6 | `99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md` #[## Scoring] (ТЗ-006) | содержит `## Scoring` блок |

**Логика выбора режима:**

| Готовых ТЗ | Текущий audit mode |
|---|---|
| 6/6 | **Full audit** (Режим A) — все 19 проверок |
| ≥3/6 | **Partial Tier-1** (Режим B) — только 🔴 P0 (C1..C5) |
| После предыдущего ❌ BLOCKED + fix готов | **Hot-fix** (Режим C) — только GAP-LIST re-check |
| <3/6 | ❌ СТОП — недостаточно данных для аудита, эскалировать PO |

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

```text
Ты — AUDITOR (надзорный агент). Прочитай [FILES_ATTACHED]
в порядке attach (Пакет A → B → C, либо Tier-1, либо Hot-fix).

Прежде всего прочитай §0 этого LAUNCH-AUDITOR.md + полностью
ТЗП-001-INTEGRITY-OVERSIGHT.md + ТЗ-0000-CLOSURE-PROTOCOL.md
(без них ты не знаешь свой scope).

Trigger: <PO указал режим A / B / C, или сам определи по INTEGRATION-PLAN §6.2>

🎯 ГЛАВНАЯ ЦЕЛЬ: выдать verdict ✅ PASS / ⚠️ PASS-WITH-WARNINGS /
   ❌ BLOCKED по результатам +12 static (C1..C5 P0, C6..C10 P1,
   C11..C12 P2) + 7 semantic (S1..S7) проверкам.

🛑 ГЛАВНЫЙ ВЕРДИКТ BOUND (см. ТЗП-001 §9):
   - ❌ BLOCKED по любой 🔴 P0 (C1..C5) категории = Phase 1 Bootstrap /
     Phase 2 UI ЗАБЛОКИРОВАНЫ
   - ⚠️ PASS-WITH-WARNINGS = можно стартовать, но с оговорками
   - ✅ PASS ≥90% coverage + все 5 P0 = PASS

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ — нарушение = роль дрейфа + ответственность

1. **СТРОГО READ-ONLY РОЛЬ.** Аудитор НЕ правит контент:
   - ❌ НЕ создавать новые файлы (кроме 4 deliverables AUDIT-REPORT.md
     / GAP-LIST.md / BLOCKING-ISSUES.md / 02-REPORT-CHANGES.md +
     1 audit-trail в PROJECT-STATE-LOG.md)
   - ❌ НЕ править существующие файлы CHECKLIST.md / REGISTRY.md /
     STUB-файлы КП / МОДУЛЬ-доки и т.д.
   - ❌ НЕ пересматривать закрытые PSL/Q/СПОР (PSL-008 фиксирует правило)
   - ✅ Только фиксировать найденное в GAP-LIST

2. **СОБЛЮДАЙ SCOPE ТЗП-001 §2.** НЕ расширяй audit на файлы вне §2.1
   / §2.3. Если считаешь что нужно проверить ещё → §5 AUDIT-REPORT
   «Что НЕ проверил» + cross-link, НЕ расширяй scope молча.

3. **ДОКАЗАТЕЛЬНОСТЬ каждого gap.** Формат СТРОГО:
   `❌ CHECK FAIL | file: <path>:<line> | rule: <C-N or S-N> | detail: <...>`
   Без «по-моему, тут плохо». Только file:line + rule + конкретное
   описание нарушения.

4. **VERDICT logic СТРОГО per ТЗП-001 §9.1.** Не выдумывать новые
   статусы. ✅/⚠️/❌ — единственные.

5. **УРОВЕНЬ SEVERITY критичен.** Только реальные 🔴 P0 = ❌ BLOCKED.
   Если coverage 91% — это ✅ PASS, не ❌. Анти-паттерн A6.

6. **CLOSE-OUT per ТЗ-0000 ОБЯЗАТЕЛЬНО.** После 4 deliverables:
   пройди все 6 фаз ТЗ-0000 (PC checklist → RE-READ self-task →
   SELF-AUDIT → CROSS-REF → визуальный 🔒 FINALIZED → CLOSURE-REPORT).
   Создай <ТЗП-001>_02-CLOSURE-REPORT.md рядом с ТЗП-001.
   PSL-NNN в PROJECT-STATE-LOG.md.
   PO не выключит тебя пока нет ✅ CLOSED verdict от ТЗ-0000.

ВЫХОД: 4 deliverables (см. ТЗП-001 §3)
  + 1 audit-trail PSL-NNN
  + 1 closure-report от ТЗ-0000
  Если ❌ BLOCKED — также создать fix-ТЗ черновик (НЕ запускать
  fix самостоятельно — передать PO).

Применяй чек-лист самопроверки AGENT-REVIEW.md перед сдачей.
```

---

## 3. Ожидаемый формат output'а AUDITOR

AUDITOR возвращает **только 4-5 файлов + 1 audit-trail**:

```markdown
## Audit Result Summary (TLDR)

**Trigger:** <Full / Partial Tier-1 / Hot-fix>
**Coverage:** <XX.X%>% (10.5 / 12 категорий)
**Verdict:** <✅ PASS / ⚠️ PASS-WITH-WARNINGS / ❌ BLOCKED>
**Recommendation:** <Phase 1 Bootstrap / Phase 2 UI стартует | ЗАБЛОКИРОВАН>

### Top 5 risks
1. <file>:<line> — <rule> — <description>
2. ...

### Top 5 gaps (from GAP-LIST)
1. 🔴 P0 / 🟡 P1 / 🟢 P2 — file:line — rule
2. ...

### Что НЕ проверил (honest disclaimer)
- ...

### Handoff
- PO: <что делать дальше>
- Следующий агент: <когда запускать>
```

---

## 4. Пост-обработка output'а AUDITOR (в ЭТОЙ сессии)

Когда AUDITOR вернёт 4 deliverables + CLOSURE-REPORT:

### Шаг A: Прочитать AUDIT-REPORT.md §1 Executive summary + §6 Verdict

| Verdict | Что делать |
|---|---|
| ✅ PASS | Запустить Phase 1 Bootstrap Prisma код + Phase 2 Mantine UI |
| ⚠️ PASS-WITH-WARNINGS | Прочитать GAP-LIST → PO решает какие warnings принять |
| ❌ BLOCKED | НЕ запускать Phase 2. Создать fix-ТЗ → re-audit |

### Шаг B: Сверить hard limits (ТЗП-001 §11)

```bash
cd 'D:\kppdf-6.0'
wc -l '99_Справочники/TASKS/AUDIT-REPORT.md' \
      '99_Справочники/TASKS/GAP-LIST.md' \
      '99_Справочники/TASKS/BLOCKING-ISSUES.md' \
      '99_Справочники/TASKS/02-REPORT-CHANGES.md' \
      '...02-CLOSURE-REPORT.md'
# Target ≤ 400 / 1000 / 100 / nl / 400. Hard ≤ 600 для closure-report.
```

### Шаг C: Записать PSL-NNN в PROJECT-STATE-LOG.md (аудит-event)

```markdown
### PSL-018 — AUDITOR (ТЗП-001) запущен, verdict <verdict>

| Поле | Значение |
|---|---|
| Дата | <YYYY-MM-DD> |
| ID | PSL-018 |
| Тип | process (audit) |
| Модуль | Универсально |
| Автор | AUDITOR / <model> |
| Trigger | <Full / Partial Tier-1 / Hot-fix> |
| Verdict | <✅ PASS / ⚠️ PASS-WITH-WARNINGS / ❌ BLOCKED> |
| Coverage | <XX.X%>% |
| Top 3 risks | <file:desc> |
| Затронутые файлы | - AUDIT-REPORT.md (verdict)<br>- GAP-LIST.md (gaps)<br>- BLOCKING-ISSUES.md (только ❌ если есть)<br>- 02-REPORT-CHANGES.md (TSV diff)<br>- <ИМЯ>_02-CLOSURE-REPORT.md (CLOSURE per ТЗ-0000) |
```

### Шаг D: Commit + push

```bash
git add '99_Справочники/TASKS/AUDIT-REPORT.md' \
        '99_Справочники/TASKS/GAP-LIST.md' \
        '99_Справочники/TASKS/BLOCKING-ISSUES.md' \
        '99_Справочники/TASKS/02-REPORT-CHANGES.md' \
        '99_Справочники/TASKS/..._02-CLOSURE-REPORT.md' \
        'PROJECT-STATE-LOG.md'

git commit -m "chore(docs): ТЗП-001 AUDITOR verdict <verdict> — coverage <X>% (PSL-018)

- AUDIT-REPORT.md: verdict per ТЗП-001 §9.1
- GAP-LIST.md (если есть gaps)
- BLOCKING-ISSUES.md (если ❌ BLOCKED)
- AUDITOR CLOSURE-REPORT per ТЗ-0000
- Trigger: <Full / Tier-1 / Hot-fix>"

git push origin main
```

### Шаг E: Handoff на следующий agent по результату

| Verdict | Next Agent |
|---|---|
| ✅ PASS | Phase 1 Bootstrap Prisma (ТЗ-004 fix-агент) → Phase 2 Mantine UI |
| ⚠️ W | PO решает из GAP-LIST какие warnings принять |
| ❌ BLOCKED | Fix-ТЗ → re-audit (новая сессия AUDITOR с Hot-fix trigger) |

---

## 5. Контроль качества запуска

✅ **CHECK 1: Trigger правильный?** Соответствует `INTEGRATION-PLAN.md §6.2` + явный запрос PO? Если не уверен — спросить PO перед стартом (только этот вопрос UX-критичен — Правило 5.3.2).

✅ **CHECK 2: READ-only проверен?** AUDITOR не правил ни одного existing файла кроме 4 deliverables + closure-report + PSL? Если правил — СТОП и переделать через fix-агента.

✅ **CHECK 3: Verdict выставлен с обоснованием?** Каждый verdict имеет численный coverage % + top-5 risks список. Без обоснования = анти-паттерн A4.

✅ **CHECK 4: GAP-LIST конкретен?** Каждый gap имеет file:line + rule violated + severity + recommendation. Без этого = пустой gp.

✅ **CHECK 5: ТЗ-0000 применён?** AUDITOR прошёл 6 фаз closure? CLOSURE-REPORT.md создан? 🔒 FINALIZED block в начале ТЗП-001? Если ❌ хоть один — PO не выключит.

✅ **CHECK 6: PSL-NNN в PROJECT-STATE-LOG?** Без PSL — событие не зафиксировано.

---

## 6. Связанные документы

- [`99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md`](../99_Справочники/TASKS/ТЗП-001-INTEGRITY-OVERSIGHT.md) — **главная спецификация** (1100 строк).
- [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](../99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md) — **закрытие твоей работы** (900 строк, ОБЯЗАТЕЛЕН).
- [`99_Справочники/INTEGRATION-PLAN.md`](../99_Справочники/INTEGRATION-PLAN.md) — §6.2 триггер-селектор.
- [`99_Справочники/CHECKLIST.md` §12.5](../../CHECKLIST.md) — индекс integration-плана.
- [`AGENT-METHOD.md` §5.6](../../AGENT-METHOD.md) — IN-WORK / PRE-ACTION / POST-ACTION протокол.
- [`AGENT-REVIEW.md`](../../AGENT-REVIEW.md) — чек-лист самопроверки + hard limits.
- [`PROJECT-STATE-LOG.md`](../../PROJECT-STATE-LOG.md) — сюда пишется PSL-018 после аудита.

---

## 7. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание пакета. **Готов к первому запуску AUDITOR после ≥3 завершённых ТЗ.** Mirror структура LAUNCH-ARCHITECT/LAUNCH-ANALYST (7 разделов). READ-only роль. Привязка к ТЗП-001 + ТЗ-0000 + INTEGRATION-PLAN + CHECKLIST §12.5. 3 trigger режима (Full/Partial Tier-1/Hot-fix) согласно INTEGRATION-PLAN §6.2. Verdict binding в §2 с 🛑 блокирующей authority. ТЗ-0000 обязательно применить к себе. |
