# KPPDF CRM v6 — Phase 1 Bootstrap

> Минимально-рабочий «Каркас-Kit» для 6 модулей (КП / Договор / Производство / Склад / Финансы / Картотека сделок).
> Bootstrap — это фундамент: схема БД, auth, RBAC, infra. Бизнес-CRUD по модулям — Phase 2.

## Стек (согласован 24.06.2026)

| Слой | Технология | Версия |
|---|---|---|
| Frontend | Next.js (App Router) | 16.2.9 |
| UI library | Mantine | 7.x |
| Type system | TypeScript strict | 5.x |
| Server state | TanStack Query | 5.x |
| Forms | react-hook-form + Zod 4 | latest |
| ORM | Prisma + PrismaPg driver adapter | 7.8+ |
| DB | PostgreSQL | 16+ |
| Auth | JWT cookies (jose) | HS256 + HttpOnly |
| Image | sharp | latest |
| Tests | Vitest 4 + Playwright | latest |
| Containerization | Docker Compose (postgres + app + nginx) | latest |
| Package manager | pnpm | 9.x |

## Структура проекта

```
kppdf-6.0/
├── prisma/
│   ├── schema.prisma          # 32 сущности + 22 enum + Counter (по SCHEMA-CONSOLIDATED.md)
│   └── seed.ts                # Идемпотентный seed: 11 счётчиков + admin user
├── src/
│   ├── lib/
│   │   ├── env.ts             # Zod-валидация env (DATABASE_URL, JWT_SECRET ≥ 32)
│   │   ├── db.ts              # Prisma 7 client + PrismaPg driver adapter
│   │   ├── jwt.ts             # jose JWT (HS256) + HttpOnly cookie helpers
│   │   ├── rbac.ts            # requireAuth/requireRole/requireAuthAndRole/requireAuthOnly
│   │   ├── counter.ts         # Safe-increment через $transaction + SELECT FOR UPDATE
│   │   ├── theme.ts           # Mantine theme (locale ru + russian spacing)
│   │   └── validations/
│   │       └── auth.schema.ts # loginSchema + proposalCreateSchema
│   ├── app/
│   │   ├── layout.tsx         # Root layout: MantineProvider + QueryClient + Notifications
│   │   ├── page.tsx           # Redirect: /login или /dashboard
│   │   └── api/
│   │       ├── health/route.ts        # GET /api/health (smoke probe)
│   │       ├── auth/login/route.ts    # POST /api/auth/login (bcrypt + set-cookie)
│   │       ├── auth/logout/route.ts   # POST /api/auth/logout (clear cookie)
│   │       └── proposals/route.ts     # GET /api/proposals (RBAC-protected)
│   └── components/
│       └── karkas-kit/
│           └── KarkasLayout.tsx       # 3-зонный AppShell (Navbar/Main/Aside)
├── tests/                     # тесты v2 polish (Vitest)
├── docker-compose.example.yml # postgres + app + nginx
├── Dockerfile                 # multi-stage для Next.js 16 standalone
├── next.config.ts             # standalone output + serverActions 5mb
├── tsconfig.json              # strict + paths @/* + noUncheckedIndexedAccess
├── package.json               # все зависимости стека
└── .env.example               # DATABASE_URL, JWT_SECRET, NODE_ENV, SEED_ADMIN_*

```

## Phase 1 Bootstrap — запуск с нуля

### 1. Установить зависимости

```bash
pnpm install   # или npm install (если нет pnpm)
```

### 2. Скопировать .env и заполнить

```bash
cp .env.example .env
# Сгенерировать JWT_SECRET минимум 32 символа:
openssl rand -base64 48
```

### 3. Поднять Postgres (docker compose ИЛИ локальный)

```bash
docker compose up -d postgres
# ИЛИ если уже есть локальный Postgres (на Synology DSM):
# — создать базу kppdf_v6 вручную, обновить DATABASE_URL в .env
```

