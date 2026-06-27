# ТЗ-007 — DECOMPOSITION-PROIZVODSTVO (Декомпозиция `03_Производство/` в 5-tier hierarchy)

> **Назначение.** Техзадание для параллельного **Архитектора** (или **Буфер-Архистратор**) — декомпозиция модуля `03_Производство/` согласно [`99_Справочники/MODULE-DECOMPOSITION-PLAN.md` §3](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md). Mirror-паттерн: PSL-021 (Договор), PSL-004 (КП). Каждый агент, получив это ТЗ, выполняет **ТОЛЬКО мета-уровень**: папки + имена файлов + 1-2 предложения назначения. **Содержимое правил — работа Аналитика Run 3 (ТЗ-008)**, не Архитектора.
>
> **Когда запускать.** ПОСЛЕ завершения ТЗ-001 (REGISTRY-OF-RULES) или параллельно с ним (не конфликтуют — write в РАЗНЫЕ файлы). Mirror ТЗ-001 + Аналитик Run 3 для 03_Производство.
>
> **Объём:** ~750-850 строк hard limit ≤ 1000. **Предыдущая аналогия:** ТЗ-001 (~1700 строк REGISTRY) + ТЗ-004 (~900 строк Phase 1 Bootstrap Prisma). Данное ТЗ — меньше по объёму из-за более узкого скоупа.

---

## §0 IN-WORK (Pre-action Checklist по PSL-009)

Обязательный паттерн Pre-action Checklist + Post-action Checkpoint по [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md) §3-§4. **PC-1..PC-8 + Post-Check формат**.

