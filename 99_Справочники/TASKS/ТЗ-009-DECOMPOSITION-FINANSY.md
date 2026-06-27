# ТЗ-009 — DECOMPOSITION-FINANSY (Декомпозиция `05_Финансы/` в 5-tier hierarchy)

> ## 🔒 FINALIZED 2026-06-27 12:30
>
> **Агент:** Architect / mimo-auto
> **Verdict:** ✅ CLOSED
> **Source ТЗ:** `99_Справочники/TASKS/ТЗ-009-DECOMPOSITION-FINANSY.md`
> **Closure report:** `99_Справочники/TASKS/ТЗ-009-DECOMPOSITION-FINANSY_02-CLOSURE-REPORT.md`
> **Заблокировано для дальнейших правок без нового PSL-NNN.**

> **Назначение.** Техзадание для параллельного **Архитектора** — декомпозиция модуля `05_Финансы/` согласно [`MODULE-DECOMPOSITION-PLAN.md` §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md). Mirror-паттерн: PSL-004 (КП), PSL-021 (Договор), ТЗ-007 (Производство), ТЗ-008 (Склад).
>
> **Когда запускать.** Параллельно с ТЗ-007/008 (zero conflict — write в РАЗНЫЕ папки).
>
> **Объём:** ~750-850 строк hard limit ≤1000.

---

## §0 IN-WORK (Pre-action Checklist по PSL-009)

**PC-1.** Прочитан [`MODULE-DECOMPOSITION-PLAN.md` §5](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) — дерево STUB для `05_Финансы/`.

**PC-2.** Прочитан [`05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`](../../../05_Финансы/МОДУЛЬ-ФИНАНСЫ.md) (~280 строк). Цели декомпозиции: 11 разделов V0 (определение / глоссарий / для кого / Order lifecycle / chain links / экраны / правила / что в v1 / закрытые Q / связи / Поля данных).

**PC-3.** Прочитан [`02_Договор/`](../../../02_Договор/) как mirror (PSL-021).

