# 02_Договор/_ARCHITECT-DECOMPOSITION-DRAFT.md — Architect Decomposition Output (final)

> **Назначение.** Это артефакт работы Архитектора для модуля Договор. Сохранён как **draft** для прозрачности (PSL-010 → PSL-010a attribute). Не заменяет существующие STUB-файлы. Содержит ТОЛЬКО мета-уровень: дерево папок + сводная таблица файлов. Контент — работа Аналитика Run 1 (после успешного завершения Архитектора).

## 0. Контекст запуска

- **Launch-package:** [`02_Договор/LAUNCH-ARCHITECT-02.md`](LAUNCH-ARCHITECT-02.md) (PSL-010)
- **Роль:** Архитектор per [`AGENT-ROLES.md` §2.1](../../AGENT-ROLES.md)
- **Вход:** 11 файлов (4 agent-infra + 1 CROSS-MODULE-OQ + МОДУЛЬ-ДОГОВОР + 5 STUB-маркеров)
- **Output strategy:** только TREE + SUMMARY TABLE (NO content per Ограничение #1 в LAUNCH-ARCHITECT-02 §2)

## 1. Дерево папок модуля 02_Договор/

```
02_Договор/
├── README.md                                          # 🔵 EXISTING (PSL-010) — модульная точка входа, НЕ ТРОГАТЬ
├── 00-spr/                                            [Справочники]
│   ├── 00-otkrytye-voprosy.md                        # 🔵 EXISTING — 5 baseline OQ (НЕ ТРОГАТЬ, Аналитик Run 1 заполнит ответы)
│   ├── 00-glossary.md                  # 🆕 §0 — терминология (Д-XXXX, Спецификация, Рамочный)
│   ├── 00-mvp-boundaries.md            # 🆕 §9 — что отложено в v2 (ЭЦП, ЭДО, мобайл, …)
│   ├── 00-contract-fields.md           # 🆕 §7 — поля Contract + ContractItem (НЕ Prisma schema — territory Моделировщика §2.3)
│   └── 00-svyazi.md                    # 🆕 §6 — связи с КП, Производством, Финансами
├── 01-shablon/                                        [Шаблоны]
│   ├── 00-README.md                    # 🔵 EXISTING — STUB slot точки входа папки
│   ├── 01-konstruktor-shablona.md      # 🆕 §1, §4.3 — токены {{contractor.name}} + структура макетов DocumentTemplate
│   └── 01-primery-shablonov.md         # 🆕 §0 — типы договоров (рамочный vs со Спецификацией)
├── 02-redaktor-dogovora/                              [Конструктор — СТРАТЕГИЯ C: ЗАФИКСИРОВАНО]
│   ├── 00-README.md                    # 🔵 EXISTING — STUB slot
│   ├── 02-spisok-dogovorov.md          # 🆕 §4.1 — экран /contracts + фильтры
│   ├── 02-redaktor-ui.md               # 🆕 §4.2 — 3-зонный Каркас-Kit (лево/центр/право) + кнопки
│   ├── 02-konvertaciya.md              # 🆕 §3 — КЛЮЧЕВОЙ СЦЕНАРИЙ: КП → Договор (snapshot + Д-XXXX)
│   └── 02-specifikaciya-i-pdf.md       # 🆕 §4.3 — UI Спецификации + рендеринг PDF через DocumentTemplate
├── 03-zhiznennyj-cikl/                                [Жизненный цикл]
│   ├── 00-README.md                    # 🔵 EXISTING — STUB slot
│   ├── 03-statusy-i-perehody.md        # 🆕 §2 — 7 статусов (DRAFT → SENT → SIGNED → IN_PROGRESS → COMPLETED → ARCHIVED + TERMINATED) + переходы + ASCII
│   ├── 03-triggery-avtomatizacii.md    # 🆕 §11 — SIGNED → авто create Order (СПОР-5) + авто-каскады
│   └── 03-terminated.md                # 🆕 🔴 CROSS-OQ-4 — ЖЦ TERMINATED + каскадный откат Order (СПОР-3 + V-027)
└── 04-pravila/                                        [Ограничения]
    ├── 00-README.md                    # 🔵 EXISTING — STUB slot
    ├── 04-biznes-pravila.md            # 🆕 §5 — правила конвертации/версий/спецификации/snapshot/юр.реквизитов
    ├── 04-rbac.md                      # 🆕 §8 — матрица 7 ролей × 10 действий
    └── 04-termination-rbac.md          # 🆕 🔴 CROSS-OQ-4 — RBAC director на TERMINATED + REFUND-сигнал бухгалтеру
```

## 2. Сводная таблица новых файлов (16 шт)

| # | Файл | Вход (МОДУЛЬ-ДОГОВОР.md) | Назначение | Target rows | Приоритет |
|---|---|---|---|---|---|
| 1 | `00-spr/00-glossary.md` | §0 | Терминология (Д-XXXX, Спецификация, Рамочный) | 80-150 | 🟢 Высокий |
| 2 | `00-spr/00-mvp-boundaries.md` | §9 | Что НЕ делаем в v1 (ЭЦП, ЭДО, мобайл, multi-lang, …) | 60-100 | 🔵 Низкий |
| 3 | `00-spr/00-contract-fields.md` | §7 | Поля Contract + ContractItem (НЕ Prisma schema — это зона Моделировщика per §2.3) | 100-200 | 🟢 Высокий |
| 4 | `00-spr/00-svyazi.md` | §6 | Связи с КП, Производством, Финансами (parentProposalId, parentContractId, customerId, contractorId) | 80-150 | 🟡 Средний |
| 5 | `01-shablon/01-konstruktor-shablona.md` | §4.3 | Токены + структура макетов (DocumentTemplate) | 80-120 | 🔵 Низкий |
| 6 | `01-shablon/01-primery-shablonov.md` | §0 | Типы договоров (рамочный vs со Спецификацией) | 40-80 | 🔵 Низкий |
| 7 | `02-redaktor-dogovora/02-spisok-dogovorov.md` | §4.1 | Экран `/contracts` + фильтры (статус, клиент, дата, «только мои») | 80-120 | 🟡 Средний |
| 8 | `02-redaktor-dogovora/02-redaktor-ui.md` | §4.2 | 3-зонный Каркас-Kit (лево/центр/право) + кнопки по статусам + версии | 120-200 | 🟢 Высокий |
| 9 | `02-redaktor-dogovora/02-konvertaciya.md` | §3 | КЛЮЧЕВОЙ СЦЕНАРИЙ: Конвертация КП → Договор (snapshot + Д-XXXX) | 100-150 | 🟢 Высокий |
| 10 | `02-redaktor-dogovora/02-specifikaciya-i-pdf.md` | §4.3 + §5.2 | UI Спецификации (рамочный vs обычный) + рендеринг PDF через DocumentTemplate | 80-120 | 🟡 Средний |
| 11 | `03-zhiznennyj-cikl/03-statusy-i-perehody.md` | §2 | 7 статусов + таблица переходов + ASCII-диаграмма | 150-250 | 🟢 Высокий |
| 12 | `03-zhiznennyj-cikl/03-triggery-avtomatizacii.md` | §11 | SIGNED → авто create Order (СПОР-5); COMPLETED ЗК → авто close Order (если есть связь) | 80-120 | 🟢 Высокий |
| 13 | `03-zhiznennyj-cikl/03-terminated.md` | Cross-OQ-4 | TERMINATED lifecycle + каскадный откат Order (если был SIGNED) + Refund-сигнал | 100-150 | 🔴 Высокий |
| 14 | `04-pravila/04-biznes-pravila.md` | §5 | 5 групп правил (создание, спецификация, статусы, версии, юр.реквизиты) | 150-250 | 🟢 Высокий |
| 15 | `04-pravila/04-rbac.md` | §8 | Матрица 7 ролей × 10 действий (видимость списка, конвертация, редактирование, …) | 80-150 | 🟢 Высокий |
| 16 | `04-pravila/04-termination-rbac.md` | §8 + Cross-OQ-4 | RBAC для TERMINATED (только director?) + регламент REFUND-сигнала бухгалтеру | 60-100 | 🔴 Высокий |

## 3. Existing files — kept as-is (НЕ ТРОГАТЬ)

- `02_Договор/README.md` — модульная точка входа (PSL-010)
- `02_Договор/00-spr/00-otkrytye-voprosy.md` — 5 baseline OQ (Аналитик Run 1)
- `02_Договор/01-shablon/00-README.md` — STUB slot
- `02_Договор/02-redaktor-dogovora/00-README.md` — STUB slot
- `02_Договор/03-zhiznennyj-cikl/00-README.md` — STUB slot
- `02_Договор/04-pravila/00-README.md` — STUB slot

## 4. Стратегия C compliance ✅

| Constraint | Result |
|---|---|
| Конструктор-папка = `02-redaktor-dogovora` (НЕ `02-konstruktor-dogovora`) | ✅ ЗАФИКСИРОВАНО |
| Иерархия 5 папок по AGENT-METHOD §3 Правило 3.1 | ✅ |
| Cross-OQ-4 (Termination) явно отражён в дереве | ✅ (2 файла: `03-terminated.md` + `04-termination-rbac.md`) |
| 5 baseline OQ включены в дерево (НЕ дублированы, НЕ удалены) | ✅ (`00-spr/00-otkrytye-voprosy.md`) |
| Существующие STUB-маркеры учтены | ✅ (6 шт: 1 модульный root + 4 subdir README + 1 OQ) |
| Hard limit ≤ 400 строк на каждый предложенный файл | ✅ (max target 250 в `03-statusy-i-perehody.md` и `04-biznes-pravila.md`) |

## Итог: 16 NEW + 6 EXISTING = **22 файла** в дереве

## 5. Источники (НЕ изменены)

- [`AGENT-ENTRYPOINT.md`](../../AGENT-ENTRYPOINT.md)
- [`AGENT-ROLES.md` §2.1](../../AGENT-ROLES.md)
- [`AGENT-METHOD.md` §3 Правило 3.1](../../AGENT-METHOD.md)
- [`AGENT-PROMPTS.md` §1](../../AGENT-PROMPTS.md)
- [`AGENT-FORMAT.md`](../../AGENT-FORMAT.md)
- [`AGENT-REVIEW.md` §1.6](../../AGENT-REVIEW.md)
- [`../../99_Справочники/CROSS-MODULE-OQ.md`](../../99_Справочники/CROSS-MODULE-OQ.md)
- [`LAUNCH-ARCHITECT-02.md`](LAUNCH-ARCHITECT-02.md)
- [`МОДУЛЬ-ДОГОВОР.md`](МОДУЛЬ-ДОГОВОР.md) — распускается по 16 NEW STUB
- 6 × existing STUB (1 README + 4 subdir-README + 1 OQ)

## 6. Версия

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Architect decomposition для `02_Договор/`. Final: **16 NEW STUB + 6 EXISTING = 22 файла**. Strategy C `02-redaktor-dogovora` ЗАФИКСИРОВАНО. Cross-OQ-4 (Termination) отражён в 2 файлах. Module-root README включён в дерево. **Rev2 (2026-06-26):** применено 4 SHOULD-FIX от code-reviewer — (1) добавлен модульный `README.md` как 6-й EXISTING, (2) `00-model-dannyh.md` → `00-contract-fields.md` для отграничения от зоны Моделировщика, (3) split `00-glossary.md` → `00-glossary.md` + `00-mvp-boundaries.md` для отдельных тем, (4) арифметика count исправлена → итог 16 NEW + 6 EXISTING = 22 файла. |