### 4. Применить миграции (создать таблицы)

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### 5. Сид: 11 счётчиков + admin user

```bash
pnpm db:seed
```

### 6. Запустить dev-сервер

```bash
pnpm dev
# → http://localhost:3000
```

### 7. Проверить работоспособность

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","db":"reachable",...}
```

## Production build (для Synology DSM)

### Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
# заполнить POSTGRES_PASSWORD и JWT_SECRET в .env
docker compose up -d --build
```

### Локальные скрипты + rsync (рекомендовано для v1)

```bash
pnpm build
# rsync .next/standalone + public/ на Synology:
rsync -avz --delete \
  .next/standalone/ \
  .next/static/ \
  public/ \
  prisma/ \
  user@synology:/volume1/docker/kppdf-crm/
```

## RBAC (6 ролей)

| Роль | Видит | Права |
|---|---|---|
| ADMIN | всё | полный доступ |
| DIRECTOR | все КП/маржа | управление, видит себестоимость |
| ACCOUNTANT | финансы | видит себестоимость, регистрирует платежи |
| MANAGER | только свои КП | право КП-редактор (costPrice виден — Q6 финансов ✅ C) |
| PRODUCTION | производство | начальник производства |
| STOREKEEPER | склад | кладовщик |

Маржинальность (Q6 финансов) видна **всем ролям в полном виде** (включая `costPrice`) — PO принял C.

## Phase 2 — следующие шаги (не в Bootstrap)

1. UI редактора КП (3-зонный макет, 50+ полей, инлайн-редактирование таблицы, autosave)
2. Бизнес-CRUD по модулям: Договор → Производство → Склад → Финансы
3. История комментариев (правка F — таблица Comment готова, нужен UI)
4. DocumentTemplate (конструктор шаблонов для КП/Договора)
5. sharp API route для серверного сжатия фото (правка G)
6. Email SMTP (mailpit в dev, корпоративный — production)
7. «Картотека сделки = view» (SQL query поверх всех модулей)
8. PDF gen (jsPDF v1 → Puppeteer v2)

## Phase 1 Bootstrap — что НЕ входит (v2 polish)

- Подробные UI компоненты для каждого модуля (Phase 2)
- Тесты Vitest/Playwright (v2 polish) — критичные unit-тесты будут добавлены в Phase 2 для каждой API
- Dockerfile multi-stage optimization (multi-arch build для ARM Synology)
- Helm charts / GitHub Actions (v3 — при выходе на multi-pod)

## Source of truth (где живёт схема)

- `prisma/schema.prisma` ←→ `SCHEMA-CONSOLIDATED.md` (§1 модели, §2 FK + ON DELETE, §3 enum-ы, §4 Counter, §6 инварианты)
- `OPEN-QUESTIONS-MASTER.md` — все 38 Q-решений применены в schema.prisma и src/lib
- `СТЕК-ПРЕДПИСАНИЕ.md` §5 — финальное согласование стека (10 OQ + 5 доп. стековых Q)
- `МАСТЕР-АУДИТ-V6.md` — финальный аудит v6
- `МОДУЛЬ-*.md` (15 файлов) — исходные документы

## Troubleshooting

### `prisma migrate dev` падает с `PrismaPg adapter requires DATABASE_URL`

Убедиться, что `.env` содержит валидный `postgresql://user:pass@host:5432/dbname`. Старый формат `postgres://` НЕ принимается Zod-валидацией.

### `prisma generate` падает "Field comments is required"

Если добавил новую модель `Comment` — нужно добавить обратную связь `comments Comment[]` на ВСЕ родительские модели (Proposal, Contract, ProductionOrder, Order) с правильным `onDelete` (Cascade).

### `jwt.verify` падает на корректном токене после hot-reload

HMR может сбросить singleton env-cache. Перезапустить `pnpm dev`. В продакшене этой проблемы нет.

### BigInt serialization error в API

Counter возвращает `string` (formatted). `peekCounter` возвращает `BigInt` — для API обернуть в `value.toString()`.
