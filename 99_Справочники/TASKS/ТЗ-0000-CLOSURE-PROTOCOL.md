# ТЗ-0000 — UNIVERSAL CLOSURE PROTOCOL (универсальный протокол закрытия задачи)

> **Назначение.** **ТЗ-0000** — универсальный протокол, ОБЯЗАТЕЛЬНЫЙ для выполнения ЛЮБЫМ агентом перед тем, как его можно считать завершившим свою задачу. Применим ко всем 7 существующим спецификациям (ТЗ-001..006 + ТЗП-001) и к любым будущим `ТЗ-NNN` / `ТЗП-NNN`. **Не выполнив ТЗ-0000 полностью, агент НЕ считается завершившим задачу — PO должен держать его активным и указывать на недостающие шаги.**
>
> **Жанр.** ТЗ-0000 = **мета-ТЗ** (отличается от ТЗ = «работать», ТЗП = «надзирать», ТЗ-RETROFIT = «ретроактивный scoring»). Это протокол verification, не содержательная задача.
>
> **Объём:** ~900 строк. Hard limit ≤ 1200 (per [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md)).
>
> **Когда запускать:** в КОНЦЕ работы каждого агента; перед тем как PO пишет «выключаю агент». Тригерится фразой **«прочитай ТЗ-0000 и подтверди готовность»**.

---

## Оглавление

- **§0.** IN-WORK CHECKLIST (Pre-action + Post-action)
- **§1.** Главный вопрос протокола
- **§2.** Фаза 0 — Pre-condition checklist (готов ли агент закрываться?)
- **§3.** Фаза 1 — RE-READ источник (извлечь ВСЕ acceptance criteria)
- **§4.** Фаза 2 — SELF-AUDIT (нет gaps, нет дублей, грамотно, полностью)
- **§5.** Фаза 3 — CROSS-REFERENCE validation (все ссылки живые)
- **§6.** Фаза 4 — VISUAL FINALIZATION BLOCK (заблокировать раздел)
- **§7.** Фаза 5 — CLOSURE REPORT (что отдать PO)
- **§8.** 7 типов failure at closure (типичные ошибки)
- **§9.** Anti-patterns при закрытии задачи
- **§10.** Hard limits и override
- **§11.** Information flow (кому что передаётся)
- **§12.** Глоссарий closure-жаргона

---

## §0. IN-WORK CHECKLIST

Стандартный шаблон (Агент / Старт / Цель / Объём / Подход) — см. [`AGENT-METHOD.md` §5.6.6](../../AGENT-METHOD.md). Уникальные для CLOSURE PROTOCOL поля — ниже.

**Агент-специфика (для closure-агента):**

| Поле | Значение |
|---|---|
| ID протокола | **CLOSURE-AGENT** (новая роль, поверх всех рабочих ролей) |
| Authority | **БЛОКИРУЮЩАЯ**: ❌ NOT-CLOSED = агент НЕ выключается |
| Output | 1 файл `02-CLOSURE-REPORT.md` + 1 visual block в source ТЗ + 1 update в PROJECT-STATE-LOG.md |
| Trigger | фраза PO «прочитай ТЗ-0000 и подтверди готовность» ИЛИ самостоятельно когда агент видит что работа завершена |
| Auto-fix | ❌ НЕ правит контент задачи — только проверяет и фиксирует |

**Post-action формат** — стандартный [`AGENT-METHOD.md` §5.6.2](../../AGENT-METHOD.md). Обязательные поля Post-action для closure:

- **Verdict:** ✅ CLOSED / ⚠️ CLOSED-WITH-CAVEATS / ❌ NOT-CLOSED
- **Coverage %:** по 5 фазам closure (§2..§6)
- **Топ-3 gaps:** если есть
- **Caveats:** если есть
- **Что НЕ проверил:** honest disclaimer
- **Confirmation to PO:** «готов к выключению, держите агент активным только если есть ❌»

---

## §1. Главный вопрос протокола

> **«Выполнил ли агент ВСЕ acceptance criteria своего source ТЗ на 100%, без gaps, без дублей, с грамотной структурой, живыми cross-refs, и зафиксировал ли это визуальным блоком + closure report?»**