**PC-1.** Прочитан [`MODULE-DECOMPOSITION-PLAN.md`](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §3 — дерево STUB для `03_Производство/`. Подтверждено scope = **16 файлов в 5 папках**.

**PC-2.** Прочитан [`03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md`](../../../03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md) (~270 строк). Цели декомпозиции: 8 разделов V0 (определение / создание / статусы / ресурсы / план-график / контроль качества / упаковка / отчётность + RBAC + OQ).

**PC-3.** Прочитан [`01_КП/` decomposition reference](../../../01_КП/) (5-tier hierarchy: 00-spr → 01-shablon → 02-konstruktor-kp → 03-zhiznennyj-cikl → 04-pravila). Подтверждается mirror-подход для Производства.

**PC-4.** Прочитан [`02_Договор/` decomposition reference](../../../02_Договор/) (PSL-021) — точная mirror-структура, повторно использовать template.

**PC-5.** Source cross-refs готовы: `02-konstruktor-zakaza` (новое имя папки — `zakaza` вместо `dogovora`, в отличие от Договор). `03-zhiznennyj-cikl/03-statusy.md` показывает 6 статусов (CREATED/PLANNED/IN_PROGRESS/PARTIAL/COMPLETED/ARCHIVED) + 2 специальных (CANCELLED/WAITING_MATERIALS из источника).

**PC-6.** Hard limits в виду: каждый STUB ≤250 строк (target 80), каждый README ≤100 строк.

**PC-7.** `MODULE-DECOMPOSITION-PLAN.md` §3 фигурирует с 16 файлов. **Реальный скоуп — 16 файлов:**

```
03_Производство/
├── README.md                                  # 1 (entypoint модуля)
├── 00-spr/                                    # 6
│   ├── 00-README.md                           # folder entrypoint
│   ├── 00-glossary.md                         # термины (ProductionOrder, ProductionTask, цех)
│   ├── 00-orgs.md                             # цеха + роли (production-мастер, начальник)
│   ├── 00-resources.md                        # оборудование / люди / материалы
│   ├── 00-products.md                         # продукты производства
│   ├── 00-out-of-scope.md                     # что НЕ входит в модуль (MVP boundaries)
│   └── 00-otkrytye-voprosy.md                 # 5 baseline OQ для Run 3
├── 03-konstruktor-zakaza/                     # 4 (принципиально новая папка, mirror Договор)
│   ├── 00-README.md                           # folder entrypoint
│   ├── 03-plan-grafik.md                      # план-график работ
│   ├── 03-kontrol-kachestva.md                # QA-чеклист
│   └── 03-upakovka-i-dostavka.md              # упаковка + доставка
├── 03-zhiznennyj-cikl/                        # 5
│   ├── 00-README.md                           # folder entrypoint
│   ├── 03-statusy.md                          # 6+ статусов ЗК + state machine
│   ├── 03-perehody.md                         # разрешённые переходы + правила
│   ├── 03-vozvrat-i-brak.md                   # возврат / брак (cross-ref Склад)
│   └── 03-otchetnost.md                       # отчётность для production
└── 04-pravila/                                # 3
    ├── 00-README.md                           # folder entrypoint
    ├── 04-rbac.md                             # RBAC для Производства (≥35 правил)
    └── 04-biznes-pravila.md                   # инварианты (≥20 правил)
```

**PC-8.** Проверен `99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md` для cross-ref (СПОР-13 нумерация ЗК, СПОР-12 Refund).

---

## §1 Mission (миссия)

**Цель:** Создать **16 STUB файлов** для модуля `03_Производство/`, организованных в 5-tier folder hierarchy (mirror КП PSL-004 + Договор PSL-021). Каждый STUB — это **мета-файл** (папка + имя + 1-2 предложения назначения + source cross-ref + план наполнения для Run 3). **Аналитик Run 3 (ТЗ-008) заполнит содержимым правил.**

**Out-of-mission (явно):**
- ❌ Писать содержимое правил (это работа Аналитика Run 3 в ТЗ-008).
- ❌ Создавать сущности Prisma schema (это работа Моделировщика в ТЗ-004 Phase 1 Bootstrap или Phase 2 Bootstrap).
- ❌ Удалять исходник `МОДУЛЬ-ПРОИЗВОДСТВО.md` через `git rm` (это делается ПОСЛЕ полного Run 3 Аналитика).

**Минимальный скоуп:** 16 файлов точно как в `MODULE-DECOMPOSITION-PLAN.md` §3. Ни больше, ни меньше. Дерево уже задано — не меняйте naming convention.

---

## §2 Scope (что входит / что нет)

### 2.1 Что ВХОДИТ (scope ✅)

1. **16 STUB файлов** в точной структуре (см. PC-7 выше).
2. **Каждый файл** содержит минимальный шаблон по [`AGENT-METHOD.md` §5.2.1](../../AGENT-METHOD.md) + `ТЗ-0000-CLOSURE-PROTOCOL.md` §5 self-audit:
   ```
   # <имя-файла>.md — <назначение 1 строка>
   
   > ⚠️ **STUB.** Создан декомпозицией модуля `03_Производство/` (см. [MODULE-DECOMPOSITION-PLAN.md §3](#)).
   > Контент будет наполнен Аналитиком Run 3 (ТЗ-008).
   
   ## Назначение
   
   <1-2 строки из источника МОДУЛЬ-ПРОИЗВОДСТВО.md §N>
   
   ## Контекст
   
   <краткое описание — какие business-rules внутри, cross-ref на СПОР>
   
   ## План наполнения (для Аналитика Run 3)
   
   <bullet list — какие разделы заполнить>
   
   ## Связанные документы
   
   - <cross-refs на source + sibling STUBs + SCHEMA-CONSOLIDATED + RBAC-MATRIX>
   ```
3. **README.md** файлы (как folder entrypoints) — короткие (≤100 строк).
4. **`03_Производство/README.md`** — корневой entrypoint модуля, с cross-ref на все 5 папок.

### 2.2 Что НЕ входит (out-of-scope ❌)

1. **Содержимое правил** — Run 3 Аналитика (ТЗ-008).
2. **Prisma schema** — Phase 1 Bootstrap Prisma (ТЗ-004 уже для КП, для не-КП модулей — позже ТЗ-011).
3. **UI каркасы** — LAUNCH-UX для Производства (отдельная задача Phase 2).
4. **`МОДУЛЬ-ПРОИЗВОДСТВО.md` удаление** — после полного Run 3 применения Аналитиком.
5. **Создание файлов вне точного дерева** — например, дополнительных README в подпапках, или README в подпапке `04-pravila/02-конкретные-правила/` — это избыточно.

---

## §3 Deliverables (конкретные 16 файлов)

**Файлы для создания (точно в этом списке, ничего больше):**

| # | Path | Строк (план) | Назначение (1 строка) |
|---|---|---|---|
| 1 | `03_Производство/README.md` | ≤30 | Entrypoint модуля Производство |
| 2 | `03_Производство/00-spr/00-README.md` | ≤40 | Entrypoint папки справочников |
| 3 | `03_Производство/00-spr/00-glossary.md` | ≤80 | 8 терминов: ProductionOrder, ProductionTask, Цех, Ответственный, частичная готовность, parentProposalId, parentContractId... |
| 4 | `03_Производство/00-spr/00-orgs.md` | ≤60 | Цеха (физические подразделения) + роли production-master/start |
| 5 | `03_Производство/00-spr/00-resources.md` | ≤80 | Оборудование / люди / материалы в контексте производства |
| 6 | `03_Производство/00-spr/00-products.md` | ≤60 | Продукты производства (товары, услуги, работы, монтаж) |
| 7 | `03_Производство/00-spr/00-out-of-scope.md` | ≤80 | Что НЕ входит в модуль (MVP границы) |
| 8 | `03_Производство/00-spr/00-otkrytye-voprosy.md` | ≤120 | **5 baseline OQ** для Run 3 Аналитика |
| 9 | `03_Производство/03-konstruktor-zakaza/00-README.md` | ≤40 | Entrypoint папки конструктора ЗК |
| 10 | `03_Производство/03-konstruktor-zakaza/03-plan-grafik.md` | ≤120 | План-график работ (распределение по цехам, даты) |
| 11 | `03_Производство/03-konstruktor-zakaza/03-kontrol-kachestva.md` | ≤80 | QA-чеклист и контроль качества |
| 12 | `03_Производство/03-konstruktor-zakaza/03-upakovka-i-dostavka.md` | ≤100 | Упаковка и доставка (cross-ref Склад) |
| 13 | `03_Производство/03-zhiznennyj-cikl/00-README.md` | ≤40 | Entrypoint папки жизненного цикла |
| 14 | `03_Производство/03-zhiznennyj-cikl/03-statusy.md` | ≤120 | **6+ статусов ЗК** + state machine (`CREATED/PLANNED/WAITING_MATERIALS/IN_PROGRESS/PARTIAL/COMPLETED/ARCHIVED/CANCELLED`) |
| 15 | `03_Производство/03-zhiznennyj-cikl/03-perehody.md` | ≤80 | Разрешённые переходы + RBAC-правила |
| 16 | `03_Производство/03-zhiznennyj-cikl/03-vozvrat-i-brak.md` | ≤80 | Возврат/брак (cross-ref Склад WriteOffAct) |
| 17 | `03_Производство/03-zhiznennyj-cikl/03-otchetnost.md` | ≤60 | Отчётность для начальника производства |
| 18 | `03_Производство/04-pravila/00-README.md` | ≤35 | Entrypoint папки правил |
| 19 | `03_Производство/04-pravila/04-rbac.md` | ≤100 | RBAC ≥35 правил (production, director, manager, etc.) |
| 20 | `03_Производство/04-pravila/04-biznes-pravila.md` | ≤80 | Инварианты ≥20 правил |

**Total = 20 файлов** (не 16 — уточнено в PC-7 после прочтения полного источника).

> ⚠️ **Уточнение PC-7:** В моём PC-7 выше я указал 16 файлов — но точный подсчёт по §3.2 = **20 файлов**. Учтено. Mirror Договор = 18 файлов; Производство = **20 файлов** (на 2 больше за счёт `00-resources.md` + `03-otchetnost.md` — специфично для производственного модуля).

---

## §4 Methodology (4-фазная per AGENT-METHOD §3)

### Phase 1: Setup (15 мин)

1. Read [`MODULE-DECOMPOSITION-PLAN.md` §3](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) полностью — 80 строк.
2. Read [`МОДУЛЬ-ПРОИЗВОДСТВО.md`](../../../03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md) полностью — 270 строк.
3. Проверить `list_directory(03_Производство/)` — текущее состояние (должны быть только `МОДУЛЬ-ПРОИЗВОДСТВО.md`).
4. Подготовить список из 20 файлов (§3 выше).

### Phase 2: Create STUBs (90 мин)

5. **Создание папок:** `mkdir -p 03_Производство/{00-spr,03-konstruktor-zakaza,03-zhiznennyj-cikl,04-pravila}`.
6. **Создание 20 файлов** параллельно через `write_file`. Каждый файл — STUB структура из §2.1 выше (~50-120 строк каждый).
7. **Шаблон каждого файла** — тот же что в Договор PSL-021 (mirror pattern):
   - Header `# filename.md` + 1 строка назначения
   - `> ⚠️ STUB` блок (source + run target)
   - `## Назначение` (1-2 строки)
   - `## Контекст` (краткое)
   - `## План наполнения (для Аналитика Run 3)` (bullets)
   - `## Связанные документы` (cross-refs)

### Phase 3: Cross-ref validation (30 мин)

8. Проверить **все cross-refs** между 20 новыми файлами:
   - `00-glossary.md` ↔ `00-orgs.md` ↔ `00-resources.md`
   - `03-statusy.md` ↔ `03-perehody.md` ↔ `03-vozvrat-i-brak.md` ↔ `03-otchetnost.md`
   - `04-rbac.md` ↔ `04-biznes-pravila.md`
9. Проверить cross-refs на **внешние документы**:
   - `../01_КП/00-spr/00-glossary.md` (general glossary)
   - `../02_Договор/03-zhiznennyj-cikl/03-statusy.md` (Договор status mirror)
   - `../../99_Справочники/SCHEMA-CONSOLIDATED.md` (entities)
   - `../../99_Справочники/RBAC-MATRIX.md` (глобальная матрица)
   - `../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md` (СПОР-12 Refund, СПОР-13 нумерация)

### Phase 4: Self-audit (per TЗ-0000 §5)

10. **Verify hard limits:** `wc -l 03_Производство/**/*.md` — каждый ≤250 строк.
11. **Verify file count:** `ls -la 03_Производство/` — должно быть ровно 20 .md файлов.
12. **Verify каждый STUB имеет ⚠️ маркер** + Назначение + План наполнения.
13. **Создать PSL-NNN** в PROJECT-STATE-LOG.md (audit trail).
14. **git commit** (опционально, по запросу PO).

---

## §5 Pre-action Checklist per file (sub-deliverable pattern)

Для каждого из 20 файлов — **мини-Pre-action Checklist** (PC-1..PC-3) внутри комментария агента. Не дублировать в файл — это для mental tracking.

| PC | Вопрос |
|---|---|
| PC-1 для файла | Цель файла ясна из источника МОДУЛЬ-ПРОИЗВОДСТВО.md §N? |
| PC-2 для файла | Cross-refs на sibling STUBs определены? |
| PC-3 для файла | Структура mirror Договор PSL-021 подтверждена? |

---

## §6 ТЗ-0000 binding (ОБЯЗАТЕЛЬНОЕ перед выключением)

Перед тем как PO выключает Архитектора — **обязательно** применить [`ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md) — universal closure protocol:

1. **PC checklist** (8 preconditions из §0) — все ✅
2. **RE-READ** source [`МОДУЛЬ-ПРОИЗВОДСТВО.md`](../../../03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md) целиком
3. **SELF-AUDIT** 7 проверок (gaps / duplicates / grammar / coverage / format / anti-patterns / trade-offs)
4. **CROSS-REFERENCE validation** (Phase 3 выше)
5. **VISUAL 🔒 FINALIZED block** в начало `03_Производство/README.md`
6. **CLOSURE REPORT** в `99_Справочники/TASKS/02-CLOSURE-REPORT-ТЗ-007.md` + **PSL-NNN** в PROJECT-STATE-LOG.md

If ✅ CLOSED → PO выключает агента. If ⚠️ CLOSED-WITH-CAVEATS → фиксировать gaps (например, отсутствующие sibling STUBs). If ❌ NOT-CLOSED → перепройти SELF-AUDIT.

---

## §7 Quality gates (per phase)

### 7.1 Phase 2 quality bars (per файл)

| Gate | Критерий | Pass |
|---|---|---|
| QG1 | ⚠️ STUB marker присутствует | ✅ |
| QG2 | Назначение ≤2 строк | ✅ |
| QG3 | План наполнения ≥3 bullets | ✅ |
| QG4 | Cross-refs ≥3 файлов | ✅ |
| QG5 | File ≤250 строк | ✅ |
| QG6 | Mirror Договор PSL-021 структура | ✅ |
| QG7 | Naming convention `NN-filename.md` | ✅ |

### 7.2 Phase 4 quality bars (overall)

- [ ] 20 файлов созданы (точно, не больше, не меньше)
- [ ] Нет файлов вне дерева §3 (никаких extra README)
- [ ] Все cross-refs валидны (нет 404)
- [ ] Нет дублирования между sibling STUBs (cross-ref вместо copy-paste)
- [ ] `wc -l` каждого ≤250 строк
- [ ] Total новых строк = ~1500 (target)

---

## §8 Hard limits

| Limit | Value | Violation |
|---|---|---|
| Каждый файл | ≤250 строк | ❌ HARD STOP — split into 2 files |
| Каждый README (entrypoints) | ≤100 строк | ❌ HARD STOP |
| Общий объём нового кода | ≤2000 строк | ⚠️ WARNING — banner override AGENT-REVIEW §1.6 |
| Pravila | ≥35 правил для RBAC, ≥20 для инвариантов (для Run 3 — не сейчас) | n/a |
| Otnoshenie file count | exactly 20 (ни больше, ни меньше) | ❌ HARD STOP |

---

## §9 Acceptance criteria (final check)

1. **Phase 1:** ✅ Агент прочитал MODULE-DECOMPOSITION-PLAN §3 + МОДУЛЬ-ПРОИЗВОДСТВО полностью.
2. **Phase 2:** ✅ 20 файлов созданы в правильной структуре с правильным содержанием.
3. **Phase 3:** ✅ Cross-refs валидны (verify code 0).
4. **Phase 4:** ✅ Self-audit по ТЗ-0000 пройден, ⚠️ маркер везде, mirror PSL-021.
5. **ТЗ-0000:** ✅ CLOSURE-REPORT создан + PSL-NNN в журнале + 🔒 FINALIZED в README.
6. **No conflict:** ✅ с работающими агентами (write в РАЗНЫЕ файлы от ТЗ-001/002/003/004/005/006, ТЗ-008/009/010).
7. **Hard limits соблюдены:** ✅ все файлы ≤250 строк.
8. **Mirror pattern:** ✅ структура идентична `02_Договор/` PSL-021 (5-tier).

---

## §10 Anti-patterns (per AGENT-FORMAT §A1-A11)

| # | Anti-pattern | Как ИЗБЕЖАТЬ |
|---|---|---|
| A1 | Написать содержимое правил | ⚠️ STUB маркер в каждом. Только мета. |
| A2 | Создать файлы вне дерева §3 | Строго 20 файлов из §3 |
| A3 | Длинный README без bulleting | Использовать таблицу для Deliverables |
| A4 | Нарратив-история (что было хорошо) | Исключить (PSL-004 lesson) |
| A5 | Дублирование между sibling STUBs | Cross-ref `→ см. файл N` |
| A6 | Ссылка на V-номера без контекста | Каждый V-номер комментировать |
| A7 | Неопределённый scope ("хорошо бы X") | EXPLICIT OPP/IN/OUT для каждой возможности |
| A8 | Cross-ref на несуществующий файл | Phase 3 validation step |
| A9 | File >250 строк | Баннер per AGENT-REVIEW §1.6 |
| A10 | Миссинг TLDR / summary | ⚠️ STUB резюмирует в 1 строке |
| A11 | Self-archive (ссылка на archive/) | Не ссылаться на archive/ — активная навигация |

---

## §11 Glossary (terms used in this ТЗ)

| Термин | Значение |
|---|---|
| **STUB** | Мета-файл с ⚠️ маркером, без правил |
| **5-tier hierarchy** | 00-spr → 01-shablon (нет в Производство) → 02-konstruktor-zakaza → 03-zhiznennyj-cikl → 04-pravila |
| **Sibling STUB** | Другой STUB в той же папке |
| **Run 3** | Третий прогон Аналитика (Run 1 = КП ТЗ-002, Run 2 = Договор, Run 3 = Производство) |
| **Mirror Договор PSL-021** | Точная копия структуры из 02_Договор (18 файлов) адаптированная к Производство (20 файлов) |
| **Pre-action Checklist** | Обязательный §0 структура по PSL-009 |
| **CLOSURE PROTOCOL** | Завершение по ТЗ-0000-CLOSURE-PROTOCOL.md |

---

## §12 Acceptance signoff

**Когда все §9 пункты ✅ — Архитектор берёт VERDICT:**
- ✅ CLOSED → PO выключает агента
- ⚠️ CLOSED-WITH-CAVEATS → PO читает caveats, решает принять или re-run
- ❌ NOT-CLOSED → re-run Phase 4

**Связанные документы:**
- [`99_Справочники/MODULE-DECOMPOSITION-PLAN.md`](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) — главный план §3
- [`99_Справочники/TASKS/ТЗ-008-RUN-3-5-АНАЛИТИК-ПРОИЗВОДСТВО.md`](ТЗ-008-RUN-3-5-АНАЛИТИК-ПРОИЗВОДСТВО.md) — следующий шаг (Run 3 Аналитик)
- [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md) — ОБЯЗАТЕЛЬНО перед выключением
- [`03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md`](../../../03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md) — источник V0
- [`02_Договор/`](../../../02_Договор/) — PSL-021 mirror reference
- [`01_КП/`](../../../01_КП/) — PSL-004 baseline decomposition reference

> **Hard limit:** ТЗ-007 ≤1000 строк ✅ вписано (план ~750). | `<details>` с детальной методологией ▼ (если Аналитик Run 3 нуждается в подробностях) |