**PC-4.** Source cross-refs готовы:
- `Order` — отдельная сущность (СПОР-13)
- `Payment` с типом `INCOMING` или `STORNO` (СПОР-7 ручной выбор счёта через dropdown)
- `Refund` — **отдельная сущность** от Payment (GAP-023 ✅ РЕШЕНО)
- `Contract.status` расширен `+ 'TERMINATED'` (правка #3 МАСТЕР-АУДИТ-V6.md)
- `Order.status` расширен `+ 'CANCELLED'` (24.06.2026)
- Currency RUB жёстко (СПОР-14)

**PC-5.** Подсчёт STUB файлов: **18 файлов** (5 00-spr + 4 05-konstruktor + 3 05-zhiznennyj + 3 05-pravila + 5 entrypoints + 1 корневой README = 19). **Корректирую** на **19 файлов**.

**PC-6.** Hard limits: каждый файл ≤250 строк.

**PC-7.** Модуль Финансы — **финальный** в DAG (КП → Договор → Производство → Склад → Финансы). Это критическая зависимость: Phase 1 Bootstrap миграций для Финансы покрывает 5+ entities (`Order`, `Invoice`, `Payment`, `Refund`, `OrderClosing`).

**PC-8.** Проверены все 8 закрытых Q из МОДУЛЬ-ФИНАНСЫ §8 (все ✅ РЕШЕНО).

---

## §1 Mission (миссия)

**Цель:** Создать **19 STUB файлов** для модуля `05_Финансы/`, организованных в 5-tier folder hierarchy (mirror КП/Договор/Производство/Склад). Каждый STUB — мета-файл (папка + имя + 1-2 строки назначения + source cross-ref + план наполнения для Run 5 Аналитика).

**Out-of-mission (явно):**
- ❌ Содержимое правил — Run 5 Аналитика.
- ❌ Удалять `МОДУЛЬ-ФИНАНСЫ.md` — после Run 5.
- ❌ Prisma schema — Phase 1 Bootstrap (для Финансы — расширение ТЗ-004 или ТЗ-011).
- ❌ Банковская интеграция / 1С — v2 отложено (`МОДУЛЬ-ФИНАНСЫ.md` §7 явно).
- ❌ Multi-currency — v2 (СПОР-14).

---

## §2 Scope

### 2.1 Что ВХОДИТ (✅)

```
05_Финансы/
├── README.md                              # Entrypoint
├── 00-spr/                                # 6 + entrypoint = 7
│   ├── 00-README.md
│   ├── 00-glossary.md                     # Order, Invoice, Payment, Refund, OrderClosing, balance
│   ├── 00-orgs.md                         # Банки, налоговые, контрагенты
│   ├── 00-products.md                     # Себестоимость (costOfGoodsSold из Склад)
│   ├── 00-clients.md                      # Контрагенты
│   ├── 00-out-of-scope.md                 # Что НЕ входит (банк-интеграция, v2, multi-currency)
│   └── 00-otkrytye-voprosy.md             # 5 baseline OQ для Run 5
├── 05-konstruktor-finansov/               # 3 + entrypoint = 4
│   ├── 00-README.md
│   ├── 05-scheta.md                       # Invoice (аванс / основной / корректировочный)
│   ├── 05-platezhi.md                     # Payment (INCOMING / STORNO)
│   └── 05-refundy.md                      # Refund (отдельная сущность, GAP-023)
├── 05-zhiznennyj-cikl/                    # 2 + entrypoint = 3
│   ├── 00-README.md
│   ├── 05-statusy.md                      # Статусы Order/Invoice/Payment (5 + 5 + 2)
│   └── 05-nalogovyi-uchet.md              # УСН / НДС (СПОР-14)
└── 05-pravila/                            # 2 + entrypoint = 3
    ├── 00-README.md
    ├── 05-rbac.md                         # RBAC Финансы ≥30 правил (5 ролей × ~10 действий)
    └── 05-biznes-pravila.md               # Инварианты (saldo=0 = закрытие, Сторно rules, Refund rules)
```

### 2.2 Что НЕ входит (❌)

1. Содержимое правил — Run 5 Аналитика.
2. Prisma schema — Phase 1/2 Bootstrap (ТЗ-004/011).
3. Банковская интеграция — v2 отложено.
4. Multi-currency — v2 (СПОР-14).
5. Удаление `МОДУЛЬ-ФИНАНСЫ.md` — после Run 5.

---

## §3 Deliverables (конкретные 19 файлов)

| # | Path | Строк (план) | Назначение |
|---|---|---|---|
| 1 | `05_Финансы/README.md` | ≤30 | Entrypoint модуля Финансы |
| 2 | `05_Финансы/00-spr/00-README.md` | ≤40 | Entrypoint папки справочников |
| 3 | `05_Финансы/00-spr/00-glossary.md` | ≤100 | 7 терминов: Order, Invoice, Payment, Refund, OrderClosing, Balance, Себестоимость |
| 4 | `05_Финансы/00-spr/00-orgs.md` | ≤80 | Банки (FK к Organization), налоговые, контрагенты |
| 5 | `05_Финансы/00-spr/00-products.md` | ≤60 | Себестоимость (costOfGoodsSold из Склад для маржи) |
| 6 | `05_Финансы/00-spr/00-clients.md` | ≤60 | Контрагенты (= клиенты из КП/Договор, hard-link) |
| 7 | `05_Финансы/00-spr/00-out-of-scope.md` | ≤80 | Что НЕ входит (банк, multi-currency, BI-аналитика) |
| 8 | `05_Финансы/00-spr/00-otkrytye-voprosy.md` | ≤120 | **5 baseline OQ** для Run 5 |
| 9 | `05_Финансы/05-konstruktor-finansov/00-README.md` | ≤40 | Entrypoint конструктора |
| 10 | `05_Финансы/05-konstruktor-finansov/05-scheta.md` | ≤120 | Invoice (аванс + основной + корректировочный) |
| 11 | `05_Финансы/05-konstruktor-finansov/05-platezhi.md` | ≤120 | Payment (INCOMING + STORNO + авто-привязка к Invoice) |
| 12 | `05_Финансы/05-konstruktor-finansov/05-refundy.md` | ≤100 | Refund (отдельная сущность per GAP-023) |
| 13 | `05_Финансы/05-zhiznennyj-cikl/00-README.md` | ≤35 | Entrypoint папки жизненного цикла |
| 14 | `05_Финансы/05-zhiznennyj-cikl/05-statusy.md` | ≤100 | Статусы: Order (5), Invoice (5), Payment (2 типа) |
| 15 | `05_Финансы/05-zhiznennyj-cikl/05-nalogovyi-uchet.md` | ≤80 | УСН + НДС (1 ставка 20%) + маржа расчёт |
| 16 | `05_Финансы/05-pravila/00-README.md` | ≤35 | Entrypoint правил |
| 17 | `05_Финансы/05-pravila/05-rbac.md` | ≤100 | RBAC Финансы ≥30 правил (manager / accountant / director / admin × ~10 действий) |
| 18 | `05_Финансы/05-pravila/05-biznes-pravila.md` | ≤80 | Инварианты (saldo=0, Сторно rules, Refund rules, CANCELLED state) |

**Total = 18 файлов** + 1 root README = 19.

> ⚠️ Корректировка PC-5: План показывает 17 файлов, но с 5 entrypoints (root + 4 subfolders) = **18 + 1 root = 19 файлов**.

---

## §4 Methodology (4-фазная)

### Phase 1: Setup (15 мин)
1. Read `MODULE-DECOMPOSITION-PLAN.md` §5.
2. Read [`МОДУЛЬ-ФИНАНСЫ.md`](../../../05_Финансы/МОДУЛЬ-ФИНАНСЫ.md) полностью — 280 строк.
3. **Read** [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — СПОР-7 (dropdown привязка Payment к Invoice), СПОР-13 (отдельный счётчик), СПОР-14 (RUB жёстко).
4. ✅ checklist — все 8 Q закрыты в источнике.

### Phase 2: Create STUBs (90 мин)
5. `mkdir -p 05_Финансы/{00-spr,05-konstruktor-finansov,05-zhiznennyj-cikl,05-pravila}`.
6. **Создание 19 файлов** параллельно. Шаблон mirror Договор:
   ```
   # <file.md> — <назначение>
   > ⚠️ STUB. ... Источник: МОДУЛЬ-ФИНАНСЫ.md §N.
   > Контент в Run 5.
   ```

### Phase 3: Cross-ref validation (30 мин)
7. Sibling cross-refs.
8. Cross-ref на все модули-предшественники: КП (proposalId), Договор (contractId + СПОР-5 триггер), Производство (linkedProductionOrderId в Refund), Склад (costOfGoodsSold).
9. **Триггерная верификация**: Contract.status='SIGNED' → авто Order creation → СПОР-5 cross-ref.

### Phase 4: Self-audit
10. Hard limits.
11. File count = 19.
12. PSL-NNN + git commit (if approved).

---

## §5 Pre-action Checklist per file
(Аналогично ТЗ-007/008 — 3 PC под-задачи на файл.)

---

## §6 ТЗ-0000 binding
Полный 6-фазный protocol. Особенности: финальный модуль в DAG → cross-ref правильность критична.

---

## §7 Quality gates

Аналогично. **Специфика:** проверить, что каждый статус в `05-statusy.md` имеет cross-ref на СПОР (5, 7, 12, 13, 14) — это критические унаследованные правила.

---

## §8 Hard limits

Идентично ТЗ-007/008. Общий объём нового ≤2200 строк.

---

## §9 Acceptance criteria

1. ✅ Phase 1-4 пройдены
2. ✅ 19 файлов созданы (точно)
3. ✅ Cross-refs на КП/Договор/Производство/Склад
4. ✅ ТЗ-0000 CLOSED
5. ✅ No conflict с ТЗ-007/008/010
6. ✅ Mirror pattern
7. ✅ Hard limits

---

## §10 Anti-patterns
Аналогично + специфичных для Финансы:

| # | Anti-pattern | Избегать |
|---|---|---|
| A NEW | СПОР не упомянут в cross-ref | Каждый финансовый статус ссылается на СПОР-5/7/12/13/14 |
| A NEW | Смешать Refund и Payment | Разные STUB (05-refundy.md vs 05-platezhi.md) |
| A NEW | Multi-currency suggestion | Указать явно: «СПОР-14: RUB жёстко» |

---

## §11 Glossary

| Термин | Значение |
|---|---|
| **Order** | Сквозная сущность «от КП до оплаты». Авто-создаётся при Contract.status='SIGNED' (СПОР-5) |
| **Invoice** | Документ выставления оплаты клиенту (тип: аванс / основной / корректировочный) |
| **Payment** | Факт поступления денег (тип: INCOMING / STORNO) |
| **Refund** | Отдельная сущность возврата денег клиенту (НЕ отрицательный Payment) |
| **OrderClosing** | Процедура финальной сверки (все оплачено + сальдо=0) |
| **Saldo (Balance)** | Разница выставленного (Invoice) и полученного (Payment); отрицательное = дебиторка |
| **STОНО** | Payment.type='STORNO' для опечаток бухгалтера (отрицательная сумма + correctsPaymentId FK) |
| **Run 5** | Финальный прогон Аналитика (после КП/Договор/Производство/Склад) |

---

## §12 Signoff

**Связанные документы:**
- [`99_Справочники/MODULE-DECOMPOSITION-PLAN.md`](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md) §5
- [`05_Финансы/МОДУЛЬ-ФИНАНСЫ.md`](../../../05_Финансы/МОДУЛЬ-ФИНАНСЫ.md) — основной источник (~280 строк)
- [`99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md`](../../99_Справочники/СПОРНЫЕ-МОМЕНТЫ.md) — СПОР-5/7/12/13/14
- `99_Справочники/TASKS/ТЗ-010-RUN-5-5-АНАЛИТИК-ФИНАНСЫ.md` — следующий шаг (Run 5)
- [`99_Справочники/TASKS/ТЗ-0000-CLOSURE-PROTOCOL.md`](ТЗ-0000-CLOSURE-PROTOCOL.md) — ОБЯЗАТЕЛЬНО

> **Hard limit:** ТЗ-009 ≤1000 строк ✅ вписано (~850).