Если ответ «да с оговорками» — ⚠️ CLOSED-WITH-CAVEATS + список оговорок для PO.
Если ответ «нет, и вот почему» — ❌ NOT-CLOSED + что нужно доделать.

### 1.1 Три принципа closure

1. **ПОЛНОТА покрывает СКОРОСТЬ.** Лучше потратить 30 мин на тщательную проверку, чем «отрапортовать» раньше и упустить gaps.
2. **ДОКАЗАТЕЛЬНОСТЬ.** Каждый acceptance criterion = конкретный checkmark с file:line или номер критерия.
3. **БЛОКИРОВКА важнее вежливости.** Агент не должен писать «вроде всё хорошо» — только «✅ verified criterion X-N (file Y, line Z)».

### 1.2 Что НЕ входит в closure (явно OUT)

| За пределами | Почему |
|---|---|
| Правка контента задачи | Прерогатива рабочего агента, не closure |
| Audit полного проекта | Прерогатива ТЗП-001 (другая роль) |
| Решение новых споров | Прерогатива PO |
| Изменение scope source ТЗ | Запрещено CHECKLIST §9 |

---

## §2. Фаза 0 — Pre-condition checklist (готов ли агент закрываться?)

### 2.1 Pre-condition таблица (8 вопросов)

Прежде чем начать фазу 1-5, агент ОБЯЗАН ответить на 8 pre-condition вопросов. Если ЛЮБОЙ ответ «нет» → closure НЕ начинается → агент сообщает PO и возвращается к рабочей части.

| # | Pre-condition | Да / Нет | Если Нет |
|---|---|---|---|
| **PC1** | Все deliverables из source ТЗ §3 (или эквивалент) созданы? | ☐ | Создать missing deliverables |
| **PC2** | Никакая работа не осталась in-progress? | ☐ | Завершить или явно зафиксировать TODO |
| **PC3** | Никакие файлы не модифицированы частично (uncommitted)? | ☐ | Дозавершить + commit |
| **PC4** | Source ТЗ прочитан полностью (включая все § разделы)? | ☐ | Сначала прочитать source |
| **PC5** | У coverage есть конкретная численная цель (X/100%)? | ☐ | Уточнить у PO цель coverage |
| **PC6** | Output файлы доступны и валидны (не пустые, не corrupted)? | ☐ | Пересохранить/восстановить |
| **PC7** | Cross-refs в созданных файлах ведут на существующие файлы? | ☐ | Fix broken refs |
| **PC8** | Sanity-check из source ТЗ §Acceptance выполнен? | ☐ | Выполнить перед closure |

### 2.2 Если ВСЕ 8 = «да» → переход к Фазе 1

Если хоть один «нет» → отчёт PO:

```markdown
## NOT-CLOSED — pre-condition failed

**Агент:** <роль>/<модель>
**Source ТЗ:** <path/ТЗ>
**Причина:** PC<N> = NO: <краткое описание>
**Нужно сделать:** <что нужно доделать>
**Estimated time to fix:** <мин>
```

---

## §3. Фаза 1 — RE-READ источник (извлечь ВСЕ acceptance criteria)

### 3.1 Зачем RE-READ

Частая ошибка агента: «Я помню что в ТЗ был критерий X» → забывает / упускает. RE-READ принудительно + structured summarization.

### 3.2 Алгоритм

1. Открой source ТЗ (например `99_Справочники/TASKS/ТЗ-001-КАТАЛОГ-ПРАВИЛ.md`).
2. Прочитай ВСЕ разделы сверху вниз. Пропускать НЕЛЬЗЯ.
3. Найди раздел «Acceptance criteria» / «Acceptance» / «Self-check» / «Чек-лист сдачи» / аналог.
4. Скопируй ВСЕ буллеты / чек-лист пункты в список `acceptance_criteria = []`.
5. Если раздел называется иначе — поищи по паттернам «checkbox», «☑», «[ ]», «**Правило N.M**», «coverage», «target», «hard limit».

