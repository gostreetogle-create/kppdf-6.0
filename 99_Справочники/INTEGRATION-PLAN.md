# INTEGRATION-PLAN.md — План интеграции результатов 6+1 параллельных агентов

> **Назначение.** Это главный **интеграционный** документ проекта KPPDF CRM v6. Содержит **порядок применения результатов** 6 рабочих ТЗ (ТЗ-001..006) и 1 надзорного (ТЗП-001) после их возврата от параллельных агентов. Определяет: **(1)** Tier-зависимости (что блокирует что); **(2)** Conflict resolution (когда результаты противоречат друг другу); **(3)** Failure modes (что делать если 1 агент провалится). Этот документ — road map для Буфера-архистратора после return'а всех агентов.
>
> **Объём:** ~500 строк (target) / 700 (hard limit per [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md)).
>
> **Когда использовать:** После возврата ≥3 результатов ТЗ (per CHECKLIST.md §12.5 индекс). Аудитор (ТЗП-001) может выдать ❌ BLOCKED → тогда обращаться к §7 этого документа для плана recovery.

---

## Оглавление

- **§0.** Контекст: что у нас есть на входе
- **§1.** Tier-зависимости (DAG применения результатов)
- **§2.** Tier 1 — критические блокеры (REGISTRY + Run 1/5 КП)
- **§3.** Tier 2 — параллельные методологии (DECISION-METHODOLOGY + METHODOLOGY-RETROFIT)
- **§4.** Tier 3 — UI спецификация (LAUNCH-UX)
- **§5.** Tier 4 — Phase 1 Bootstrap Prisma (код)
- **§6.** Tier 5 — Надзор (AUDITOR)
- **§7.** Conflict resolution — типичные конфликты
- **§8.** Failure modes — что делать если агент провалился
- **§9.** Final pipeline — оптимальный merge order
- **§10.** Acceptance criteria для каждой фазы

---

## §0. Контекст: что мы получаем на вход

### 0.1 Inputs (результаты 6+1 агентов)

| ТЗ | Что создаёт | Файл(ы) | Зависит от |
|---|---|---|---|
| **ТЗ-001** | `REGISTRY-OF-RULES.md` (~2500 строк) + 3 LOG/REPORT/AMBIGUITIES | `99_Справочники/REGISTRY-OF-RULES.md` + `99_Справочники/TASKS/01-LOG.md` + `02-REPORT.md` + `09-AMBIGUITIES.md` | — (независим) |
| **ТЗ-002** | 3 STUB КП: RBAC + biznes-pravila + statusy | `01_КП/04-pravila/04-rbac.md` + `04-biznes-pravila.md` + `01_КП/03-zhiznennyj-cikl/03-statusy.md` | ТЗ-001 (consistency правил) |
| **ТЗ-003** | `LAUNCH-UX.md` (~600 строк, UI pattern) | `01_КП/LAUNCH-UX.md` | LAUNCH-ARCHITECT.md (композиция страниц) |
| **ТЗ-004** | Phase 1 Bootstrap Prisma: schema + migrations + packages + Husky | `kppdf-6.0/prisma/schema.prisma` + 3 migrations + `package.json` | ТЗ-002 (RBAC правила нужны для схемы) |
| **ТЗ-005** | `DECISION-METHODOLOGY.md` (~800 строк) + scoring rubric канонизированный | `99_Справочники/DECISION-METHODOLOGY.md` | — (портируемый) |
| **ТЗ-006** | 53 scoring-блока + шаблон СПОРА в §0 | `99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md` + `99_Справочники/OPEN-QUESTIONS-MASTER.md` | ТЗ-005 (использует rubric) |
| **ТЗП-001** | AUDIT-REPORT + GAP-LIST + BLOCKING-ISSUES + 02-REPORT-CHANGES | `99_Справочники/TASKS/AUDIT-REPORT.md` + `GAP-LIST.md` + `BLOCKING-ISSUES.md` + `02-REPORT-CHANGES.md` | Все 6 выше (проверяет их результаты) |

