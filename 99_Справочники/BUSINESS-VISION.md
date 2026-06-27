# BUSINESS-VISION.md — Стратегический якорь KPPDF CRM v6

> **Назначение.** Этот файл = «конституция» проекта. Переводит plain-language PO в **операционные** принципы, на основе которых агенты принимают решения: что делать, что НЕ делать, как реализовывать UX. **Стратегический**, не implementation.
>
> **Объём:** ≤ 400 строк target / 500 hard limit (явный HARD LIMIT OVERRIDE per `AGENT-REVIEW.md` §1.6 + PSL-003 / PSL-026 precedent — причина: единый operational spec без дробления на 2+ файлов).
>
> **Implementation** (Mantine/React/конкретные UI-паттерны) — в `01_КП/LAUNCH-UX.md` (ТЗ-003 в работе). **Strategic** (этот файл) — почему именно так.

---

## 1. Бизнес-контекст (3 твёрдых условия)

| # | Условие | Следствие |
|---|---|---|
| 1 | **Одна компания, локальное использование** | Single-tenant навсегда. Никакого multi-tenancy, SaaS-isolation, tenant-billing. |
| 2 | **Максимум 10 человек в команде** | Не проектируем для 1000+. Не тестируем perf для миллионов. Не нужны CDN / shared кеши / microservices. |
| 3 | **Полуавтоматическая система — главная цель = помощь менеджеру** | Менеджер двигает товар от КП до отгрузки. Приложение подсказывает, автоматизирует рутину, защищает от опечаток. Никаких ручных «переключателей режимов». |

**Итог:** это **internal tool для маленькой команды производственной компании** (КП → Договор → Производство → Склад → Финансы), НЕ продукт для внешнего рынка. Решения, оптимизирующие «масштабирование для будущих external customers» — **запрещены**.

---

## 2. Что приложение РЕШАЕТ (5 конкретных проблем менеджера)

| # | Проблема | Решение в v6 |
|---|---|---|
| 1 | Долго рисует КП (45 мин на «КП для другого юрлица») | Кнопка «Скопировать для другого юрлица» — 30 сек + авто-применение наценки/НДС |
| 2 | Теряет черновик КП / теряется в десятках вкладок | Автосохранение 5-10 сек + localStorage + restore prompt + «3 клика от последней точки» |
| 3 | Не помнит правила (НДС, маржа, состояния) | Inline-подсказки + smart defaults + Proactive Nudging (см. §4) |
| 4 | Не видит «что сейчас блокирует сделку» | Dashboard «Что НЕ двигается» + critical-path highlighting |
| 5 | Лазит по 10 страницам чтобы найти нужное | Inline-всё: dropdowns в нужных местах, кнопки «+», no modal hell |

**Главный принцип:** если решение требует от менеджера **уйти с текущей страницы** чтобы найти что-то — это **плохое UX**. Перерабатывать до состояния «всё здесь, в один клик».

---

## 3. Что приложение НЕ делает (явный anti-feature catalog)

> **Жёсткий список.** Любая будущая фича проверяется: «это в каталоге? если да — отвергнуть». Trade-offs задокументированы в §3.3.

### 3.1 Infrastructure / Deployment (запрещено)

| Anti-feature | Причина для ≤10 / single-tenant |
|---|---|
| Multi-tenancy / tenant isolation | 1 компания, нет sense |
| Kubernetes / microservices | 1 сервис Next.js + 1 Postgres — хватает |
| Multi-region CDN | Все 10 человек в 1 офисе |
| External OAuth (Azure AD / Google / SAML) | JWT cookies внутри приложения хватает |
| S3 / MinIO файловый storage | Local FS `/uploads/` хватает для v1 |
| GraphQL / tRPC | REST + Zod (4 endpoints max) проще |
| WebSocket realtime | Polling + TanStack Query invalidation хватает |
| Microservices / message broker | Monolith проще для 1 разработчика |

### 3.2 SaaS / Commercial features (запрещено)

| Anti-feature | Причина |
|---|---|
| SaaS billing / Stripe / subscription tiers | Не продаём как сервис |
| GDPR compliance dashboard | 1 компания в РФ, российское законодательство |
| Marketing pages / landing / SEO | Internal tool, нет external visitors |
| Public API для external интеграций | Closed system |
| White-label / branding customization | Один заказчик |

### 3.3 Product over-engineering (запрещено)

