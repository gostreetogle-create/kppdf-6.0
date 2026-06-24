# Multi-stage Dockerfile for KPPDF CRM v6 (Next.js 16 standalone output).
# Использование:
#   docker build -t kppdf-crm-v6:latest .
#   или через docker-compose.example.yml (services.app.build)

# ===== Stage 1: deps =====
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
# NOTE: --no-frozen-lockfile нужен для fresh-build (когда lockfile ещё не сгенерирован).
# После первого локального `pnpm install` рекомендуется включить --frozen-lockfile для CI/CD.
RUN pnpm install --no-frozen-lockfile

# ===== Stage 2: builder =====
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client (нужен для standalone build)
RUN pnpm prisma generate
# Build Next.js 16 (standalone output)
RUN pnpm build

# ===== Stage 3: runner =====
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Standalone output Next.js 16 включает только нужные файлы
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Public assets (если есть)
COPY --from=builder /app/public ./public
# Prisma client + schema (для runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Healthcheck через /api/health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