### 0.2 Outputs (что мы хотим получить на выходе)

| Цель | Артефакт |
|---|---|
| Phase 1 Bootstrap Prisma готов | `kppdf-6.0` repo с schema + миграциями + 88 baseline Vitest проходят |
| Phase 2 Mantine UI готов спецификация | `LAUNCH-UX.md` + RBAC правила из `04-rbac.md` |
| Методология полностью канонизирована | `DECISION-METHODOLOGY.md` работает на практике |
| Защита от drift через audit | `AUDIT-REPORT.md` позволяет стартовать Phase 2 |

### 0.3 DAG (граф зависимостей)

```
        [ТЗ-005 DECISION-METHOD]
                ↓
[ТЗ-001 REGISTRY] → [ТЗ-002 Run 1/5] → [ТЗ-004 Bootstrap Prisma]
        ↓              ↓
   (consistency)   (consistency)
                           ↓
                [ТЗ-003 LAUNCH-UX]
                           ↓
              (все 6 результатов)
                           ↓
              [ТЗ-006 METHODOLOGY-RETROFIT]
                           ↓
                 [ТЗП-001 AUDITOR]
                           ↓
              ❌ BLOCKED OR ✅ PASS
                           ↓
                  Phase 1 Bootstrap / Phase 2 UI
```

---

## §1. Tier-зависимости

| Tier | Что входит | Когда применять результаты | Блокирует что |
|---|---|---|---|
| **T1** | ТЗ-001 + ТЗ-002 | Первыми (после возврата обоих) | Phase 1 Bootstrap Prisma |
| **T2** | ТЗ-005 + ТЗ-006 | После T1 (методология применяется к результатам T1) | AUDITOR |
| **T3** | ТЗ-003 | Параллельно с T2 (UI не зависит от методологии) | Phase 2 UI |
| **T4** | ТЗ-004 | После T1 + T2 (код требует правил + понимания rubric) | Phase 1 Bootstrap финал |
| **T5** | ТЗП-001 | ПОСЛЕ всех 6 результатов | Phase 1 Bootstrap / Phase 2 |

**Когда можно стартовать Phase 1 Bootstrap Prisma (код):** ТОЛЬКО после ✅ PASS от AUDITOR (или ⚠️ PASS-WITH-WARNINGS по решению PO).

**Когда можно стартовать Phase 2 Mantine UI:** ТОЛЬКО после ✅ PASS от AUDITOR + ТЗ-003 (LAUNCH-UX) создан.

---

## §2. Tier 1 — Критические блокеры (REGISTRY + Run 1/5 КП)

### 2.1 Зачем первыми

**ТЗ-001 REGISTRY** — канонический реестр правил по 5 модулям. Другие STUB'ы (ТЗ-002..006) ссылаются на эти правила через cross-ref. Если REGISTRY отсутствует → все cross-ref становятся `broken`.

**ТЗ-002 Run 1/5 КП** — базовые правила для модуля КП (RBAC + инварианты + state-машина). Phase 1 Bootstrap Prisma (ТЗ-004) требует эти правила для schema design.

### 2.2 Что проверять при возврате

| Проверка | Как | Если FAIL |
|---|---|---|
| REGISTRY ≥500 правил + ID формат `RULE-{MODULE}-{TYPE}-{NNN}` | grep + count | ❌ BLOCKED T1 |
| Каждый модуль (КП/Договор/Производство/Склад/Финансы) покрыт | grep section headers | ❌ BLOCKED если пусто |
| AMBIGUITIES.md отсутствует ИЛИ тривиальный | file_exists + size <100 строк = ✅ | ⚠️ WARN если >100 строк |
| `02-REPORT.md` имеет coverage matrix | regex match | ❌ BLOCKED T1 |
| Run 1/5 КП: 04-rbac.md ≥50 правил | wc -l + grep `RULE-КП-RBAC` | ❌ BLOCKED Run 1/5 |
| Run 1/5 КП: 04-biznes-pravila.md ≥30 правил | wc -l + grep `RULE-КП-INV` | ❌ BLOCKED Run 1/5 |
| Run 1/5 КП: 03-statusy.md содержит 8 статусов | grep для каждого имени | ❌ BLOCKED Run 1/5 |