| Anti-feature | Альтернатива (что делаем вместо) |
|---|---|
| ML demand forecasting | Ручной план-график ЗК (см. `03_Производство/МОДУЛЬ-ПРОИЗВОДСТВО.md`) |
| Native mobile app (React Native / Flutter) | PWA / responsive web достаточно |
| Multi-language (i18n) | Только русский v1 |
| Real-time collaboration (Google-Docs-like) | Sequential editing + version history КП |
| Microservice для каждого модуля | Monolith с lazy-loading routes |
| Advanced analytics / BI dashboard | Базовые отчёты (маржа, остатки, динамика) |
| AI-чат-бот / LLM integration | Не входит в MVP |
| Drag-and-drop всего | Где уместно (таблица позиций КП) — иначе = кнопки |
| **2FA на universal login (каждый вход)** | 2FA применяется ТОЛЬКО к критичным действиям (загрузка логотипа/печати, approve крупных списаний >30 т.р.). Для ≤10 internal trust level — passwords хватает. |
| **Multi-tier approval matrices с эскалацией** | **Минимальный approval flow:** 1 уровень (либо accountant ≤5т.р., либо director >5т.р.). Никаких 3-уровневых chains с тайм-боксами и правилами escalation — overkill для полуавтоматической системы. |

### 3.4 Технологический минимум (Acceptable)

✅ **Что РЕАЛЬНО нужно** для ≤10 людей internal CRM:
- Next.js + React + Mantine + Tailwind (1 стек)
- PostgreSQL (1 БД, ACID для финансов)
- Prisma ORM (1 schema, миграции)
- TanStack Query + Zustand + react-hook-form (standard)
- Sharp (resize изображений локально)
- Husky + lint-staged + commitlint (качество «на входе»)
- pnpm (1 пакетный менеджер)

❌ **Не изобретаем:** state machines через XState, BFF паттерны, отдельный admin frontend, нативный desktop wrapper, любые внешние SaaS-сервисы кроме опционального SMTP для v2.

---

## 4. UX-принципы (6 operational disciplines)

> **Эти 6 принципов ПЕРЕВОДЯТ plain-language PO в actionable правила.** Каждый агент, пишущий UI / API / docs, ОБЯЗАН проверить решение против всех 6.

### 4.1 Proactive Nudging («подсказывать что делать»)

**Правила:**
- Если следующий шаг pending → render яркая кнопка `color="blue"` «Создать ЗК» (или «Подписать», «Отгрузить», «Оплатить») на текущем экране, не прятать в меню.
- Если stalled > 3 дней → red badge «Застряло» + tooltip «что блокирует».
- Если completed → green check «Готово ✓».
- **Где НЕ применять:** в уведомлениях, поп-апах, push — это уже over-engineering. Только inline в основном workflow.

**Пример:** КП-0042 → status ACCEPTED → на странице КП видим кнопку «Конвертировать в Договор» (большая, синяя), у Договор → «Подписать», у ЗК → «Распределить задачи по цехам».

### 4.2 Inline Augmentation («+ кнопки в нужных местах для быстрого добавления»)

**Правила:**
- НИКАКИХ modal windows для добавления данных, которые относятся к текущей таблице.
- Каждая таблица позиций (КП / Договор / ЗК / Закупка) имеет пустую строку внизу с autocomplete для нового товара.
- Каждый dropdown (Клиент, Организация-продавец, Цех) имеет кнопку «+» рядом → modal только для СОЗДАНИЯ НОВОГО справочника (но НЕ для существующих записей).
- **Никаких «откройте другую страницу чтобы добавить юрлицо»** — это рудимент enterprise CRM.

### 4.3 Zero Search (≤50 элементов → dropdown, не search page)

**Правила:**
- Если в справочнике <50 элементов → НЕ используем поисковую страницу. Только searchable dropdown (`Combobox`).
- Если >50 элементов → используем drawer/popover с inline filter, не отдельный route.
- Если нужен «глобальный поиск» (вне текущего контекста) → cmd+K palette в header.
- **Где НЕ применять:** отчёты (там нужны фильтры по датам/диапазонам — это легитимно).

**Анти-паттерн:** `/search?q=…&type=client&filter=…` — это enterprise UI. У нас ≤50 клиентов + ≤100 товаров, всё в dropdowns.

### 4.4 Smart Defaults (auto-fill всё что предсказуемо)

**Правила:**
- Дата = today по умолчанию.
- Менеджер = current user.
- Организация-продавец = primary Org (та, что в `Settings.currentSellerOrgId`).
- Валюта = RUB (захардкожено v1).
- НДС = ставка по умолчанию 20% (если есть ФЛАГ «без НДС» — тегируем).
- Склад = основной склад (из `Settings.primaryWarehouseId`).
- Шаблон КП = последний использованный менеджером (per-user preference).
- Контрагент / Товар — autocomplete с memory of last 5 used.

