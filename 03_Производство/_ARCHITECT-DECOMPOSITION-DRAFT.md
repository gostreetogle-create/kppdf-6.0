# 03_Производство/_ARCHITECT-DECOMPOSITION-DRAFT.md — Architect decomposition для модуля Производственный заказ

> **Назначение.** Decomposition output работы роли **Архитектор** для модуля `03_Производство/` в проекте KPPDF CRM v6. Применены правила `AGENT-METHOD.md §3 Правило 3.1` (декомпозиция плоского файла >400 строк по 5 тематическим папкам) + ограничения `AGENT-ROLES.md §2.1` (Архитектор НЕ пишет содержимое файлов — только мета-уровень + дерево + таблицу).
>
> **Файл-источник декомпозиции:** [`03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md`](МОДУЛЬ-ПРОИЗВОДСТВО.md) (~480 строк: §0 Глоссарий + §1 Для чего + §2 ЖЦ ЗК 8 статусов + §3 Ключевой сценарий «ЗК-0023 жизнь одного заказа» + §4 Экраны модуля + §5 Бизнес-правила + §6 Связи с другими модулями + §7 Поля ЗК + §8 RBAC + §9 Границы MVP + §10 Open Questions (все закрыты)).
>
> **Дата:** 2026-06-26.
>
> **Метод:** AGENT-METHOD §3 + AGENT-ROLES §2.1.

---

## 1. Дерево папок модуля 03_Производство/

```markdown
03_Производство/
├── README.md                              # 🔵 EXISTING (точка входа модуля, зафиксирована в PSL-010)
├── 00-spr/
│   ├── 00-otkrytye-voprosy.md             # 🔵 EXISTING: 5 baseline OQ для Аналитика Run 1.
│   ├── 00-glossary.md                     # 🆕 NEW: ТОЛЬКО термины модуля (ProductionOrder, ProductionTask, Workshop, Ответственный, Частичная готовность, itemKind, parentProposalId).
│   ├── 00-mvp-boundaries.md               # 🆕 NEW: Что отложено в v2 — Гант-диаграмма, MRP, сдельная ЗП, мобильный станок-UI, мультизавод, ProductionSubTask.
│   ├── 00-order-fields.md                 # 🆕 NEW: Поля ProductionOrder + ProductionTask (§7 МОДУЛЬ-ПРОИЗВОДСТВО) — без FK-схемы (это Моделировщик).
│   └── 00-svyazi.md                       # 🆕 NEW: Связи с другими модулями (§6) — parentProposalId/RESTRICT, parentContractId (NULL-able), StockMovement авто-IN, OrderClosing FK, packageTag виртуальное представление.
├── 01-shablon/
│   ├── 00-README.md                       # 🔵 EXISTING: STUB slot.
│   ├── 01-tipy-zadach.md                  # 🆕 NEW: Типы ProductionTask (ITEM/SERVICE/WORK/INSTALLATION) + правило «StockMovement только для ITEM» (V-015 ✅, GAP-009).
│   └── 01-konstruktor-zadachi.md          # 🆕 NEW: Механика разворачивания позиций КП → задач ЗК (1 позиция → 1 задача, тип → цех → ответственный).
├── 02-redaktor-zakaza/
│   ├── 00-README.md                       # 🔵 EXISTING: STUB slot.
│   ├── 02-doska-zakazov.md                # 🆕 NEW: /production Kanban — все активные ЗК, цветовая разметка по статусам/дедлайнам, фильтры (статус/цех/ответственный/просроченные).
│   ├── 02-detali-zakaza.md                # 🆕 NEW: /production/[id] 3-зонный макет Каркас-Kit (центр: задачи, слева: метаданные, справа: действия).
│   ├── 02-kartochka-zadachi.md            # 🆕 NEW: /production/[orderId]/task/[taskId] — кнопки Начать/Частично/Готово/Сообщить о проблеме.
│   └── 02-knopki-po-statusam.md           # 🆕 NEW: Матрица кнопок по 8 статусам ЗК — какая кнопка в каком статусе доступна, кто может нажать (RBAC §8).
├── 03-zhiznennyj-cikl/
│   ├── 00-README.md                       # 🔵 EXISTING: STUB slot.
│   ├── 03-statusy-zakaza.md               # 🆕 NEW: 8 статусов ЗК + 6 статусов ProductionTask (created/planned/inwork/partial/done/cancelled) — таблица + логика переходов.
│   ├── 03-perehody-zakaza.md              # 🆕 NEW: Таблица переходов + ASCII-диаграмма + 🔴 CROSS-OQ-4 Termination mapping (CANCELLED после PAID КП → сигнал Refund бухгалтеру).
│   └── 03-triggery-na-sklad.md            # 🆕 NEW: Какие lifecycle-события ЗК отправляют сигналы в Склад (COMPLETED → StockMovement IN/PRODUCTION, CANCELLED → встречный возврат полуфабрикатов — OQ для Аналитика).
└── 04-pravila/
    ├── 00-README.md                       # 🔵 EXISTING: STUB slot.
    ├── 04-biznes-pravila.md               # 🆕 NEW: Триггер создания ЗК (PAID КП), snapshot productSku/Name/Unit, 1 КП = 1 ЗК, только ITEM создаёт StockMovement.
    ├── 04-rbac.md                         # 🆕 NEW: 7 ролей × 12 действий матрица (admin/manager/production-head/production-master/storekeeper/accountant/viewer).
    └── 04-edge-keisy.md                   # 🆕 NEW: Частичная готовность, отмена после оплаты, простой станка, конфликт резервов для одного материала, монтаж без ЗК.
```