### 2.3 Cross-ref между REGISTRY и Run 1/5

Если ТЗ-002 использует ID правил, которые ТЗ-001 не знает → ❌ BLOCKED.
Если ТЗ-001 не покрывает области, которые ТЗ-002 определяет → ⚠️ PASS-WITH-WARNINGS (STUB-зависимая область, доп. правила в Run 2/5).

**Конкретный пример:** REGISTRY определяет `RULE-КП-RBAC-007` (видимость поля price). Run 1/5 в `04-rbac.md` тоже ссылается на это правило. Консистентность проверяется по строке содержимого (хеш правила).

### 2.4 Что делать если T1 FAIL

| Failure | Recovery |
|---|---|
| REGISTRY coverage <80% | Запустить тот же ТЗ повторно с указанием missing модулей |
| Run 1/5 <50 правил | Запустить повторно с указанием missing групп |
| Cross-ref между ними сломан | Запустить Аналитика на 1-часовой reconciliation session |

---

## §3. Tier 2 — Параллельные методологии (DECISION-METHODOLOGY + METHODOLOGY-RETROFIT)

### 3.1 Зачем после T1

**ТЗ-005 DECISION-METHODOLOGY** — описывает 5 фаз процесса решения споров. Использует scoring rubric (§5). Канонизирует ПОДХОД решения.

**ТЗ-006 METHODOLOGY-RETROFIT** — применяет scoring rubric РЕТРОактивно к 53 существующим артефактам (15 СПОР + 38 Q). Зависит от ТЗ-005 (формулировка шкалы).

### 3.2 Что проверять при возврате

| Проверка | Как | Если FAIL |
|---|---|---|
| DECISION-METHODOLOGY существует + 5 фаз | grep headings | ❌ BLOCKED T2 |
| DECISION-METHODOLOGY имеет scoring rubric (5 критериев × 1-5) | grep `K1 Бизнес-ценность` etc. | ❌ BLOCKED T2 |
| METHODOLOGY-RETROFIT покрыл 53/53 артефакта | grep `## Scoring` count = 53 | ❌ BLOCKED если <53 |
| Override-banner'ы в шапках 2 изменённых файлов | grep `<!-- ⚠️ HARD LIMIT OVERRIDE` | ⚠️ PASS-WITH-WARNINGS |
| `02-REPORT-METHODOLOGY.md` с sanity-check | file_exists | ❌ BLOCKED |

### 3.3 Cross-ref между T2 и T1

**DECISION-METHODOLOGY может cross-ref правила из REGISTRY** (например «см. REGISTRY §3 валидации»). Если cross-ref сломан → ⚠️ WARNING.

**METHODOLOGY-RETROFIT применяет rubric из DECISION-METHODOLOGY** — если scoring в RETROFIT отличается от DECISION-METHODOLOGY шкалы → ❌ BLOCKED.

### 3.4 Конфликт: scoring противоречит существующему решению СПОР/Q

**Пример:** СПОР-7 имеет решение "X". Scoring-блок показывает K3 Риски=5 (катастрофический риск). Парадокс: решение X принято, но риск высокий.

**Resolution:** см. §7.4.

### 3.5 Что делать если T2 FAIL

| Failure | Recovery |
|---|---|
| DECISION-METHODOLOGY неполон | Запустить повторно (это документ, не правила) |
| METHODOLOGY-RETROFIT coverage <53 | Подсчитать gaps; запустить повторно с указанием missing IDs |
| Scoring rubric расходится между ТЗ-005 и ТЗ-006 | Запустить reconciler (буфер-архистратор, 30 мин) |

---

## §4. Tier 3 — UI спецификация (LAUNCH-UX)

### 4.1 Зачем после T1+T2

**ТЗ-003 LAUNCH-UX** — спецификация UI pattern (3-зон макет + 30 компонентов). Зависит от T1 (правила RBAC КП + state-машина для UI behavior) и от T2 (любая методология касательно UX из DECISION-METHODOLOGY).