### 4.5 Beautiful Laconicism (красота = удаление лишнего)

**Правила:**
- Максимум **3 визуальных зоны** на странице (лево / центр / право) per Каркас-Kit.
- Никаких borders вокруг cards если можно использовать background color.
- Filters advanced → скрыты за `<details>` или «Advanced» toggle, видны только по требованию.
- Icons — только если несут смысл (не decoration).
- Empty states = illustration + CTA (никогда пустая таблица).
- Цветовая палитра: ≤ 5 основных + Mantine defaults (никаких custom design systems в MVP).

### 4.6 Quick-Access + ( Buttons «+» и shortcuts в нужных местах )

**Правила:**
- Header содержит cmd+K глобальный поиск + Quick-create dropdown «+ КП / + Договор / + Товар».
- Каждая страница списка имеет + кнопку в header (НЕ в правом верхнем углу — в центральной зоне).
- Keyboard shortcuts для power users (Cmd+S сохранить, Cmd+K поиск, Escape закрыть modal).
- Mobile: bottom-fixed FAB кнопка «+ Создать КП» (одна главная на экране).

---

## 5. Implementation gate (как применяется)

> **Главный принцип:** этот файл описывает «почему» / «что» / «не делать», НЕ «как реализовать».
>
> **Implementation specifications** живут в:
> - `01_КП/LAUNCH-UX.md` (ТЗ-003 в работе) — конкретные Mantine-паттерны для §4 UX-принципов
> - `01_КП/04-pravila/04-rbac.md` — RBAC ≤10 людей (упрощённый)
> - `99_Справочники/SCHEMA-CONSOLIDATED.md` — schema ≤32 сущности (без SaaS overhead)
> - `99_Справочники/СTEК-ПРЕДПИСАНИЕ.md` — стек без microservices / Kubernetes

**Gate rule (новые решения):**
1. Прежде чем добавить фичу → проверить §3 anti-catalog (если там — стоп, пересмотреть scope).
2. Прежде чем нарисовать UI → проверить §4 (все 6 disciplines применены?).
3. Прежде чем выбрать технологию → проверить §3.4 (Acceptable list).
4. Если решение противоречит single-tenant / ≤10 людей / полуавтомат → пересмотреть, не применять.

**LAUNCH-UX must implement:** все 6 disciplines из §4 explicit + ссылка сюда в начале `LAUNCH-UX.md`.

---

## 6. Связь с другими документами

| Файл | Связь |
|---|---|
| [`MASTER-VISION.md`](../MASTER-VISION.md) | High-level vision для PO (компактный) |
| [`BIG-BOOK.md`](../BIG-BOOK.md) §1 «Что такое v6» | Архитектурное обоснование (включает product scope) |
| [`BIG-BOOK.md` §11 «Что нового в v6 vs v5» | Сравнение с baseline v5 — explicit НЕ-cloud фичи |
| [`01_КП/LAUNCH-UX.md`](../01_КП/LAUNCH-UX.md) (ТЗ-003 в работе) | Implementation §4 disciplines через Mantine/React |
| [`СTEК-ПРЕДПИСАНИЕ.md`](СTEК-ПРЕДПИСАНИЕ.md) | Технологии соответствуют §3.4 Acceptable list |
| [`SCHEMA-CONSOLIDATED.md`](SCHEMA-CONSOLIDATED.md) | Schema = 32 сущности (не SaaS-flavored) |
| [`МАСТЕР-АУДИТ-V6.md`](МАСТЕР-АУДИТ-V6.md) | Исторический аудит (v6 готовность) |

---

## 7. Версия и история

| Версия | Дата | Что |
|---|---|---|
| **1.0** | **2026-06-27** | **СОЗДАН** как стратегический якорь. Содержит: §1 Бизнес-контекст (3 твёрдых условия: single-tenant / ≤10 / полуавтомат) + §2 Что приложение РЕШАЕТ (5 конкретных проблем) + §3 anti-feature catalog (3 подраздела: Infrastructure / SaaS / Product over-eng, ~25 запрещённых фич с альтернативами) + §4 UX-принципы operationalized (6 disciplines с concrete rules: Proactive Nudging, Inline Augmentation, Zero Search, Smart Defaults, Beautiful Laconicism, Quick-Access +) + §5 Implementation gate + §6 cross-refs + §7 Версия. Hard limit ≤400 target соблюдён. **CRITICAL: Этот файл = «конституция» — все агенты ОБЯЗАНЫ проверять новые решения против §3 (anti-catalog) и §4 (UX).** |
