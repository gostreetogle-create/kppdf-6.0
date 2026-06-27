# LAUNCH-MODELER.md — Package для запуска Моделировщика Prisma (Phase 1 Bootstrap + миграции)

> **Назначение.** Готовый copy-paste пакет для запуска **Моделировщика** (Prisma specialist) в новой сессии Codebuff. Подготовлен 2026-06-27 по паттерну LAUNCH-ARCHITECT/LAUNCH-ANALYST/LAUNCH-AUDITOR. Закрывает дыру в [`CHECKLIST.md` §4 Карта ролей](../CHECKLIST.md) (TBD → ✅).
>
> **Когда использовать.** После того как **Аналитики Run 1..5 завершены** (для всех 5 модулей: КП, Договор, Производство, Склад, Финансы) + **REGISTRY-OF-RULES.md создан** + **baseline schema от `00kppdf-5.0` клонирован**. Моделировщик работает с ТЗ-004 (Phase 1 Bootstrap Prisma) для КП и расширяет schema на 4 не-КП модуля по [`MODULE-DECOMPOSITION-PLAN.md`](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md).
>
> **Trigger:** фраза PO *«Запустить Моделировщик для Phase 1 Bootstrap Prisma / расширения 4 модулей»* или *«Применить ТЗ-004 + ТЗ-011»*.

---

## 0. Что должно произойти (READ THIS FIRST)