---

## 2. Сводная таблица NEW файлов

| # | Файл | Вход (§МОДУЛЬ-ПРОИЗВОДСТВО) | Назначение | Target rows | Приоритет |
|---|---|---|---|---|---|
| 1 | `00-spr/00-glossary.md` | §0 (Глоссарий) | Термины — ProductionOrder, ProductionTask, Workshop, Ответственный, Частичная готовность | 80 | 🟡 P1 |
| 2 | `00-spr/00-mvp-boundaries.md` | §9 (границы MVP) | Что отложено в v2 — Гант, MRP, сдельная ЗП, мультизавод, ProductionSubTask, drag-and-drop | 100 | 🟡 P1 |
| 3 | `00-spr/00-order-fields.md` | §7 (поля ЗК + задач) | Поля ProductionOrder (15) + ProductionTask (12) с типом/источником. Без FK-схемы — это Моделировщик | 200 | 🔴 P0 |
| 4 | `00-spr/00-svyazi.md` | §6 (связи с модулями) | parentProposalId RESTRICT, parentContractId NULL-able, StockMovement авто-IN/PRODUCTION, OrderClosing FK, packageTag виртуальное представление | 150 | 🔴 P0 |
| 5 | `01-shablon/01-tipy-zadach.md` | §5.2 правила задач | ITEM/SERVICE/WORK/INSTALLATION — почему только ITEM → склад (V-015 ✅) | 100 | 🟡 P1 |
| 6 | `01-shablon/01-konstruktor-zadachi.md` | §3 (ключевой сценарий) + §5.2 шаг 3-4 | Разворачивание КП позиций → задач ЗК (1 позиция → 1+ задач по типу/цеху) | 130 | 🟡 P1 |
| 7 | `02-redaktor-zakaza/02-doska-zakazov.md` | §4.1 (экран /production) | Kanban с цветовой разметкой по статусам/дедлайнам, фильтры (5 видов), «Только просроченные» | 180 | 🔴 P0 |
| 8 | `02-redaktor-zakaza/02-detali-zakaza.md` | §4.2 (детали ЗК) | 3-зонный макет Каркас-Kit — центр/слева/справа | 130 | 🔴 P0 |
| 9 | `02-redaktor-zakaza/02-kartochka-zadachi.md` | §4.3 (карточка задачи) | Кнопки Начать/Частично/Готово/Проблема + поля план/факт | 100 | 🟡 P1 |
| 10 | `02-redaktor-zakaza/02-knopki-po-statusam.md` | §2 (8 статусов) + §8 RBAC | Матрица кнопок × статусов × 7 ролей | 180 | 🔴 P0 |
| 11 | `03-zhiznennyj-cikl/03-statusy-zakaza.md` | §2 (таблица 8 статусов) | 8 статусов ЗК + 6 статусов ProductionTask с определениями | 130 | 🔴 P0 |
| 12 | `03-zhiznennyj-cikl/03-perehody-zakaza.md` | §2 (диаграмма + правила переходов) | Матрица переходов + ASCII-граф + 🔴 CROSS-OQ-4 Termination mapping + Cross-OQ-1 Refund signal | 180 | 🔴 P0 |
| 13 | `03-zhiznennyj-cikl/03-triggery-na-sklad.md` | §6.3 (связь со Складом) | Авто StockMovement IN/PRODUCTION (V-019 ✅) + встречные возвраты при CANCELLED | 130 | 🔴 P0 |
| 14 | `04-pravila/04-biznes-pravila.md` | §5 (бизнес-правила) | Триггер PAID КП + snapshot полей + 1 КП = 1 ЗК + только ITEM → StockMovement | 180 | 🔴 P0 |
| 15 | `04-pravila/04-rbac.md` | §8 (RBAC матрица) | 7 ролей × 12 действий + «ЗК отменён уведомить бухгалтера» | 180 | 🔴 P0 |
| 16 | `04-pravila/04-edge-keisy.md` | §10 (Q1-Q7 edge-cases) + §6.3 (конфликт) | Частичная готовность, отмена после оплаты, простой станка, конфликт резервов, монтаж | 150 | 🟡 P1 |

---

## 3. Обязательные EXISTING файлы

