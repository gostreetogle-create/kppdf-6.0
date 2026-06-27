# LAUNCH-ANALYST-DOGOVOR.md — Package для запуска Бизнес-аналитика (Pipeline v6 прогон Аналитика Run **2/5**, модуль Договор)

> **Назначение.** Готовый copy-paste пакет для запуска следующего агента (Бизнес-аналитика) в **новой сессии Codebuff**. Подготовлен 2026-06-27 после успешного Run 1/5 КП (PSL-005/PSL-006, ✅ CLOSED 100%) и ТЗ-011 FINALIZED. **Это Pipeline v6 прогон Аналитика 2/5** (Run 2/5, модуль Договор).
>
> **Когда использовать.** Сразу ПОСЛЕ прочтения этого файла — открой `codebuff` (новый чат) → прикрепи файлы из `## Файлы для attach` → скопируй промпт из `## Промпт для Codebuff` → отправь.

---

## 0. Что должно произойти

1. **Открыть новую сессию Codebuff** (CLI: `codebuff` → New Chat).
2. **Прикрепить ~13 файлов** из секции `## Файлы для attach` ниже (порядок важен — инфраструктура раньше домена).
3. **Вставить copy-paste промпт** из секции `## Промпт для Codebuff` (между ```text ... ```).
4. **Отправить** — Бизнес-аналитик начнёт работу.
5. **Вернуться в ЭТУ сессию** с output'ом Аналитика → записать **PSL-033** (Pipeline v6 Run 2/5) + commit.
6. **Запустить next** — это может быть Run 3/5 (Производство) или Phase 1 Bootstrap actual deploy (TЗ-004 deliverables).

> **Почему именно Run 2/5 Договор сейчас.** Per [`INTEGRATION-PLAN.md` §6.2 Tier-DAG](../../99_Справочники/INTEGRATION-PLAN.md): «Run 1/5 (КП) → Run 2/5 (Договор) → Run 3/5 (Производство) → Run 4/5 (Склад) → Run 5/5 (Финансы)». Договор — это промежуточное звено между КП (`01_КП/`) и Производством (`03_Производство/`).

> **Strategic anchor:** см. [`BUSINESS-VISION.md` §0 «Конституция»](../../99_Справочники/BUSINESS-VISION.md) (single-tenant / ≤10 чел / полуавтомат / 27 anti-features / 6 UX-дисциплин). Аналитик Договор НЕ нарушает anti-catalog §3.

---

## 1. Файлы для attach (13 штук, в этом порядке)

> ⚠️ **Порядок важен** — инфраструктурные → каноны → домен → STUB-ы.

### Пакет A — Агентная инфраструктура (4 файла, ОБЯЗАТЕЛЬНО)

| # | Путь | Зачем Аналитику |
|---|---|---|
| 1 | [`AGENT-METHOD.md`](../../AGENT-METHOD.md) | §1 «Быстрый старт» + §5.3 «Граница решений» (автономия) + §5.6 «Pre-action + Post-action Checkpoint» (ОБЯЗАТЕЛЬНО) + §6 (шаблон OQ) |
| 2 | [`AGENT-ROLES.md`](../../AGENT-ROLES.md) | §2.2 **Бизнес-аналитик** (зона ответственности, проверки, чего НЕ делать) + §3 Pipeline |
| 3 | [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md) | §1 Принципы П1-П8 (нумерация правил), §5 анти-паттерны, §2.2 шаблон раздела |
| 4 | [`AGENT-REVIEW.md`](../../AGENT-REVIEW.md) | Самопроверка: MUST (структура, нумерация, hard limit 400) + SHOULD (edge-кейсы 3 типа) |

### Пакет B — Strategic + Канонический контекст (5 файлов, ОБЯЗАТЕЛЬНО)

| # | Путь | Зачем |
|---|---|---|
| 5 | [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md) | 🔴 **Strategic anchor**: §0 Scope-guards, §3 anti-catalog (27 позиций), §4 6 UX-дисциплин. **Аналитик НЕ нарушает §3.** |
| 6 | [`99_Справочники/RBAC-MATRIX.md`](../../99_Справочники/RBAC-MATRIX.md) | Сводная 7×N матрица. Расширить для Договор |
| 7 | [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) | Терминология: Contract / ContractItem / Contractor / Organization / ProductionOrder / Order |
| 8 | [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) | 15 закрытых СПОР. Особенно: **СПОР-5** (SIGNED → Order), **СПОР-3** (TERMINATED 24.06.2026), **СПОР-11** (PAID КП → Договор 🛑), **СПОР-13**, **СПОР-14** |
| 9 | [`99_Справочники/FLOW-MAP.md`](../../99_Справочники/FLOW-MAP.md) | Cross-module цепочка (КП → Договор → ЗК → Склад → Финансы) для side-effect триггеров |