### 4.2 Что проверять при возврате

| Проверка | Как | Если FAIL |
|---|---|---|
| LAUNCH-UX.md существует + ~600 строк | file_exists + wc -l | ❌ BLOCKED T3 |
| Все 4 UX-принципа из AGENT-METHOD §5.4 присутствуют | grep для каждого принципа | ❌ BLOCKED T3 |
| 3-зон макет описан (left/center/right) | grep "левая зона\|центральная\|правая" | ❌ BLOCKED |
| ≥30 компонентов | grep для паттерна `## Компонент N` или аналог | ❌ BLOCKED если <30 |
| Karkas-Kit согласован с UX-принципами | manual spot-check | ⚠️ WARN |

### 4.3 Cross-ref между T3 и T1/T2

**LAUNCH-UX использует RBAC правила из ТЗ-002.** Если меняется правило RBAC → нужно обновить LAUNCH-UX. **Решение:** Phase 2 UI стартует ТОЛЬКО после стабилизации RBAC (т.е. после Run 2/3/4/5).

**LAUNCH-UX cross-ref DECISION-METHODOLOGY для UX-принципов.** Если DECISION-METHODOLOGY говорит одно, LAUNCH-UX говорит другое → ❌ BLOCKED.

### 4.4 Что делать если T3 FAIL

| Failure | Recovery |
|---|---|
| <30 компонентов | Добавить недостающие компоненты (UX-дизайнер повторно) |
| Не учитываются UX-принципы | Запустить UX-дизайнер повторно с явным указанием принципов |

---

## §5. Tier 4 — Phase 1 Bootstrap Prisma (код)

### 5.1 Зачем после T1 + T2

**ТЗ-004 Phase 1 Bootstrap Prisma** — создаёт реальный код (schema.prisma, 3 миграции, package.json с новыми пакетами, .husky/ gates). Требует:
- T1 стабилизации (правила RBAC → поля schema)
- T2 стабилизации (понимание 3 миграций правок A/E/F)
- T3 (LAUNCH-UX) — wait, нужен ли? Да, для будущих UI Routes, но не для Phase 1 Bootstrap. Runtime: Phase 1 Bootstrap может идти параллельно с T3.

### 5.2 Что проверять при возврате

| Проверка | Как | Если FAIL |
|---|---|---|
| `kppdf-6.0/prisma/schema.prisma` существует | file_exists | ❌ BLOCKED T4 |
| Schema покрывает 32 сущности из `SCHEMA-CONSOLIDATED.md` | grep entity_name count | ❌ BLOCKED если <32 |
| 3 миграции (правки A/E/F) созданы | ls migrations | ❌ BLOCKED если <3 |
| `package.json` содержит 4 production пакета (TanStack Query / RHF / sharp / другие из СТЕК-ПРЕДПИСАНИЕ.md) | grep names | ❌ BLOCKED если <4 |
| `.husky/pre-commit` + `.husky/commit-msg` существуют | file_exists | ⚠️ PASS-WITH-WARNINGS если отсутствует |
| 88 Vitest baseline проходят | `pnpm test` result | ❌ BLOCKED T4 |
| `tsc --noEmit` чисто | `pnpm tsc` result | ❌ BLOCKED T4 |

### 5.3 Cross-ref между схемой и правилами

**Самое важное:** schema.prisma должна соответствовать правилам в REGISTRY. Если правило говорит «поле price видимо только менеджеру», а schema делает его с декоратором `@hidden` для всех → ❌ BLOCKED.

**Конкретный пример:** REGISTRY §7 Cross-Module Triggers: «При смене статуса КП.DRAFT→SENT автосоздаётся ProductionOrder». Schema должна иметь trigger (или `Application Logic` в `Prisma` 5+). Если отсутствует → ❌ BLOCKED.

### 5.4 Что делать если T4 FAIL