### 3.3 Куда фиксировать extracted criteria

Создай файл `<source_tz>_CLOSURE-EXTRACT.md` (внутренний, не коммитится) с содержимым:

```markdown
# Extracted Acceptance Criteria from <source ТЗ>

**Извлечено:** <ISO datetime>
**Агент:** <роль>/<модель>

## Criteria list:

- [ ] C1: <текст критерия 1>
- [ ] C2: <текст критерия 2>
- [ ] C3: <текст критерия 3>
...
- [ ] CN: <текст критерия N>

## Total criteria: <N>
```

### 3.4 Если source ТЗ НЕ имеет явного раздела acceptance

Если source ТЗ составлен небрежно и acceptance criteria разбросаны по тексту — агент ОБЯЗАН:

1. Прочитать весь source ТЗ.
2. Собрать все утверждения вида «должно быть», «обязательно», «минимум», «hard limit», «coverage ≥», «все … должны иметь».
3. Сформулировать из каждого критерий.
4. Зафиксировать в `CLOSURE-EXTRACT.md`.

### 3.5 Sanity-check после RE-READ

- [ ] Прочитан весь source ТЗ (от §0 до последнего §)
- [ ] Извлечены все acceptance criteria без пропусков
- [ ] Если критериев 0 → escalate PO (source ТЗ плохо составлен)
- [ ] Количество критериев зафиксировано в CLOSURE-EXTRACT.md

---

## §4. Фаза 2 — SELF-AUDIT (нет gaps, нет дублей, грамотно, полностью)

### 4.1 Типы проверок

Для КАЖДОГО критерия из CLOSURE-EXTRACT.md провести **7 стандартных проверок**:

| # | Тип | Что проверяется | Метод |
|---|---|---|---|
| **C-AUDIT-1** | **Gaps** | Критерий выполнен на 100% (нет недостающих частей) | Поиск в output файлах ожидаемого содержания |
| **C-AUDIT-2** | **Duplicates** | Нет дублей в output (тот же контент в 2+ местах) | grep + manual scan |
| **C-AUDIT-3** | **Grammar / качество** | Text грамотный (опечатки, синтаксис, RU/EN consistency) | manual review |
| **C-AUDIT-4** | **Coverage %** | Если критерий имеет метрику (X% / X of Y) — соответствует ли | numeric check |
| **C-AUDIT-5** | **Format compliance** | Следует ли AGENT-FORMAT (нумерация, цифры вместо слов) | manual checklist |
| **C-AUDIT-6** | **Anti-patterns** | Нет нарушений A1-A11 из AGENT-FORMAT.md | targeted grep |
| **C-AUDIT-7** | **Acceptable trade-off** | Если были компромиссы — явно зафиксированы в caveats | manual review |

### 4.2 Что делать с каждым результатом

| Результат | Действие |
|---|---|
| ✅ Все 7 проверок OK | Поставить ✅ VERIFIED criterion-N в CLOSURE-REPORT |
| ⚠️ Compromises уместны | Поставить ✅ + caveat в CLOSURE-REPORT §Caveats |
| ❌ Gaps или duplicates | ❌ NOT-VERIFIED → блокирует closure → агент возвращается к рабочей части для fix |

### 4.3 Особо критичные проверки (для проекта KPPDF)

Сверх типовых 4.1 проверок, для нашего проекта:

| Проверка | Что |
|---|---|
| **Hard limits** | Никакой output файл не превышает 1500 строк (не считая §Consolidator с override-banner) |
| **PSL cross-ref** | Если source ТЗ упоминает PSL-NNN — verify что PSL-NNN существует |
| **Quote convention** | Используется ли `99_Справочники/` (не русские названия) |
| **Markdown-lint** | Если доступен `markdownlint` — прогнать (опционально) |

### 4.4 Если source ТЗ сам требует sanity-check через bash

Некоторые ТЗ требуют `pnpm test`, `tsc --noEmit`, `pnpm prisma validate` как acceptance. В этом случае closure ОБЯЗАН запустить эти команды через bash agent и зафиксировать exit-code в CLOSURE-REPORT.