> **⚠️ ПОРЯДОК ЧТЕНИЯ:**
>
> 1. `[`LAUNCH-MODELER.md`](LAUNCH-MODELER.md)` полностью (этот файл).
> 2. [СТЕК-ПРЕДПИСАНИЕ.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) §1-3 (Phase C миграции).
> 3. [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md) (Phase 1 Bootstrap для КП).
> 4. [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9 (Prisma по 4 модулям).
> 5. SCHEMA-CONSULIDATED.md, RBAC-MATRIX.md.
>
> После прочтения — следуй §1.

---

## 1. Файлы для attach (8 штук, в этом порядке)

### Пакет A — Агентная инфраструктура (3 файла)

| # | Путь | Зачем |
|---|---|---|
| 1 | [`AGENT-ENTRYPOINT.md`](../AGENT-ENTRYPOINT.md) | Точка входа |
| 2 | [`AGENT-ROLES.md`](../AGENT-ROLES.md) §2.3 «Моделировщик» |
| 3 | [`AGENT-METHOD.md`](../AGENT-METHOD.md) §3 «Правило 3.1» + §4.5 STUB |

### Пакет B — Канонический контекст (3 файла)

| # | Путь | Зачем |
|---|---|---|
| 4 | [СТЕК-ПРЕДПИСАНИЕ.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) | Версии пакетов (Prisma 7.8 + PostgreSQL 16) |
| 5 | [SCHEMA-CONSOLIDATED.md](../99_Справочники/SCHEMA-CONSOLIDATED.md) | 32+ сущностей по 5 модулям |
| 6 | [RBAC-MATRIX.md](../99_Справочники/RBAC-MATRIX.md) | 7 ролей × 30 действий |

### Пакет C — Spec для работы (2 файла)

| # | Путь | Зачем |
|---|---|---|
| 7 | [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md) | Конкретные 3 миграции (правки A/E/F) |
| 8 | [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9 | Расширение на 4 не-КП модуля |

---

## 2. Промпт для Codebuff (СКОПИРОВАТЬ ЦЕЛИКОМ)

```text
Ты — Моделировщик (Prisma specialist). Прочитай [FILES_ATTACHED]
в порядке (Пакеты A → B → C).

🎯 ГЛАВНАЯ ЦЕЛЬ: Создать schema.prisma для kppdf-6.0 на основе
   baseline kppdf-5.0 + применить 3 миграции из ТЗ-004 (правки A/E/F)
   + расширить schema на 4 не-КП модуля согласно MODULE-DECOMPOSITION-PLAN.md §9.

Вход baseline: kppdf-5.0/ (47 моделей). Копируй в kppdf-6.0/.
Выход: schema.prisma (≥600 строк) + 3 миграции (правки A/E/F) +
       4 module-specific extensions.

⛔ КРИТИЧЕСКИЕ ОГРАНИЧЕНИЯ

1. **СТРОГО ЗАПРЕЩЕНО** менять логику бизнес-правил — это работа
   Аналитика. Ты работаешь с СТРУКТУРОЙ БД.

2. **Каждое поле имеет DTO + onDelete правило:**
   - onDelete: Cascade для owned relations (Comment → parent)
   - onDelete: Restrict для business relations (Contract → Client)
   - onDelete: SetNull для soft references

3. **Версии пакетов — STРОГО из СТЕК-ПРЕДПИСАНИЕ.md:**
   - Prisma = 7.8
   - PostgreSQL = 16
   - pnpm = 9.x
   - Не подменять версии.

4. **88 baseline Vitest MUST pass** после миграций.
   `pnpm test` exit code = 0 обязателен.

5. **Husky gates** — pre-commit запускает `tsc --noEmit && eslint
   && prettier --check`. Все 0 ошибок.

6. **Naming convention — camelCase**: User.id, User.createdAt,
   ContractItem.priceSnapshot (НЕ snake_case).

7. **Index добавлены на FK-поля**: projectId, clientId, statusId,
   authorId (как минимум). Для полей с фильтрацией >100 записей.

8. **Soft-delete pattern**: deletedAt DateTime? поле в каждой
   root-entity (per REGISTRY § 5 «Soft-delete Rule»).

Примени ТЗ-0000 (universal closure protocol) перед сдачей:
- 6 фаз: pre-condition → RE-READ → SELF-AUDIT → CROSS-REF → 🔒 FINALIZED →
  CLOSURE-REPORT.
- Создай CLOSURE-REPORT.md рядом с kppdf-6.0/.

ВЫХОД: schema.prisma + 3 миграции + package.json + .husky/ + baseline test result.
Acceptance: `pnpm install && pnpm prisma migrate dev && pnpm test` exit 0.
```

---

## 3. Ожидаемый формат ответа

```markdown
## Phase 1 Bootstrap Prisma Report

| Deliverable | Статус |
|---|---|
| kppdf-6.0/ cloned | ✅ |
| schema.prisma (≥600 lines) | ✅ |
| Migration #1 (правка A) | ✅ |
| Migration #2 (правка E) | ✅ |
| Migration #3 (правка F) | ✅ |
| package.json (4 prod deps) | ✅ |
| Husky gates | ✅ |
| `pnpm install` | ✅ exit 0 |
| `pnpm prisma migrate dev` | ✅ exit 0 |
| `pnpm tsc --noEmit` | ✅ exit 0 |
| `pnpm test` (88 baseline) | ✅ 88/88 |
| `pnpm eslint` | ✅ exit 0 |

## Cross-References integrity

- Все 32+ сущности из SCHEMA-CONSOLIDATED.md покрыты в schema.prisma
- Все RBAC-правила из RBAC-MATRIX.md имеют соответствующие field-
  level permissions
```

---

## 4. Пост-обработка

### Шаг A: Verify hard limits

```bash
cd 'kppdf-6.0'
wc -l prisma/schema.prisma
# Target: 600-1500. Hard: 2000.
```

### Шаг B: Commit + push

```bash
git add prisma/ package.json .husky/ tsconfig.json
git commit -m "feat(db): Phase 1 Bootstrap Prisma — kppdf-6.0 schema + 3 migrations

- schema.prisma: 32+ entities from SCHEMA-CONSULIDATED
- Migration #1: правка A (ContractItem.priceSnapshot nullable)
- Migration #2: правка E (drop DocPackage + packageTag)
- Migration #3: правка F (new Comment entity)
- Husky gates: tsc + eslint + prettier pre-commit
- 88 baseline Vitest pass

Refs: STACK-PRESCRIPTION, ТЗ-004, MODULE-DECOMPOSITION-PLAN §9"
```

### Шаг C: Trigger Phase 2 UI

Запустить следующую роль — **UX-дизайнер** через `LAUNCH-UX-DESIGNER.md` (TODO — создать по образцу).

---

## 5. Контроль качества

✅ CHECK 1: `pnpm test` 88/88. Baseline не сломан.
✅ CHECK 2: `pnpm tsc --noEmit` clean.
✅ CHECK 3: `pnpm prisma validate` OK.
✅ CHECK 4: Все 32+ сущности в schema.prisma.
✅ CHECK 5: ТЗ-0000 применён (CLOSEURE-REPORT.md создан).

---

## 6. Связанные документы

- [STACK-PRESCRIPTION.md](../99_Справочники/СТЕК-ПРЕДПИСАНИЕ.md) (миграции Phase C)
- [ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md](../99_Справочники/TASKS/ТЗ-004-PHASE-1-BOOTSTRAP-PRISMA.md)
- [MODULE-DECOMPOSITION-PLAN.md](../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §9
- [LAUNCH-ARCHITECT.md](LAUNCH-ARCHITECT.md) — образец структуры

---

## 7. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-27 | Создание пакета. Mirror LAUNCH-ARCHITECT/ANALYST/AUDITOR структура. Закрывает дыру §4 «TBD — создать когда понадобится». |
