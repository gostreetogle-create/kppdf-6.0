#!/usr/bin/env bash
# ============================================================
# scripts/start-dev.sh — Универсальный стартовый скрипт (Unix)
# ============================================================
# Запускает локальную среду разработки: PostgreSQL (Docker) + Next.js.
# Использование: bash scripts/start-dev.sh
#
# Требования: bash, docker, node, npm
# ============================================================

set -euo pipefail

# ─── Цветной вывод ─────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
step()  { echo -e "\n${CYAN}━━━ $1 ─━━${NC}"; }

# ─── Конфигурация ──────────────────────────────────────────
NEXT_PORT="${NEXT_PORT:-3000}"
PG_PORT="${PG_PORT:-5432}"
PG_CONTAINER="${PG_CONTAINER:-kppdf-postgres}"
PG_USER="${PG_USER:-kppdf}"
PG_PASS="${PG_PASS:-kppdf123}"
PG_DB="${PG_DB:-kppdf}"
WAIT_TIMEOUT=30
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

# ────────────────────────────────────────────────────────────
# ШАГ 0: Проверка зависимостей
# ────────────────────────────────────────────────────────────
step "ПРОВЕРКА ЗАВИСИМОСТЕЙ"

if ! command -v docker &>/dev/null; then
  error "Docker не установлен. Установите Docker Desktop: https://docker.com"
  exit 1
fi
info "Docker найден"

if ! command -v node &>/dev/null; then
  error "Node.js не установлен"
  exit 1
fi
info "Node.js $(node -v)"

# ────────────────────────────────────────────────────────────
# ШАГ 1: Освобождение портов
# ────────────────────────────────────────────────────────────
step "ОСВОБОЖДЕНИЕ ПОРТОВ"

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Порт $port занят процессом(ами): $pids"
    kill -9 $pids 2>/dev/null || true
    sleep 1
    info "Порт $port освобождён"
  else
    info "Порт $port свободен"
  fi
}

free_port "$NEXT_PORT"
free_port "$PG_PORT"

# ────────────────────────────────────────────────────────────
# ШАГ 2: Docker
# ────────────────────────────────────────────────────────────
step "ПРОВЕРКА DOCKER"

if ! docker info &>/dev/null; then
  warn "Docker не запущен. Пробую запустить..."
  case "$(uname -s)" in
    Linux)
      echo "  Запуск: sudo systemctl start docker"
      if sudo -n systemctl start docker 2>/dev/null; then
        sleep 5
      else
        echo "  Пропускаю (sudo требует пароль). Запустите Docker вручную."
      fi
      ;;
    Darwin)
      echo "  Запуск: open -a Docker"
      open -a Docker 2>/dev/null || true
      sleep 15
      ;;
    *)
      echo "  Запустите Docker Desktop вручную."
      ;;
  esac
  # Повторная проверка
  if docker info &>/dev/null; then
    info "Docker запущен"
  else
    error "Docker не запустился после попытки автозапуска."
    echo "  Запустите Docker Desktop вручную и повторите попытку."
    exit 1
  fi
else
  info "Docker запущен"
fi

# ────────────────────────────────────────────────────────────
# ШАГ 3: PostgreSQL контейнер
# ────────────────────────────────────────────────────────────
step "ЗАПУСК POSTGRESQL"

if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  info "Контейнер $PG_CONTAINER уже запущен"
elif docker ps -a --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  warn "Контейнер $PG_CONTAINER существует, но остановлен. Запускаю..."
  docker start "$PG_CONTAINER"
  info "Контейнер $PG_CONTAINER запущен"
else
  info "Создаю контейнер $PG_CONTAINER..."
  docker run -d \
    --name "$PG_CONTAINER" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="$PG_PASS" \
    -e POSTGRES_DB="$PG_DB" \
    -p "$PG_PORT:5432" \
    postgres:16-alpine
  info "Контейнер $PG_CONTAINER создан и запущен"
fi

# Ожидание готовности PostgreSQL
info "Ожидание PostgreSQL (до ${WAIT_TIMEOUT}с)..."
for i in $(seq 1 $WAIT_TIMEOUT); do
  if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" &>/dev/null; then
    info "PostgreSQL готов к соединениям"
    break
  fi
  if [ "$i" -eq "$WAIT_TIMEOUT" ]; then
    error "PostgreSQL не запустился за ${WAIT_TIMEOUT}с"
    exit 1
  fi
  sleep 1
done

# ────────────────────────────────────────────────────────────
# ШАГ 4: .env
# ────────────────────────────────────────────────────────────
step "ПРОВЕРКА .ENV"

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  warn ".env не найден. Создаю шаблон..."
  cat > "$ENV_FILE" <<-EOF
DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@localhost:${PG_PORT}/${PG_DB}?sslmode=disable"
JWT_SECRET="dev-secret-change-me"
EOF
  info ".env создан. JWT_SECRET='dev-secret-change-me' — замените на production!"
fi

# Загружаем .env (без export — только для этого скрипта)
set -a
# shellcheck disable=SC1091
source "$ENV_FILE" 2>/dev/null || true
set +a

info "DATABASE_URL загружен: ${DATABASE_URL:0:40}..."
info "JWT_SECRET: ${JWT_SECRET:+установлен}${JWT_SECRET:-❌ не установлен}"

# ────────────────────────────────────────────────────────────
# ШАГ 5: npm install
# ────────────────────────────────────────────────────────────
step "ПРОВЕРКА NODE_MODULES"

if [ ! -d "node_modules" ]; then
  warn "node_modules не найдены. Устанавливаю..."
  npm install
  info "npm install завершён"
else
  info "node_modules найдены"
fi

# ────────────────────────────────────────────────────────────
# ШАГ 6: Запуск Next.js
# ────────────────────────────────────────────────────────────
step "ЗАПУСК NEXT.JS"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Среда разработки готова!${NC}"
echo -e "${GREEN}  Next.js:   http://localhost:${NEXT_PORT}${NC}"
echo -e "${GREEN}  PostgreSQL: localhost:${PG_PORT} (${PG_USER}/${PG_DB})${NC}"
echo -e "${GREEN}  Логи ниже → Ctrl+C для остановки${NC}"
echo -e "${GREEN}  Остановка PostgreSQL: docker stop ${PG_CONTAINER}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""

exec npx next dev --webpack -p "$NEXT_PORT"