| Failure | Recovery |
|---|---|
| Меньше 32 сущностей | Добавить недостающие entity (Моделировщик повторно) |
| Миграции неправильные | Откатить миграцию, исправить и reapply |
| Husky gates не работают | Переустановить husky, проверить `pnpm prepare` |
| 88 baseline Vitest упал | Не стартовать — fix regressions в первую очередь |

### 5.5 Применение к `kppdf-5.0` baseline

Phase 1 Bootstrap Prisma НЕ создаётся в v6-docs-only repo. Он создаётся в **отдельном `kppdf-6.0` repo** (clone из `kppdf-5.0`). Это вне scope Буфера — Моделировщик/PR-агент делает это.

---

## §6. Tier 5 — Надзор (AUDITOR)

### 6.1 Зачем после всех 6

**ТЗП-001 AUDITOR** — проверяет ЦЕЛОСТНОСТЬ всех 6 результатов. **Блокирующая authority**: ❌ BLOCKED → Phase 1 Bootstrap Prisma / Phase 2 UI не стартуют. Запуск ПОСЛЕ ≥3 ТЗ (можно частичный аудит).

### 6.2 Триггеры AUDITOR

| Триггер | Условие | Что проверит |
|---|---|---|
| Полный аудит | После ВСЕХ 6 ТЗ | 12 static + 7 semantic = 19 проверок |
| Частичный Tier-1 | После ТЗ-001 + ТЗ-002 (минимум) | Только critical P0: hard limits + cross-refs + ID conflicts |
| Hot-fix | ❌ BLOCKED от предыдущего аудита + fix готов | Только GAP-LIST reconciliation |

### 6.3 Verdict logic

| Verdict | Что означает | Что делать PO |
|---|---|---|
| ✅ PASS | Все 53 из 53 артефактов integrity подтверждены | Стартовать Phase 1 Bootstrap / Phase 2 UI |
| ⚠️ PASS-WITH-WARNINGS | P1 warnings (≤5 шт.), P2 nitpicks | Прочитать, решить какие warnings acceptable |
| ❌ BLOCKED | Любая 🔴 P0 FAIL | Запустить fix-ТЗ (через Аналитика / Архитектора / Моделировщика), затем re-audit |

### 6.4 Что проверяет AUDITOR (сводка)

**Static (12 категорий):**

- C1 Hard limits × meta-файлы (CHECKLIST ≤400, AGENT-METHOD ≤500)
- C2 Cross-references × broken (regex extract + file_exists)
- C3 ID conflicts × PSL/Q/СПОР (монотонный рост)
- C4 SPEC compliance × Phase 1 Bootstrap (если применён)
- C5 Schema-doc alignment (32 сущности из SCHEMA-CONSOLIDATED.md)
- C6 Format compliance × A1-A11
- C7 Rule numbering consistency
- C8 Cross-module rule coherence
- C9 Numbers convergence (38 Q + 15 СПОР + 73 V-проверки)
- C10 UX-принципы соблюдены
- C11 Style consistency (RU/EN)
- C12 Anti-patterns check

**Semantic (7 типов):**

- S1 Status-машина consistency между модулями
- S2 RBAC vs Операции консистентность
- S3 Field-уровневая видимость
- S4 Суммы и расчёты
- S5 Workflow transitions vs State machines
- S6 Money Math precision
- S7 Time logic

---

## §7. Conflict resolution — типичные конфликты между результатами ТЗ

### 7.1 Конфликт K1: REGISTRY не покрывает область, которую STUB использует

| Симптом | Resolution |
|---|---|
| ТЗ-002 пишет правило `При смене статуса КП → автоматически ...`, REGISTRY этого правила не имеет | ADD правило в REGISTRY (Аналитик, 10 мин). Решение: REGISTRY имеет приоритет — нужно дописать его. |

**Кто решает:** Буфер-архистратор совместно с Аналитиком (приоритет — REGISTRY).

### 7.2 Конфликт K2: REGISTRY и STUB противоречат

**Пример:** REGISTRY §5: «КП может быть удалён soft-delete». STUB КП: «КП нельзя удалить после SENT».