| # | Файл | Роль | Комментарий |
|---|---|---|---|
| E1 | `03_Производство/README.md` | `# 🔵 EXISTING` | Module root, создан при scaffolding PSL-010 |
| E2 | `03_Производство/00-spr/00-otkrytye-voprosy.md` | `# 🔵 EXISTING` | 5 baseline OQ для Аналитика Run 1 |
| E3 | `03_Производство/01-shablon/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |
| E4 | `03_Производство/02-redaktor-zakaza/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |
| E5 | `03_Производство/03-zhiznennyj-cikl/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |
| E6 | `03_Производство/04-pravila/00-README.md` | `# 🔵 EXISTING` | STUB slot — наполнит Аналитик |

---

## 4. Strategy C compliance check

| Проверка | Результат |
|---|---|
| ✅ Единственная конструктор-папка = `02-redaktor-zakaza` | ✅ Да. Только эта папка имеет `02-` prefix; нет `02-konstruktor-zakaza`, нет `02-spisok-zakazov` |
| ✅ Naming-fence (не пересекаемся с Моделировщиком territory) | ✅ `00-order-fields.md` (НЕ `00-model-zakaza.md`, НЕ `00-schema-zakaza.md` — это зона AGENT-ROLES §2.3) |
| ✅ Glossary vs MVP split | ✅ `00-glossary.md` (только термины §0) + `00-mvp-boundaries.md` (отложено §9) |
| ✅ Module-root README в дереве | ✅ `03_Производство/README.md` (E1) |
| ✅ Cross-OQ маппинг присутствует | ✅ 4 CROSS-OQ явно распределены (см. §5) |
| ✅ Hard limit ≤ 400 строк на каждый NEW файл | ✅ Все target rows в пределах 80-200 |
| ✅ Один архитектурный уровень (Architect NOT Analyst) | ✅ Только мета-уровень — дерево + таблица, без содержимого правил/полей |
| ✅ Existing файлы сохранены (не дублированы/не удалены) | ✅ 6 EXISTING файлов перечислены, не пересоздаются |

---

## 5. Cross-OQ mapping (из `99_Справочники/CROSS-MODULE-OQ.md`)

| Cross-OQ | Решается в NEW файле | Как именно |
|---|---|---|
| **CROSS-OQ-1 Refund** | `03-zhiznennyj-cikl/03-perehody-zakaza.md` + `04-pravila/04-biznes-pravila.md` + `00-spr/00-svyazi.md` | Переход в CANCELLED при условии `Proposal.status='PAID'` → явный UI-маркер «Бухгалтер, оформите Refund» (СПОР-12 + GAP-023 ✅) |
| **CROSS-OQ-2 Reserve** | `00-spr/00-svyazi.md` + `03-zhiznennyj-cikl/03-triggery-na-sklad.md` | ЗК не управляет Reservation напрямую — это Склад. ЗК COMPLETED → авто-IN → Снимает резерв. Document-only интерфейс (см. OQ-002) |
| **CROSS-OQ-3 Cost** | `00-spr/00-svyazi.md` + `03-zhiznennyj-cikl/03-triggery-na-sklad.md` | Авто-IN с `sourcePurchasePrice=ЗК.costOfGoods` (если есть) — формула для Аналитика Run 1 |
| **CROSS-OQ-4 Termination** | `03-zhiznennyj-cikl/03-perehody-zakaza.md` + `04-pravila/04-rbac.md` | CANCELLED — финальный статус; матрица RBAC: только начальник производства / директор могут отменить. UI-маркер при CANCELLED+PAID = сигнал Refund в Финансы |

---

## 6. Footer

**Итог: 16 NEW + 6 EXISTING = 22 файла** в дереве `03_Производство/`. Разбивка NEW:

| Пaпка | Кол-во NEW |
|---|---|
| `00-spr/` | 4 (glossary, mvp-boundaries, order-fields, svyazi) |
| `01-shablon/` | 2 (tipy-zadach, konstruktor-zadachi) |
| `02-redaktor-zakaza/` | 4 (doska-zakazov, detali-zakaza, kartochka-zadachi, knopki-po-statusam) |
| `03-zhiznennyj-cikl/` | 3 (statusy-zakaza, perehody-zakaza, triggery-na-sklad) |
| `04-pravila/` | 3 (biznes-pravila, rbac, edge-keisy) |

**Следующий шаг pipeline:** Аналитик Run 1/5 для модуля `03_Производство/` — наполнит 16 NEW STUB рабочими правилами/инвариантами по матрице `01_КП/LAUNCH-ANALYST.md` (mirrored для каждого модуля).

---

## 7. Версионирование Architect draft

| Версия | Дата | Что |
|---|---|---|
| 1.0 | 2026-06-26 | Baseline. 16 NEW + 6 EXISTING = 22 файла. Применены 4 preventive FIX (root README, naming-fence, glossary/MVP split, count math). Cross-OQ-1/2/3/4 маппинг на 5 разных файлов |

> **Architect role boundary** (per AGENT-ROLES §2.1): это **мета-документ — декомпозиция**. Содержимое NEW файлов (правила, поля, переходы, RBAC) — работа **Аналитика Run 1**, не Архитектора.
