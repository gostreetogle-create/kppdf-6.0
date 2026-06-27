# LAUNCH-COORDINATOR.md — Package для запуска роли Координатор (handoff между сессиями + итоговая сводка)

> **Назначение.** Готовый copy-paste пакет для запуска **Координатора** (роль Pipeline v6 по [`AGENT-ROLES.md`](../AGENT-ROLES.md) §2.7) в новой сессии Codebuff. Подготовлен 2026-06-27 по паттерну LAUNCH-ARCHITECT/ANALYST/AUDITOR/MODELER.
>
> **Когда использовать.** После завершения **всех 6 рабочих ТЗ + AUDITOR (✅ PASS verdict)** + **Phase 1 Bootstrap Prisma** + **Phase 2 Mantine UI MVP**. Координатор — финальная роль, которая собирает все артефакты, формирует итоговый отчёт для PO, и подготавливает handoff на следующий проект.
>
> **Trigger:** фраза PO *«Запусти Координатор — подготовь итоговую сводку»* или *«Закрытие проекта v6 — финальный handoff»*.

---

## 0. Что должно произойти (READ THIS FIRST)

> **⚠️ ПОРЯДОК:**
>
> 1. Этот файл полностью.
> 2. [`AGENT-ROLES.md`](../AGENT-ROLES.md) §2.7 «Координатор».
> 3. [`INTEGRATION-PLAN.md`](../99_Справочники/INTEGRATION-PLAN.md) §9 (финальный pipeline).
> 4. [`CHECKLIST.md` §12](../CHECKLIST.md) (running notes Архистратора).
> 5. PROJECT-STATE-LOG.md (все 18+ PSL entries).
>
> После прочтения — открыть сессию Codebuff по §1.

---

## 1. Файлы для attach (6 файлов)

| # | Путь | Зачем |
|---|---|---|
| 1 | [`AGENT-ENTRYPOINT.md`](../AGENT-ENTRYPOINT.md) | Точка входа |
| 2 | [`AGENT-ROLES.md`](../AGENT-ROLES.md) | §2.7 Координатор |
| 3 | [`CHECKLIST.md`](../CHECKLIST.md) | Snapshot текущего состояния |
| 4 | [`PROJECT-STATE-LOG.md`](../PROJECT-STATE-LOG.md) | Все PSL-001..018+ |
| 5 | [`INTEGRATION-PLAN.md`](../99_Справочники/INTEGRATION-PLAN.md) | Финальный merge order |
| 6 | (опционально) [`AUDIT-REPORT.md`](../99_Справочники/TASKS/AUDIT-REPORT.md) если уже создан | Финальный verdict |

---

## 2. Промпт для Codebuff

```text
Ты — Координатор (финальная роль Pipeline v6). Прочитай [FILES_ATTACHED].

🎯 ГЛАВНАЯ ЦЕЛЬ: Подготовить 1 финальный документ:
   FINAL-PROJECT-SUMMARY.md — итоговая сводка проекта KPPDF CRM v6
   для handoff на следующий проект / для заказчика.

Вход: всё что сделано в проекте (17+ PSL, 7+ ТЗ/ТЗП, AUDIT-REPORT,
       Phase 1 Bootstrap Prisma если готов, Phase 2 Mantine UI если готов).

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ

1. **СТРОГО READ-ONLY Роль**: НЕ изменять существующие файлы,
   НЕ создавать новый контент в существующих .md. Только создать
   1 файл: FINAL-PROJECT-SUMMARY.md в корне.

2. **Структура FINAL-PROJECT-SUMMARY.md** СТРОГО следующая:
   - §0 Executive summary (версия, дата, вердикт, метрики)
   - §1 Что доставлено (deliverables list)
   - §2 Что НЕ доставлено (gaps / known issues)
   - §3 Timeline (от PSL-001 до текущего момента)
   - §4 Команда (роли + их вклад)
   - §5 Метрики (LoC / файлы / тесты / coverage)
   - §6 Handoff notes (для следующего проекта)
   - §7 Lessons learned
   - §8 Версия и подписи

3. **Сбор метрик через bash**: используй `wc -l`, `find -name`, `pnpm test`
   чтобы цитаты были точными.

4. **Включить Top-5 рисков** из AUDIT-REPORT.md (если файл существует).

5. **НЕ преувеличивай** — если что-то не готово, честно напиши
   «❌ НЕ готово» (НЕ «частично готово»).

6. **Hard limit FINAL-PROJECT-SUMMARY**: ≤ 600 строк target,
   ≤ 800 hard limit.

Применяй ТЗ-0000 (universal closure protocol) перед сдачей.
```

---

## 3. Ожидаемый формат ответа

```markdown
## FINAL-PROJECT-SUMMARY.md (генерируется Координатором)

| # | Раздел | Кол-во строк |
|---|---|---|
| 0 | Executive summary | ~30 |
| 1 | Что доставлено | ~150 |
| 2 | Что НЕ доставлено | ~80 |
| 3 | Timeline | ~50 |
| 4 | Команда | ~60 |
| 5 | Метрики | ~80 |
| 6 | Handoff notes | ~100 |
| 7 | Lessons learned | ~50 |
| 8 | Версия и подписи | ~30 |
| **Всего** | | **≤ 600** |
```

---

## 4. Пост-обработка

### Шаг A: Verify FINAL-PROJECT-SUMMARY

```bash
wc -l FINAL-PROJECT-SUMMARY.md
# Target ≤ 600. Hard limit ≤ 800.
```

### Шаг B: Git tag (новый milestone)

```bash
git add FINAL-PROJECT-SUMMARY.md
git commit -m "chore(docs): FINAL-PROJECT-SUMMARY — v6.0 milestone complete"

git tag -a v6.0-final -m "KPPDF CRM v6.0 final closure summary"
git push origin main --follow-tags
```

### Шаг C: Handoff to Bash/Archive

```bash
# Archive (если есть папка):
cp -r kppdf-6.0 archive/kppdf-6.0-final
```

---

## 5. Контроль качества

✅ CHECK 1: FINAL-PROJECT-SUMMARY.md ≤ 800 строк.
✅ CHECK 2: Включены все 8 разделов из §2 промпта.
✅ CHECK 3: Метрики собраны через bash (НЕ оценки).
✅ CHECK 4: ТЗ-0000 применён (CLOSEURE-REPORT.md создан).
✅ CHECK 5: Git tag v6.0-final создан.

---

## 6. Связанные документы

- [`AGENT-ROLES.md`](../AGENT-ROLES.md) §2.7
- [`INTEGRATION-PLAN.md`](../99_Справочники/INTEGRATION-PLAN.md) §9
- [`CHECKLIST.md`](../CHECKLIST.md) §12 (running notes)
- [`PROJECT-STATE-LOG.md`](../PROJECT-STATE-LOG.md) (audit trail)
- `LAUNCH-ARCHITECT.md` / `LAUNCH-ANALYST.md` / `LAUNCH-AUDITOR.md` (mirror structure)

---

## 7. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание пакета. Последняя недостающая роль из §4. Финал Pipeline v6 — handoff на следующий проект. |