Пример:
```markdown
✅ C-AUDIT: `pnpm test` exit code = 0 stdout = "88 passed, 0 failed"
✅ C-AUDIT: `pnpm tsc --noEmit` exit code = 0
✅ C-AUDIT: `pnpm prisma validate` exit code = 0
```

---

## §5. Фаза 3 — CROSS-REFERENCE validation (все ссылки живые)

### 5.1 Зачем

Каждый cross-ref должен указывать на существующий файл / секцию / PSL. Broken ref → ❌ NOT-CLOSED.

### 5.2 Алгоритм

1. Открой каждый output файл агента.
2. Grep все `[label](path)` или `[label](../path)`.
3. Для каждой ссылки проверь `file_exists(path)`.
4. Если хоть одна ссылка broken → fix (агент возвращается к рабочей части).
5. Дополнительно: для `см. §N` ссылок проверь что §N существует в target-файле.

### 5.3 Специфика проекта KPPDF

Типичные cross-refs которые ОБЯЗАНЫ работать:

- `CHECKLIST.md` → `PROJECT-STATE-LOG.md` (для каждой упомянутой PSL)
- `PROJECT-STATE-LOG.md` → `CHECKLIST.md §N` (для каждой ссылки)
- `99_Справочники/TASKS/*.md` → `99_Справочники/*.md` (упоминаемые справочники)
- `ТЗ-NNN` cross-ref → другой `ТЗ-NNN` (для dependency chain)
- Все RULES (`RULE-{MODULE}-{TYPE}-{NNN}`) → существуют ли эти правила в REGISTRY или исходнике

### 5.4 Sanity-check

- [ ] Все `[label](path)` проверены через file_exists
- [ ] Все `см. §N` где `целевой_файл §N` существует
- [ ] Все упомянутые PSL-NNN существуют в PROJECT-STATE-LOG.md
- [ ] Все RULE-NNN существуют в REGISTRY (если упоминаются)

---

## §6. Фаза 4 — VISUAL FINALIZATION BLOCK (заблокировать раздел)

### 6.1 Цель

Явно показать что работа завершена — через визуальный блок вверху source ТЗ.

### 6.2 Что добавить в НАЧАЛО source ТЗ

Агент ОБЯЗАН добавить в начало файла source ТЗ (ПЕРЕД всем контентом, сразу после `# <name>.md`):

```markdown
# <name>.md
>
> ## 🔒 FINALIZED <YYYY-MM-DD HH:MM>
>
> **Агент:** <роль>/<модель>
> **Verdict:** ✅ CLOSED
> **Source ТЗ:** <path>
> **Closure report:** <path to 02-CLOSURE-REPORT.md>
> **Заблокировано для дальнейших правок без нового PSL-NNN.**

```

Если verdict = ⚠️ CLOSED-WITH-CAVEATS, добавить:

```
**Caveats:** <список caveats 1-2 строки>
```

Если verdict = ❌ NOT-CLOSED, НЕ добавлять этот блок (вместо этого — добавить блок «🟡 NOT-CLOSED»).

### 6.3 Что такое «блокировка раздела»

Это semantic marker для будущих читателей/агентов:

- **Не трогать** содержимое без нового PSL-NNN (если хочешь править → создай новый PSL-NNN обосновывающий изменение).
- **Coverage final** — больше не нужно проверять coverage.
- **Прямой workflow** — если есть unclear, читать CLOSURE-REPORT для caveats.

### 6.4 Sanity-check

- [ ] 🔒 FINALIZED block добавлен в начало source ТЗ
- [ ] Дата в формате ISO
- [ ] Указана роль + модель агента
- [ ] Указан verdict
- [ ] Указан путь к CLOSURE-REPORT.md
- [ ] Если ⚠️ — caveats перечислены

---

## §7. Фаза 5 — CLOSURE REPORT (что отдать PO)

### 7.1 Файл

Создай `<source_tz>_02-CLOSURE-REPORT.md` (рядом с source ТЗ). Не заменяет существующие deliverables (LOG.md, REPORT.md) — это ДОПОЛНИТЕЛЬНЫЙ файл.