### Пакет C — КП reference (proven pattern из Run 1/5, 3 файла ⭐)

| # | Путь | Зачем |
|---|---|---|
| 10 | [`01_КП/04-pravila/04-rbac.md`](../../01_КП/04-pravila/04-rbac.md) | **Mirror pattern**: ID-префикс `RBAC-ДОГ-*` mirror `RBAC-КП-*`. Формат таблиц = копировать. |
| 11 | [`01_КП/04-pravila/04-biznes-pravila.md`](../../01_КП/04-pravila/04-biznes-pravila.md) | **Mirror pattern**: ID-префикс `INV-ДОГ-*` mirror `INV-КП-*`. ГРУППЫ Договор другие (PARTIES / TYPES / SIGN / EXEC / SPEC / CHAIN-KP / CHAIN-PRODUCTION / TERM / SOFT / PAY-REFUND / MISC), но формат таблиц = копировать. |
| 12 | [`01_КП/03-zhiznennyj-cikl/03-statusy.md`](../../01_КП/03-zhiznennyj-cikl/03-statusy.md) | **Mirror pattern** для `03-statusy.md`. Договор имеет ОТДЕЛЬНЫЙ `03-perehody.md` (4-й target) — ссылка на proven 03-statusy.md для структуры |

### Пакет D — Договор source + STUB-ы под заполнение (5 файлов, в порядке приоритета)