| Resolution | Процедура |
|---|---|
| Если оба корректны в своих областях | Оставить оба; добавить cross-ref |
| Если один ошибочен | Обновить ошибочный, обосновать в PSL-NNN (новый) |
| Если business-decision от PO | Спросить PO через `ask_user` |

### 7.3 Конфликт K3: ID правила меняется между REGISTRY и STUB

| Симптом | Resolution |
|---|---|
| REGISTRY: `RULE-КП-RBAC-007` (видимость price) | Использовать `Принцип П6` AGENT-FORMAT — нумерация правил монотонна. Если STUB переименовал → уведомление в PSL-NNN, RENUMBER |
| STUB: `RULE-KP01-RBAC-007` (другой формат) | |

### 7.4 Конфликт K4: scoring в METHODOLOGY-RETROFIT противоречит существующему решению СПОР/Q

**Пример:** СПОР-7 имеет решение X, scoring блок говорит «K3 Риски=5».

**Resolution двух типов:**

- **Если X обоснованно:** написать обоснование в scoring-блоке ПОЧЕМУ 5 принято как risk (т.е. risk = 5, но mitigation равен 5 тоже; контролируемый). Оставить оба.
- **Если X противоречит:** добавить **новый** OQ/Q через PSL-NNN, эскалировать к PO.

### 7.5 Конфликт K5: LAUNCH-UX использует RBAC-правило, которое Run 1/5 не покрыл

| Resolution |
|---|
| Phase 2 UI стартует ТОЛЬКО после Run 2/5 (полное покрытие RBAC КП). До этого — partial UI: только то, что покрыто RBAC Run 1/5. |

### 7.6 Конфликт K6: Phase 1 Bootstrap Prisma создан, но REGISTRY не покрывает поле

| Resolution |
|---|
| Создание schema.prisma допустимо, но в `// TODO` комментариях указать «правила для этого поля будут в Run N». Phase 2 UI использует Zod валидацию для этого поля как fallback. |

### 7.7 Конфликт K7: SCORING в METHODOLOGY-RETROFIT суммируется > 25 (max) или < 5 (min)

| Resolution |
|---|
| Это значит неверное применение Шкалы (значение вне 1-5 или ошибка). Пересмотреть; если Шкала правильная, проверить формулу `Σ`. **Это баг методолога, требует fix.** |

---

## §8. Failure modes — что делать если 1 агент провалится

### 8.1 Уровни failure

| Severity | Что произошло | Действие |
|---|---|---|
| 🟢 Recoverable | Агент вернул частично (coverage <100%) | Re-run с указанием missing (10-30 мин) |
| 🟡 Blocked | Агент обнаружил conflict/shows unresolvable | Escalate to PO (через ask_user) |
| 🔴 Catastrophic | Агент не вернулся (timeout, OOM) | Hard re-spawn (новая сессия для того же ТЗ) |

### 8.2 Failure F1: ТЗ-001 REGISTRY coverage <80%

**Сценарий:** Агент REGISTRY вернул файл с <400 правил из требуемых 500.

| Действие | Трудоёмкость |
|---|---|
| Не пытаться починить возвращённое | 1 мин |
| Re-spawn агента на тот же ТЗ-001 с явным указанием «coverage 480/500, missing в разделах N, M, K» | 2-4 ч |
| Если re-spawn возвращает тот же partial — escalate | 5 мин (ask_user PO) |

### 8.3 Failure F2: ТЗ-002 Run 1/5 < 50 правил

**Сценарий:** RBAC STUB содержит <30 правил вместо требуемых ≥50.

| Действие | Трудоёмкость |
|---|---|
| Re-spawn на тот же ТЗ-002 с указанием «правила 30/50, missing: visibility для роли manager, цена, contact» | 1-2 ч |
| Если проблема систематическая (Run 1 не имеет нужных inputs) | Escalate к ПО: «Run 1 невозможно без OQ-N» |

### 8.4 Failure F3: ТЗ-003 LAUNCH-UX < 30 компонентов или отсутствуют UX-принципы