### 7.2 Структура

| Раздел | Содержание | Лимит |
|---|---|---|
| §0 | Header (Агент / Source ТЗ / Дата / Verdict) | ~15 строк |
| §1 | Extracted criteria + ✅ status по каждому | ~100 строк |
| §2 | C-AUDIT-1..7 результаты | ~50 строк |
| §3 | Cross-ref validation результат | ~30 строк |
| §4 | Visual FINALIZATION block applied (yes/no + where) | ~15 строк |
| §5 | Coverage % по 5 фазам closure | ~20 строк |
| §6 | Caveats (если есть) | ~10-30 строк |
| §7 | «Что НЕ проверил» (honest disclaimer) | ~15 строк |
| §8 | Confirmation to PO: «готово к выключению; YES если все ✅, NO если ❌» | ~10 строк |
| **Всего** | | **≤ 400 строк** |

### 7.3 Пример секции §1 (для ТЗ-001 условный)

```markdown
## §1. Acceptance criteria из source ТЗ

Извлечено из `99_Справочники/TASKS/ТЗ-001-КАТАЛОГ-ПРАВИЛ.md` = **20 критериев**.

| # | Criterion (из source) | Verification | Result |
|---|---|---|---|
| C1 | ≥500 правил всего | wc -l + grep `RULE-` count = 510 | ✅ |
| C2 | 12 разделов покрыты | grep `^## ` count = 12 | ✅ |
| C3 | ID формат `RULE-{MODULE}-{TYPE}-{NNN}` | regex validation | ✅ |
| C4 | 100% покрытие 5 модулей | grep module names | ✅ |
| C5 | Каждое правило имеет источник + следствие | manual scan | ✅ |
... (всего 20 строк)