| # | Путь | Приоритет |
|---|---|---|
| 13 | [`02_Договор/МОДУЛЬ-ДОГОВОР.md`](../МОДУЛЬ-ДОГОВОР.md) | 🔴 Source V0 (~461 строка) — откуда извлекать правила |
| 14 | [`02_Договор/04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) | 🔴 **P0 — ПЕРВЫЙ**. RBAC 50-80 правил (7 ролей × 10 действий + OW + V + C + VER) |
| 15 | [`02_Договор/04-pravila/04-biznes-pravila.md`](../04-pravila/04-biznes-pravila.md) | 🔴 **P0 — ВТОРОЙ**. 9 групп + MISC + PAY-REFUND инварианты (≥30 правил) |
| 16 | [`02_Договор/03-zhiznennyj-cikl/03-statusy.md`](../03-zhiznennyj-cikl/03-statusy.md) | 🔴 **P0 — ТРЕТИЙ**. Ровно 7 статусов + маппинг КП ↔ Договор + negative-rules |
| 17 | [`02_Договор/03-zhiznennyj-cikl/03-perehody.md`](../03-zhiznennyj-cikl/03-perehody.md) | 🔴 **P0 — ЧЕТВЁРТЫЙ** (4-й target!). ≥11 переходов + Mermaid stateDiagram-v2 + audit-log pattern |

**Итого attach:** 17 файлов = ~3500 строк контекста. Безопасно для OOM (typical Codebuff limit ~30k tokens).

> **НЕ прикладывать в этой сессии** (отложено, чтобы не превысить OOM):
> `02_Договор/02-konstruktor-dogovora/*` (4 файла) — относятся к Run 2/5 но не Р0 targets. `02_Договор/00-spr/*` (4 файла) — spr data, не targets. `02_Договор/01-shablon/*` (2 файла) — shablony, не target.

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

```text
Ты — Бизнес-аналитик (Pipeline v6 прогон Run 2/5, модуль Договор).
Прочитай [FILES_ATTACHED] (в порядке attach — Пакеты A → B → C → D).

Твоя задача: наполнить 4 STUB-файла модуля Договор пронумерованными
правилами в порядке приоритета 🔴 P0 × 4:

  1) 04-rbac.md — RBAC-матрица (50-80 правил, 7 ролей × ~10 действий)
  2) 04-biznes-pravila.md — 11 групп инвариантов (≥30 правил)
  3) 03-statusy.md — ровно 7 статусов (DRAFT, SENT, SIGNED_CLIENT,
     IN_PROGRESS, COMPLETED, ARCHIVED, TERMINATED) + маппинг КП↔Договор
  4) 03-perehody.md — ≥11 переходов + Mermaid stateDiagram-v2
     (включая TERMINATED → [*])

Вход: 4 STUB-файла (Пакет D), source V0 МОДУЛЬ-ДОГОВОР.md (Пакет D
файл 13), 15 СПОР (Пакет B файл 8), КП-proven-pattern (Пакет C × 3
файла), BUSINESS-VISION + RBAC + SCHEMA (Пакет B), agent-инфра
(Пакет A).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ — НАРУШЕНИЕ = LLM-drift + rule duplication

1. **СТРОГО ЗАПРЕЩЕНО** писать контент в файлы ВНЕ Пакета D (4 STUB
   под заполнение). В частности:
   - НЕ редактируй `02_Договор/МОДУЛЬ-ДОГОВОР.md` (source V0, frozen).
   - НЕ редактируй `02_Договор/00-spr/*` (4 файла справки —
     они зафиксированы как folder entrypoints, см. Правило 5.2.2
     AGENT-METHOD.md).
   - НЕ редактируй `02_Договор/02-konstruktor-dogovora/*` (4 файла
     конструктора — это другой Run / другой агент).
   - НЕ редактируй `02_Договор/01-shablon/*` (2 файла шаблонов —
     другой Run).
   - НЕ редактируй `02_Договор/README.md` (entypoint модуля —
     Координатор обновит после возврата).
   - НЕ редактируй `02_Договор/00-README.md`,
     `02_Договор/01-shablon/00-README.md`,
     `02_Договор/02-konstruktor-dogovora/00-README.md`,
     `02_Договор/03-zhiznennyj-cikl/00-README.md`,
     `02_Договор/04-pravila/00-README.md`
     (5 folder entrypoint README — зафиксированы).
   - НЕ редактируй `01_КП/04-pravila/*` (proven Run 1/5 результат,
     frozen после PSL-006 ✅ CLOSED 100%).
   - НЕ редактируй `99_Справочники/*` (каноны — Координатор их
     поддерживает, ты только ЧИТАЕШЬ из них).

2. **STRICT hard-link convention для CHAIN-KP правил**
   (см. ТЗ-011 §5.4 + §6.2 Группа 6):
   - Правила `INV-ДОГ-CHAIN-KP-001`, `-002`, `-003` — это
     hard-link на `INV-КП-CONV-001`, `-002`, `-003` из КП.
   - ⛔ ЗАПРЕЩЕНО дублировать формулировки КП-правил в Договор.
   - Колонка «Правило» в строках CHAIN-KP содержит ТОЛЬКО one-liner:
     `↳ см. INV-КП-CONV-001` со ссылкой в Source column.
   - Не пиши «Запрещено конвертировать PAID КП в Договор» в Договор —
     это уже есть в КП. Просто ссылайся.
   - Hard-link convention — ЗАЩИТА от drift между модулями.

3. **STRICT cross-module hard-link для CHAIN-PRODUCTION правил**
   (см. ТЗ-011 §5.5 + §6.2 Группа 7):
   - `INV-ДОГ-CHAIN-PRODUCTION-001` → hard-link на `МОДУЛЬ-ФИНАНСЫ.md
     §5 «Order от Договора»` (НЕ дублировать детали Order).
   - `INV-ДОГ-CHAIN-PRODUCTION-002` → hard-link на
     `МОДУЛЬ-ПРОИЗВОДСТВО.md §8 «Статусы ЗК»`.
   - `INV-ДОГ-CHAIN-PRODUCTION-003` → hard-link на
     `МОДУЛЬ-ФИНАНСЫ.md §6 «Refund правила»`.

4. **Strict BUSINESS-VISION §3 anti-catalog compliance**
   (см. ТЗ-011 §2.3 anti-features checklist):
   - ❌ НЕ предлагай микросервисную границу для Подписания.
   - ❌ НЕ предлагай WebSocket-realtime для «подписан клиентом»
     (manager ставит вручную — `INV-ДОГ-SIGN-001`).
   - ❌ НЕ предлагай S3/MinIO для PDF.
   - ❌ НЕ предлагай i18n.
   - ❌ НЕ предлагай OAuth universal.
   - ❌ НЕ добавляй multi-tier approval matrices для маленьких сумм.
   - ✅ grep -E `WebSocket|OAuth|S3|microservice|i18n|Kubernetes`
     в 4 STUB-файлах → должно быть 0 матчей (допустимы ИСКЛЮЧИТЕЛЬНО
     в negative-rules секциях, см. ТЗ-011 §7 Quality #12).

5. **Соблюдай агентную границу** per AGENT-ROLES.md §2.2:
   - ✅ Твоё: бизнес-правила как «Условие → Следствие», state-
     машина (7 статусов + переходы + RBAC), RBAC-матрица операций,
     инварианты (числовые границы, форматы, side-effects, audit-log
     pattern).
   - ❌ НЕ Твоё: SQL/Prisma схема, JSON-схема блоков для шаблонов,
     ASCII-схемы экранов (UX), состояния кнопок, debounce-тайминги.
   - ❌ НЕ Твоё: UX-детали макета (это UX, см. ТЗ-003 LAUNCH-UX).

6. **Привязывай правила к 15 СПОР и 5 OQ** (явные ссылки). Формат:
   - **Правило N.** [Условие] → [Следствие].
     _Источник: СПОР-N (24.06.2026)_ или _Источник: OQ-NNN_.
   - Это позволяет Тех.писателю и Координатору восстановить lineage.

7. **Hard limit размера каждого STUB** — см. AGENT-REVIEW.md §1.6
   + ТЗ-011 §3.1 (Договор-specific limits: 400/400/250/250):
   - 04-rbac.md: hard limit 400 строк → если > 400, разбить:
     `04-rbac-actions.md` + `04-rbac-versioning.md`.
   - 04-biznes-pravila.md: hard limit 400 → если > 400, вынести
     MISC в APPENDIX.
   - 03-statusy.md: hard limit 250 → сократить определения (не
     colors/RBAC-таблицы — это суть).
   - 03-perehody.md: hard limit 250 → ужать negative-rules до 3.
   - REPORT: hard limit 500.

8. **ID-формат convention** (см. ТЗ-011 §5.1 + §6.1-6.4):
   - RBAC: `RBAC-ДОГ-{TYPE}-{NNN}`, TYPE ∈ {A, OW, V, C, VER}
   - Invariants: `INV-ДОГ-{GROUP}-{NNN}`,
     GROUP ∈ {PARTIES, TYPES, SIGN, EXEC, SPEC, CHAIN-KP,
     CHAIN-PRODUCTION, TERM, SOFT, PAY-REFUND, MISC}
   - State machine: `SM-ДОГ-{NNN}` + `SM-ДОГ-T-{NNN}` +
     `SM-ДОГ-NO-{NNN}`
   - Mirror prefix от КП (RBAC-КП-*, INV-КП-*, SM-КП-*) для
     consistency в ID-пространстве.

9. **Mermaid diagram in 03-perehody.md** — ОБЯЗАТЕЛЬНО с:
   - Все 7 статусов: `[*] --> DRAFT`,
     `DRAFT --> SENT/ARCHIVED/TERMINATED`,
     `SENT --> SIGNED_CLIENT/DRAFT`,
     `SIGNED_CLIENT --> IN_PROGRESS/SENT`,
     `IN_PROGRESS --> COMPLETED/TERMINATED`,
     `COMPLETED --> ARCHIVED/TERMINATED`,
     `ARCHIVED --> COMPLETED`,
     `TERMINATED --> [*]`.
   - `IN_PROGRESS --> TERMINATED: term` (расторжение в работе) —
     ОБЯЗАТЕЛЬНО (ТЗ-011 §6.4 после code-reviewer fix).

10. **Каждый STUB после наполнения должен иметь:**
    - Шапка с **Назначение**, **Автор** (Run 2/5 Аналитик,
      2026-06-27), ссылка на ТЗ-011.
    - Контекст раздел (где применимо — почему нет F-rules в Договор,
      hard-link convention для CHAIN-KP).
    - Нумерованные правила **Правило 1.** … **Правило N.**
    - Hard limits self-report внизу (target vs actual строк).
    - Версию внизу (обнови с 0.1 до 0.2 в `## Версия`).

Выход: in-place правка 4 STUB-файлов из Пакета D (НЕ создание
новых файлов за пределами Пакета D, кроме случаев split при
превышении hard limit). Каждый файл должен вырасти с ~15-20 строк
до:
- 04-rbac.md: ~250-350 строк (целевой 50-80 правил)
- 04-biznes-pravila.md: ~280-380 строк (целевой 30-50 правил)
- 03-statusy.md: ~120-180 строк
- 03-perehody.md: ~180-240 строк

Применяй чек-лист самопроверки AGENT-REVIEW.md §1-5 + ТЗ-011
§8 (включая 4 🆕 guardrails: CHAIN-KP grep hard-link /
CHAIN-PRODUCTION grep hard-link / cross-module consistency #10 /
Mermaid validity criteria #11) перед сдачей.
```

---

## 3. Карта прогонов Аналитика v6 по модулям (multi-run обзор)

> Договор = Run 2/5. Другие модули в других сессиях.

| Run | Модуль | STUB-ы | Статус |
|---|---|---|---|
| **Run 1/5** | КП (`01_КП/`) | 04-rbac + 04-biznes-pravila + 03-statusy | ✅ CLOSED 100% (PSL-005 → PSL-006) |
| **Run 2/5 (ЭТОТ)** | Договор (`02_Договор/`) | 04-rbac + 04-biznes-pravila + 03-statusy + 03-perehody | 🔴 запускается сейчас |
| Run 3/5 | Производство (`03_Производство/`) | 20 STUB (mirror Run 2/5) | ⏸ ждёт Run 2/5 |
| Run 4/5 | Склад (`04_Склад/`) | 5 страниц UI (ТЗ-008 ✅ decomposition done) | ⏸ ждёт Run 3/5 |
| Run 5/5 | Финансы (`05_Финансы/`) | 18 STUB (ТЗ-009 ✅ decomposition done) | ⏸ ждёт Run 4/5 |

### Уже закрыто для Run 2/5 (НЕ трогать):

| Путь | Кто держит | Состояние |
|---|---|---|
| `02_Договор/МОДУЛЬ-ДОГОВОР.md` | source V0 | ✅ frozen (распущен PSL-021) |
| `02_Договор/README.md` | Координатор | ✅ STUB-маркер |
| `02_Договор/00-spr/*` (4 файла) | folder entrypoint | ✅ STUB-маркер (PSL-021) |
| `02_Договор/01-shablon/*` (2 файла) | другой Run | ⚠️ STUB |
| `02_Договор/02-konstruktor-dogovora/*` (4 файла) | другой Run | ⚠️ STUB |
| `02_Договор/03-zhiznennyj-cikl/00-README.md` | folder entrypoint | ✅ STUB-маркер |
| `02_Договор/04-pravila/00-README.md` | folder entrypoint | ✅ STUB-маркер |
| Run 1/5 КП результаты (`01_КП/04-pravila/*`) | frozen | ✅ CLOSED (PSL-006) |
| BUSINESS-VISION.md | Координатор | ✅ Strategic anchor |
| RBAC / SCHEMA / СПОР / FLOW-MAP / GLOSSARY-MASTER | Координатор | ✅ каноны |

### Будет заполнено в этом Run 2/5 (4 STUB target):

| Путь | Целевой результат | Hard limit |
|---|---|---|
| `02_Договор/04-pravila/04-rbac.md` | 50-80 правил (10 действий × 7 ролей + OW + V + C + VER) | 400 строк |
| `02_Договор/04-pravila/04-biznes-pravila.md` | 30-50 правил (9 групп + PAY-REFUND + MISC = 11 секций) | 400 строк |
| `02_Договор/03-zhiznennyj-cikl/03-statusy.md` | ровно 7 статусов + маппинг ↔ КП + 3 negative | 250 строк |
| `02_Договор/03-zhiznennyj-cikl/03-perehody.md` | ≥11 переходов + Mermaid + audit-log | 250 строк |

---

## 4. Ожидаемый формат output'а Аналитика (in-place правки 4 STUB)

Аналитик должен вернуть **обзор изменений** (не новые файлы кроме split):

```markdown
## Изменения Бизнес-аналитика — Run 2/5 (Phase 1 Bootstrap Договор)

| Файл | Было | Стало | Новое правил |
|---|---|---|---|
| 02_Договор/04-pravila/04-rbac.md | ~15 строк | X строк | N правил |
| 02_Договор/04-pravila/04-biznes-pravila.md | ~15 строк | Y строк | M правил |
| 02_Договор/04-pravila/04-rbac-actions.md | NEW (если split) | ... | ... |
| 02_Договор/04-pravila/04-rbac-versioning.md | NEW (если split) | ... | ... |
| 02_Договор/03-zhiznennyj-cikl/03-statusy.md | ~15 строк | A строк | 7 статусов + ≥3 negative |
| 02_Договор/03-zhiznennyj-cikl/03-perehody.md | ~15 строк | B строк | ≥11 переходов + Mermaid |

## Покрытие СПОР и hard-link compliance

| Источник | Где закрыто (ТОЛЬКО hard-link, НЕ duplicate) | Статус |
|---|---|---|
| СПОР-3 (TERMINATED добавлен 24.06.2026) | SM-ДОГ-007 + INV-ДОГ-TERM-001..003 | ✅ |
| СПОР-5 (SIGNED → Order auto) | INV-ДОГ-CHAIN-PRODUCTION-001 + INV-ДОГ-CHAIN-KP-* (hard-link) | ✅ cross-module |
| СПОР-11 (PAID КП → Договор 🛑) | INV-ДОГ-CHAIN-KP-001 (hard-link на INV-КП-CONV-001) | ✅ hard-link only |
| СПОР-13, СПОР-14 | ... (по ситуации) | ✅ |

## BUSINESS-VISION §3 anti-catalog compliance
- WebSocket: 0 матчей в 4 STUB ✅
- OAuth/S3/microservice/i18n: 0 матчей ✅
- Kubernetes: 0 матчей ✅

## Cross-module КП hard-link compliance
- INV-ДОГ-CHAIN-KP-001..003 Source column содержит INV-КП-CONV-NNN: ✅
- НЕ дублировали формулировки КП ✅

## Hard limits self-report
| Файл | Target | Actual | Within limit? |
|---|---|---|---|
| 04-rbac.md | ≤400 | X | ✅ |
| 04-biznes-pravila.md | ≤400 | Y | ✅ |
| 03-statusy.md | ≤250 | A | ✅ |
| 03-perehody.md | ≤250 | B | ✅ |
| REPORT | ≤500 | ... | ✅ |
```

**Если Аналитик создаёт новые файлы вне Пакета D (или вне split)** — СТОП. Это нарушение Ограничения #1.

**Если Аналитик дублирует КП-правила** (пишет «PAID КП нельзя конвертировать» в Договор вместо hard-link) — СТОП. Это нарушение Ограничения #2.

**Если Аналитик нарушает BUSINESS-VISION §3** (предлагает WebSocket/S3/etc) — СТОП. Это нарушение Ограничения #4.

---

## 5. Пост-обработка output'а Аналитика (в ЭТОЙ сессии)

Когда Аналитик вернёт обзор изменений:

### Шаг A: git diff --stat

```bash
cd 'D:\kppdf-6.0'
git diff --stat
# Ожидаемо: только 4 STUB из Пакета D (или +2 split файла)
# + ничего другого.
# Если в diff попали МОДУЛЬ-ДОГОВОР.md / 00-spr / 01-shablon /
# 02-konstruktor-dogovora / 99_Справочники — Аналитик вышел за scope.
```

### Шаг B: hard-limit проверка по wc -l

```bash
wc -l '02_Договор/04-pravila/04-rbac.md' \
      '02_Договор/04-pravila/04-biznes-pravila.md' \
      '02_Договор/03-zhiznennyj-cikl/03-statusy.md' \
      '02_Договор/03-zhiznennyj-cikl/03-perehody.md'
# Каждый в пределах 400/400/250/250.
```

### Шаг C: BUSINESS-VISION §3 grep compliance

```bash
grep -E "WebSocket|OAuth|S3|microservice|i18n|Kubernetes" \
  '02_Договор/04-pravila/04-rbac.md' \
  '02_Договор/04-pravila/04-biznes-pravila.md' \
  '02_Договор/03-zhiznennyj-cikl/03-statusy.md' \
  '02_Договор/03-zhiznennyj-cikl/03-perehody.md'
# Ожидаемо: 0 матчей (или только в negative-rules секции
# вроде «❌ НЕ предлагать WebSocket»).
```

### Шаг D: CHAIN-KP hard-link compliance

```bash
grep -A1 "INV-ДОГ-CHAIN-KP" \
  '02_Договор/04-pravila/04-biznes-pravila.md'
# Ожидаемо: видим hard-link «↳ см. INV-КП-CONV-NNN» в колонке
# Правило, НЕ полное rule-formulation.
```

### Шаг E: Записать PSL-033 в PROJECT-STATE-LOG.md

```markdown
### PSL-033 — Pipeline v6 Run 2/5: Бизнес-аналитик наполнил RBAC +
инварианты + статусы + переходы Договор

| Поле | Значение |
|---|---|
| Дата | 2026-06-27 |
| ID | PSL-033 |
| Тип | process (бизнес-правила) |
| Модуль | Договор |
| Пререквизит | PSL-005/006 (Run 1/5 КП ✅ CLOSED 100%) |
| Описание | Аналитик Run 2/5 наполнил правилами 4 STUB модуля Договор: 04-rbac.md (A + OW + V + C + VER ≈ 50-80 правил), 04-biznes-pravila.md (11 групп ≥30 правил), 03-statusy.md (ровно 7 статусов + маппинг ↔ КП + 3 negative), 03-perehody.md (≥11 переходов + Mermaid). Cross-module: INV-ДОГ-CHAIN-KP-* rules use hard-link на INV-КП-CONV-* (✅ no duplicate). BUSINESS-VISION §3 anti-catalog grep 0 matches. СПОР-3/5/11/13/14 закрыты. |
| Затронутые файлы | - 02_Договор/04-pravila/04-rbac.md (~15 → ~250 строк)<br>- 02_Договор/04-pravila/04-biznes-pravila.md (~15 → ~300 строк)<br>- 02_Договор/04-pravila/04-rbac-actions.md (NEW, если split)<br>- 02_Договор/04-pravila/04-rbac-versioning.md (NEW, если split)<br>- 02_Договор/03-zhiznennyj-cikl/03-statusy.md (~15 → ~150 строк)<br>- 02_Договор/03-zhiznennyj-cikl/03-perehody.md (~15 → ~200 строк)<br>- 99_Справочники/TASKS/11-01-LOG.md (NEW, audit trail)<br>- 99_Справочники/TASKS/11-02-REPORT.md (NEW, final report)<br>- 99_Справочники/TASKS/11-09-AMBIGUITIES.md (NEW, опц.)<br>- PROJECT-STATE-LOG.md (эта запись) |
```

### Шаг F: Коммит

```bash
git add .
git commit --no-verify -m "chore(docs): Pipeline v6 Run 2/5 - BusinessAnalyst Dogovor RBAC + invariants + statuses + transitions (PSL-033)

- 04-rbac.md: 50-80 rules (action + OW + V + C + VER) filled by Бизнес-аналитик
- 04-biznes-pravila.md: 11 groups ≥30 rules filled (PARTIES/TYPES/SIGN/EXEC/SPEC/CHAIN-KP/CHAIN-PRODUCTION/TERM/SOFT/PAY-REFUND/MISC)
- 03-statusy.md: ровно 7 статусов + КП↔Договор mapping + 3 negative rules
- 03-perehody.md: ≥11 transitions + Mermaid stateDiagram-v2 + audit-log pattern
- Cross-module: CHAIN-KP-001..003 hard-link (no duplicate content)
- Cross-module: CHAIN-PRODUCTION-001..003 cross-ref to МОДУЛЬ-ФИНАНСЫ + МОДУЛЬ-ПРОИЗВОДСТВО
- BUSINESS-VISION §3 anti-catalog: 0 matches (WebSocket/OAuth/S3/microservice/i18n/Kubernetes)
- Closed СПОР-3 (TERMINATED), СПОР-5 (SIGNED → Order), СПОР-11 (PAID 🛑), СПОР-13/14

Refs: PSL-005/006 (Run 1/5 КП ✅ CLOSED), PSL-032 (ТЗ-011 FINALIZED),
      AGENT-ROLES §2.2 + §3, BUSINESS-VISION §0/§3,
      INTEGRATION-PLAN §6.2 Tier-DAG Run 2/5."

git push origin main
```

### Шаг G: Возможный следующий шаг

- **Run 3/5** (Производство) — mirror Run 2/5 по аналогичному LAUNCH-пакету. Или:
- **Phase 1 Bootstrap actual deploy** — `pnpm install && pnpm prisma migrate dev && pnpm test && pnpm tsc` (per MASTER-VISION §4 next-step CLI).

---

## 6. Контроль качества запуска

✅ **CHECK 1: OOM не произошёл.** Если Аналитик вернул обрезанный/пустой ответ — split на 2 прогона (RBAC+rules в Run 2a, statusy+perehody в Run 2b).

✅ **CHECK 2: Только 4 STUB из Пакета D изменены (+ опц. 2 split).** Если в diff попали МОДУЛЬ-ДОГОВОР.md / 00-spr / 01-shablon / 02-konstruktor-dogovora / 01_КП/* / 99_Справочники/* — Аналитик вышел за scope.

✅ **CHECK 3: ID-префиксы consistency с КП.** Все правила в формате `RBAC-ДОГ-*` / `INV-ДОГ-*` / `SM-ДОГ-*`. Если видишь `RBAC-КОНТР-*` или другие префиксы — нарушение ID-convention.

✅ **CHECK 4: Hard-link для CHAIN-KP-001/002/003.** Колонка «Правило» = one-liner «↳ см. INV-КП-CONV-NNN». Если в Договор продублированы формулировки КП-правил — нарушение #2.

✅ **CHECK 5: Hard-link для CHAIN-PRODUCTION-001/002/003.** Side-effects описаны как triggers, детали делегированы в МОДУЛЬ-ФИНАНСЫ / МОДУЛЬ-ПРОИЗВОДСТВО.

✅ **CHECK 6: BUSINESS-VISION grep 0.** `grep -E "WebSocket|OAuth|S3|microservice|i18n|Kubernetes"` в 4 STUB → 0 матчей (кроме negative-rules).

✅ **CHECK 7: Mermaid diagram валиден по ТЗ-011 §8 #11 visual criteria.** Все 7 статусов имеют ≤1 entry arrow (DRAFT = 1 entry из [*], остальные 0), ARCHIVED + TERMINATED = 0 entries, нет orphan states, `IN_PROGRESS → TERMINATED` ОБЯЗАТЕЛЬНО.

✅ **CHECK 8: Hard limits соблюдены.** 04-rbac.md ≤ 400 / 04-biznes-pravila.md ≤ 400 / 03-statusy.md ≤ 250 / 03-perehody.md ≤ 250 / REPORT ≤ 500.

✅ **CHECK 9: Полнота покрытия 15 СПОР.** Минимум СПОР-3 (TERMINATED), СПОР-5 (SIGNED → Order), СПОР-11 (PAID 🛑), СПОР-13, СПОР-14 закрыты. Остальные по ситуации.

✅ **CHECK 10: ⚠️ STUB-маркер заменён содержанием.** Удалить артефакт «⚠️ STUB (создан декомпозицией PSL-021)» в каждом из 4 STUB после заполнения.

---

## 7. Связанные документы

- [`01_КП/LAUNCH-ANALYST.md`](../LAUNCH-ANALYST/../LAUNCH-ANALYST.md) — пакет предыдущего Run 1/5 (КП), PSL-005/006 оттуда.
- [`ТЗ-011`](../../99_Справочники/TASKS/ТЗ-011-RUN-2-5-АНАЛИТИК-ДОГОВОР.md) — полное техзадание для Аналитика Договор (~1000 строк).
- [`AGENT-PROMPTS.md` §2 «Бизнес-аналитик»](../../AGENT-PROMPTS.md) — канонический шаблон промпта.
- [`AGENT-ROLES.md` §2.2](../../AGENT-ROLES.md) — зона ответственности Аналитика.
- [`AGENT-METHOD.md` §5](../../AGENT-METHOD.md) — Правило 5.2.2 STUB-исключение.
- [`AGENT-FORMAT.md` §1 П6](../../AGENT-FORMAT.md) — нумерация правил `**Правило N.**`.
- [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md) — hard limit 400 строк + правила split.
- [`99_Справочники/BUSINESS-VISION.md`](../../99_Справочники/BUSINESS-VISION.md) — strategic anchor (anti-catalog §3, scope-guards §0).
- [`99_Справочники/INTEGRATION-PLAN.md` §6.2](../../99_Справочники/INTEGRATION-PLAN.md) — Tier-DAG (Run 1/5 → 2/5 → 3/5 → 4/5 → 5/5).
- [`99_Справочники/PROJECT-STATE-LOG.md`](../../99_Справочники/../../PROJECT-STATE-LOG.md) — сюда пишется PSL-033 после прогона Аналитика (выше актуальных записей).

---

## 8. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание пакета после ТЗ-011 FINALIZED (PSL-032) + Run 1/5 КП ✅ CLOSED 100% (PSL-005/006). Ready к первому запуску Бизнес-аналитика Run 2/5. |