| Действие | Трудоёмкость |
|---|---|
| Re-spawn с явным указанием «4 UX-принципа из AGENT-METHOD §5.4 обязательны» | 1-3 ч |
| Если проблема в понимании Karkas-Kit | Escalate: запустить Буфер на «coaching» UX-дизайнера (30 мин диалога) |

### 8.5 Failure F4: ТЗ-004 Phase 1 Bootstrap Prisma — 88 baseline Vitest упали

**Сценарий:** schema.prisma создана, но baseline тесты возвращают >0 fail.

| Действие | Трудоёмкость |
|---|---|
| ❌ НЕ принимать такой результат | 1 мин |
| Re-spawn на ТЗ-004 с явным указанием «baseline 88 Vitest MUST pass» + дополнительной 30-мин fix session | 1-2 ч |
| Если системно (например, sharp не компилируется на Windows) | Escalate: возможно нужно pnpm → npm fallback или ОС-specific build script |

### 8.6 Failure F5: ТЗ-005 / ТЗ-006 — методологический фейл

| Действие | Трудоёмкость |
|---|---|
| Если просто <100% coverage | Re-spawn с указанием missing артефактов |
| Если scoring rubric противоречит сказанному в DECISION-METHODOLOGY | Re-spawn ТЗ-006 после фикса ТЗ-005 (зависимость!) |
| Если scoring битый (вне 1-5) | Escalate: возможно Шкала изменилась, нужен новый PSL-NNN |

### 8.7 Failure F6: ТЗП-001 AUDITOR вернул ❌ BLOCKED

**Это самый главный failure mode.** AUDITOR заблокировал → Phase 2 / Phase 1 Bootstrap не могут стартовать.

| Действие | Трудоёмкость |
|---|---|
| Прочитать AUDIT-REPORT.md §1 + §3 (top 5 risks) | 5 мин |
| Прочитать BLOCKING-ISSUES.md | 5 мин |
| Создать fix-ТЗ (ТЗП-002-... или специализированный fix-ТЗ) | 30 мин |
| Запустить fix-агента | 1-4 ч |
| Re-audit (ТЗП-001 v2) | 1-3 ч |
| Если фикс fail 2 раза подряд → Escalate | 5 мин (ask_user PO) |

---

## §9. Final pipeline — оптимальный merge order

### 9.1 Оптимальный сценарий (всё OK)

```
T0: Запуск 6 ТЗ параллельно + 1 ТЗП-001 ОТЛОЖЕН
T+1: Возврат ТЗ-005 (DECISION-METHOD — быстрый, документ)
T+2: Возврат ТЗ-001 + ТЗ-002 (правила + STUB)
T+3: Возврат ТЗ-003 (LAUNCH-UX)
T+4: Возврат ТЗ-004 (Phase 1 Bootstrap Prisma — тяжёлый)
T+5: Возврат ТЗ-006 (METHODOLOGY-RETROFIT — применяет к 53 артефактам)
T+6: Запуск ТЗП-001 AUDITOR (все результаты в)
T+7: Возврат AUDIT-REPORT
T+8 (если ✅ PASS): Старт Phase 1 Bootstrap финал / Phase 2 UI
```

ETA total: 4-8 ч (per CHECKLIST §3 snapshot).

### 9.2 Пессимистичный сценарий (1 failure)

```
T+1: ТЗ-005 ✅
T+2: ТЗ-001 ✅
T+3: ТЗ-002 🟡 Blocked (coverage 30/50)
T+3.1: Escalate к PO (5 мин)
T+3.5: Re-spawn ТЗ-002 с явным gap list
T+5: ТЗ-002 v2 ✅
T+5.5: ТЗ-003 ✅
T+6: ТЗ-004 ✅
T+7: ТЗ-006 ✅
T+8: ТЗП-001 AUDITOR ✅ PASS
T+9: Старт Phase 1 Bootstrap финал / Phase 2 UI
```

ETA extended: 6-10 ч.

### 9.3 Пессимистичный сценарий (AUDITOR ❌ BLOCKED)