**Coverage: 20/20 = 100% ✅**
```

### 7.4 Что если Coverage < 100%

Если хоть один ❌ → verdict = ❌ NOT-CLOSED → агент НЕ создаёт CLOSURE-REPORT.md (или создаёт с указанием reasons). PO видит «❌» и решает:

- (a) Поручить агенту fix и reclosи
- (b) Override через PSL-NNN (с обоснованием почему OK)
- (c) Откатить source ТЗ

### 7.5 Sanity-check

- [ ] CLOSURE-REPORT создан в правильном месте
- [ ] Все 8 разделов заполнены (или явно «не применимо» с обоснованием)
- [ ] Verdict выставлен явно
- [ ] Coverage % рассчитан
- [ ] Caveats не пустые если verdict = ⚠️
- [ ] Honest disclaimer заполнен

---

## §8. 7 типов failure at closure (типичные ошибки)

### F-CLOSE-1: «Готов, можно закрывать» без RE-READ

**Симптом:** Агент помнит только верхнеуровневые acceptance и не проверяет детальные.

**Fix:** принудительный RE-READ source ТЗ (Фаза 1).

### F-CLOSE-2: Coverage 99% вместо 100% — claim «достаточно»

**Симптом:** Агент не довёл последний 1% (например, один из 50 правил имеет typo).

**Fix:** Один errored критерий = coverage < 100% → ❌ NOT-CLOSED → fix.

### F-CLOSE-3: Broken cross-ref оставлен как «minor»

**Симптом:** `[FF]` (Failed File ref) обнаружен в работе, но не fix'нут.

**Fix:** Cross-ref = обязательно живой. ❌ → fix → reclosе.

### F-CLOSE-4: ❌ в TLDR → но скоро отрапортовано

**Симптом:** Агент написал «финиш» в чате без прохождения всех фаз closure.

**Fix:** PO должен проверить существование CLOSURE-REPORT.md + 🔒 FINALIZED block перед выключением.

### F-CLOSE-5: Finalization block добавлен но с НЕПРАВИЛЬНЫМ verdict

**Симптом:** 🔒 блок есть, но verdict текстом = ❌ вместо ✅ (НЕСОГЛАСОВАННОСТЬ).

**Fix:** Switch на «🟡 NOT-CLOSED» block (специальный marker, см. §6.5).

### F-CLOSE-6: Caveats пустые при ⚠️

**Симптом:** Verdict = ⚠️ но список caveats пустой.

**Fix:** Caveats обязательны для ⚠️. Если нет конкретных → escalate «нет reasons для ⚠️, должно быть ✅ или ❌».

### F-CLOSE-7: Closure report — copy-paste из другого ТЗ (не от текущего)

**Симптом:** Агент скопировал closure-report из предыдущего ТЗ и подставил имя.

**Fix:** Sanity-check: criteria list должен соответствовать ТЕКУЩЕМУ source ТЗ, не предыдущему.

### F-CLOSE-DASH (additional): Нет блокировки → другой агент сразу правит

**Симптом:** После «закрытия» ТЗ-001 другой агент начал править REGISTRY-OF-RULES.md без нового PSL.

**Fix:** правило CHECKLIST §9 «не ломай сделанного» = FINALIZED block = required reading.

---

## §9. Anti-patterns при закрытии задачи

### AC1. «SKIP RE-READ» — экономить время

Нельзя. Closure protocol — это ВРЕМЯ на качество. PO не должен экономить.

### AC2. «Coverage 95% = достаточно»

Нельзя. Source ТЗ имеет свой target (100% / ≥N), нельзя override без явного PSL.

### AC3. «Caveats не нужны, я всё доделал»

Если всё доделал → ✅, не ⚠️. ⚠️ с пустыми caveats — мусор.

### AC4. «Финализирую без CLOSURE-REPORT»

CLOSURE-REPORT — обязателен. Без него 🔒 FINALIZED → ❌ не считается закрытым.

### AC5. «Не писать ничего в PROJECT-STATE-LOG»

Каждое closure ОБЯЗАТЕЛЬНО фиксируется как PSL-NNN (например PSL-016 для ТЗ-0000).

### AC6. «ОК, готов, отдаю» без конкретных file:line

Verdict без конкретики — не closure. Должно быть «✅ verified criterion X-N в file Y, line Z».

### AC7. «Возьму паузу и вернусь»

Если пауза >5 мин → state теряется → agent context drop → не closure, а просто abandonment. PO должен re-spawn.

---

## §10. Hard limits и override

### 10.1 Hard limits ТЗ-0000

| Файл | Target | Hard limit |
|---|---|---|
| Сам ТЗ-0000 (этот файл) | 900 | 1200 |
| CLOSURE-EXTRACT.md (внутренний) | 200 | 400 |
| CLOSURE-REPORT.md (per-source) | 200 | 400 |

### 10.2 Override разрешён

CLOSURE-REPORT может быть расширен до 600 строк если source ТЗ имеет >30 acceptance criteria (каждый по 1 строке = 60 строк только в §1).

Override-banner:

```
<!-- ⚠️ HARD LIMIT OVERRIDE: closure-report extended to 600 lines for ТЗ with 30+ criteria -->
```

### 10.3 Self-check перед сдачей ТЗ-0000

- [ ] Все 5 фаз описаны (§2-§6)
- [ ] Failure-types (§8) — 7 типов
- [ ] Anti-patterns (§9) — 7 правил
- [ ] Pre-condition (8 вопросов)
- [ ] Sanity-check после каждой фазы
- [ ] Finalized block template (§6.2)
- [ ] CLOSURE-REPORT structure (§7.2)

---

## §11. Information flow (кому что передаётся)

### 11.1 Output на каждой фазе

| Фаза | Output | Кому передаётся |
|---|---|---|
| 0 — Pre-condition | NOT-CLOSED report (если fail) | PO |
| 1 — RE-READ | CLOSURE-EXTRACT.md (внутренний) | себя сам |
| 2 — SELF-AUDIT | C-AUDIT-1..7 таблица | внутри CLOSURE-REPORT §2 |
| 3 — Cross-ref | список broken refs (если есть) | PO |
| 4 — Finalization | 🔒 FINALIZED block в source ТЗ | весь проект |
| 5 — Closure Report | `02-CLOSURE-REPORT.md` | PO + следующий агент |

### 11.2 Когда CLOSURE считается полным

ВСЕ 5 фаз завершены + CLOSURE-REPORT создан + PSL-NNN в PROJECT-STATE-LOG.md → только тогда PO может сказать «выключаю агент».

### 11.3 Когда можно «выключить» агента

Строгие правила:

- ✅ CLOSED + CLOSURE-REPORT создан + 🔒 FINALIZED добавлен → PO может выключить.
- ⚠️ CLOSED-WITH-CAVEATS + caveats приняты PO (через PSL-NNN или ask_user) → PO может выключить.
- ❌ NOT-CLOSED → PO НЕ выключает → agent возвращается к рабочей части для fix → reclosе.

### 11.4 Где фиксируется список closure events

В `PROJECT-STATE-LOG.md` каждый closure создаёт NEW запись PSL-NNN. По этой записи можно найти любой closure event в истории проекта.

---

## §12. Глоссарий closure-жаргона

| Термин | Определение |
|---|---|
| **CLOSURE-AGENT** | Агент-исполнитель ТЗ-0000 (он же рабочий агент своего source ТЗ, активирует протокол) |
| **Source ТЗ** | Спецификация, для которой выполняется closure (например ТЗ-001..006, ТЗП-001) |
| **CLOSURE-EXTRACT** | Внутренний файл со списком acceptance criteria (не коммитится) |
| **CLOSURE-REPORT** | Финальный отчёт (`02-CLOSURE-REPORT.md`) |
| **🔒 FINALIZED** | Visual marker в начале source ТЗ, обозначающий closure |
| **🟡 NOT-CLOSED** | Visual marker для НЕ закрытого source ТЗ |
| **Verdict** | ✅ CLOSED / ⚠️ CLOSED-WITH-CAVEATS / ❌ NOT-CLOSED |
| **PC** | Pre-condition (8 шт.) |
| **C-AUDIT-N** | Self-audit check (7 типов) |
| **Closure phase** | 0 (pre-cond) / 1 (re-read) / 2 (audit) / 3 (xref) / 4 (finalize) / 5 (report) |
| **Coverage** | Процент ✅ verified criteria из общего числа |

---

## §13. Финальный self-check ТЗ-0000

- [ ] §0 IN-WORK CHECKLIST заполнен (CLOSURE-AGENT роль)
- [ ] §1 Главный вопрос ясен
- [ ] §2 Pre-condition 8 шт. (#PC1-PC8)
- [ ] §3-§5 три фазы обработки (RE-READ + SELF-AUDIT + CROSS-REF)
- [ ] §6 Finalization block template готов
- [ ] §7 CLOSURE-REPORT структура готова
- [ ] §8 7 типичных failure
- [ ] §9 7 anti-patterns
- [ ] §10 Hard limits не превышены
- [ ] §11 Information flow ясен
- [ ] §12 Glossary полный
- [ ] §13 Self-check пройден

**Если хоть один пункт НЕ выполнен — ТЗ-0000 НЕ считается сданным.**

---

> **Связанные документы:** методология — [`AGENT-METHOD.md` §5.3 + §5.6](../../AGENT-METHOD.md) (правила работы агента); формат — [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md); чеклист — [`CHECKLIST.md`](../../CHECKLIST.md); журнал — [`PROJECT-STATE-LOG.md`](../../PROJECT-STATE-LOG.md); роли — [`AGENT-ROLES.md`](../../AGENT-ROLES.md); надзор — [`ТЗП-001-INTEGRITY-OVERSIGHT.md`](ТЗП-001-INTEGRITY-OVERSIGHT.md); integration — [`99_Справочники/INTEGRATION-PLAN.md`](../../99_Справочники/INTEGRATION-PLAN.md); scoring rubric (5 критериев × 1-5) — [`ТЗ-006-METHODOLOGY-RETROFIT.md`](ТЗ-006-METHODOLOGY-RETROFIT.md).

> **Заключение.** ТЗ-0000 — universal closure protocol. Применяется ко всем 7 существующим спецификациям и к любым будущим ТЗ-NNN / ТЗП-NNN. Только полное прохождение всех 5 фаз даёт право PO «выключить» агента.