```
T+8 (как выше): AUDITOR ❌ BLOCKED (например, C2 cross-ref broke)
T+8.5: Fix-ТЗ создан
T+12: Fix выполнен
T+13: AUDITOR v2 ✅ PASS
T+14: Старт Phase 2 UI / Phase 1 Bootstrap финал
```

ETA further extended: 10-15 ч.

---

## §10. Acceptance criteria для каждой фазы

### 10.1 Phase «Все ТЗ запущены»

- [ ] Все 6 ТЗ + 1 ТЗП стартованы (через Codebuff copy-paste launch-пакеты)
- [ ] Каждый агент имеет чёткий attach-list (cross-ref в ТЗ)
- [ ] Audit-trail в PROJECT-STATE-LOG.md

### 10.2 Phase «Все результаты получены»

- [ ] ТЗ-001: REGISTRY + LOG + REPORT + AMBIGUITIES (4 файла)
- [ ] ТЗ-002: 3 STUB (RBAC + biznes-pravila + statusy)
- [ ] ТЗ-003: LAUNCH-UX.md
- [ ] ТЗ-004: schema.prisma + 3 migrations + package.json + Husky
- [ ] ТЗ-005: DECISION-METHODOLOGY.md
- [ ] ТЗ-006: 53 scoring-блока + 1 шаблон + 02-REPORT-METHODOLOGY.md

### 10.3 Phase «Аудит выполнен»

- [ ] AUDIT-REPORT.md создан (verdict выставлен)
- [ ] Если BLOCKED → BLOCKING-ISSUES.md + fix-ТЗ создан
- [ ] GAP-LIST создан
- [ ] 02-REPORT-CHANGES.md (TSV diff)

### 10.4 Phase «Phase 1 Bootstrap / Phase 2 UI можно стартовать»

- [ ] AUDIT-REPORT verdict = ✅ PASS или ⚠️ PASS-WITH-WARNINGS (если PO принял)
- [ ] Все Phase 1 Bootstrap Prisma deliverables на месте
- [ ] LAUNCH-UX.md готов
- [ ] REGISTRY ≥500 правил
- [ ] Run 1/5 КП STUB заполнен

### 10.5 Финальный success

- [ ] `pnpm install` в `kppdf-6.0` работает
- [ ] `pnpm prisma migrate dev` применяет миграции
- [ ] `pnpm test` показывает 88/88 ✅
- [ ] `pnpm tsc --noEmit` чисто
- [ ] Phase 2 UI первый модуль (Mantine + RBAC + Zod) собирается

---

## §11. Связи с другими документами

- **Методология** — [`AGENT-METHOD.md` §5.3 + §5.6](../../AGENT-METHOD.md) (pre-action + post-action патерны)
- **Формат** — [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md) (анти-паттерны A1-A11)
- **Стек** — [`99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md`](../СТЕК-ПРЕДПИСАНИЕ.md)
- **Схема** — [`99_Справочники/SCHEMA-CONSOLIDATED.md`](../SCHEMA-CONSOLIDATED.md) (32 сущности)
- **RBAC** — [`99_Справочники/RBAC-MATRIX.md`](../RBAC-MATRIX.md)
- **Чеклист** — [`CHECKLIST.md`](../../CHECKLIST.md) §12.5 (index этого документа)
- **Журнал** — [`PROJECT-STATE-LOG.md`](../../PROJECT-STATE-LOG.md)
- **Надзор** — [`ТЗП-001-INTEGRITY-OVERSIGHT.md`](ТАSKS/ТЗП-001-INTEGRITY-OVERSIGHT.md)
- **Методология решения споров** — [`ТЗ-005-DECISION-METHODOLOGY.md`](ТАSKS/ТЗ-005-DECISION-METHODOLOGY.md)

---

> **Заключение.** Этот integration-план — живой документ. По мере возврата агентов и обнаружения новых edge-cases добавляются новые Failure modes (F8, F9...) и Conflict cases (K8, K9...). Изменения фиксируются через PSL-NNN.
