#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="${AITRADERS_TMUX_SESSION:-aitraders}"
DB_URL="${DATABASE_URL:-postgres://aitraders:aitraders_dev_password@localhost:5432/aitraders}"
REDIS_URL_VALUE="${REDIS_URL:-redis://localhost:6379}"
AGENT_ENDPOINTS='{"market-data":"http://localhost:7001","strategy-research":"http://localhost:7002","event-analysis":"http://localhost:7006","risk":"http://localhost:7003","execution":"http://localhost:7004","post-trade-review":"http://localhost:7005"}'
RUNTIME_ROOT="${AITRADERS_RUNTIME_ROOT:-${HOME}/.local/aitraders-runtime}"
LOCAL_ROOT="${RUNTIME_ROOT}/root"
LOCAL_LIB="${LOCAL_ROOT}/usr/lib/x86_64-linux-gnu"
PG_BIN="${LOCAL_ROOT}/usr/lib/postgresql/16/bin"
REDIS_SERVER="${LOCAL_ROOT}/usr/bin/redis-server"
DATA_ROOT="${RUNTIME_ROOT}/data"
PGDATA="${DATA_ROOT}/postgres"
REDISDATA="${DATA_ROOT}/redis"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local timeout="${3:-60}"
  local start
  start="$(date +%s)"

  while true; do
    if (echo >"/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1; then
      echo "Ready: ${label} on port ${port}"
      return 0
    fi

    if (( "$(date +%s)" - start >= timeout )); then
      echo "Timed out waiting for ${label} on port ${port}" >&2
      return 1
    fi

    sleep 1
  done
}

is_port_open() {
  local port="$1"
  (echo >"/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1
}

docker_compose() {
  if ! command -v docker >/dev/null 2>&1; then
    return 127
  fi

  if docker version >/dev/null 2>&1; then
    docker compose "$@"
    return
  fi

  sudo -n docker compose "$@"
}

with_runtime_libs() {
  LD_LIBRARY_PATH="${LOCAL_LIB}:${LD_LIBRARY_PATH:-}" "$@"
}

start_local_postgres() {
  if [[ ! -x "${PG_BIN}/initdb" || ! -x "${PG_BIN}/pg_ctl" || ! -x "${PG_BIN}/psql" || ! -x "${PG_BIN}/createdb" ]]; then
    return 1
  fi

  mkdir -p "${PGDATA}"
  if [[ ! -f "${PGDATA}/PG_VERSION" ]]; then
    echo "Initializing user-local PostgreSQL data directory..."
    with_runtime_libs "${PG_BIN}/initdb" -D "${PGDATA}" -A trust -U openclaw --no-locale >/dev/null
  fi

  if ! is_port_open 5432; then
    echo "Starting user-local PostgreSQL..."
    with_runtime_libs "${PG_BIN}/pg_ctl" -D "${PGDATA}" -l "${RUNTIME_ROOT}/postgres.log" -o "-h 127.0.0.1 -p 5432 -k ${RUNTIME_ROOT}" -w start
  fi

  with_runtime_libs "${PG_BIN}/psql" -h 127.0.0.1 -p 5432 -U openclaw -d postgres -v ON_ERROR_STOP=1 \
    -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname = 'aitraders') then create role aitraders login password 'aitraders_dev_password'; end if; end \$\$;" >/dev/null
  if ! with_runtime_libs "${PG_BIN}/psql" -h 127.0.0.1 -p 5432 -U openclaw -d postgres -tAc "select 1 from pg_database where datname = 'aitraders'" | grep -q 1; then
    with_runtime_libs "${PG_BIN}/createdb" -h 127.0.0.1 -p 5432 -U openclaw -O aitraders aitraders
  fi
}

start_local_redis() {
  if [[ ! -x "${REDIS_SERVER}" ]]; then
    return 1
  fi

  mkdir -p "${REDISDATA}"
  if ! is_port_open 6379; then
    echo "Starting user-local Redis..."
    with_runtime_libs "${REDIS_SERVER}" \
      --daemonize yes \
      --bind 127.0.0.1 \
      --port 6379 \
      --dir "${REDISDATA}" \
      --logfile "${RUNTIME_ROOT}/redis.log" \
      --pidfile "${RUNTIME_ROOT}/redis.pid"
  fi
}

require_command npm
require_command python3
require_command tmux

cd "${ROOT_DIR}"

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "tmux session '${SESSION_NAME}' is already running."
  echo "Use './scripts/stop-services.sh' first, or inspect it with: tmux attach -t ${SESSION_NAME}"
  exit 0
fi

if [[ ! -d node_modules ]]; then
  echo "node_modules is missing; running npm install first."
  npm install
fi

if command -v docker >/dev/null 2>&1; then
  echo "Starting postgres and redis with Docker Compose..."
  docker_compose up -d postgres redis
else
  echo "Docker is not installed or not on PATH; using local postgres/redis when available."
  if ! start_local_postgres || ! start_local_redis; then
    echo "Cannot start because Docker Compose is unavailable and local postgres/redis runtime binaries are missing." >&2
    exit 1
  fi
fi

wait_for_port 5432 "postgres" 90
wait_for_port 6379 "redis" 60

echo "Starting AiTraders services in tmux session '${SESSION_NAME}'..."
tmux new-session -d -s "${SESSION_NAME}" -n "market-data" -c "${ROOT_DIR}" \
  "python3 agents/market-data/server.py"
tmux new-window -t "${SESSION_NAME}" -n "strategy" -c "${ROOT_DIR}" \
  "python3 agents/strategy-research/server.py"
tmux new-window -t "${SESSION_NAME}" -n "event" -c "${ROOT_DIR}" \
  "python3 agents/event-analysis/server.py"
tmux new-window -t "${SESSION_NAME}" -n "risk" -c "${ROOT_DIR}" \
  "python3 agents/risk/server.py"
tmux new-window -t "${SESSION_NAME}" -n "execution" -c "${ROOT_DIR}" \
  "AGENT_ID=execution AGENT_NAME='Execution Agent' AGENT_ROLE='Accepts only deterministic execution requests after hard gates pass.' PORT=7004 python3 agents/base_http_agent.py"
tmux new-window -t "${SESSION_NAME}" -n "review" -c "${ROOT_DIR}" \
  "AGENT_ID=post-trade-review AGENT_NAME='Post-Trade Review Agent' AGENT_ROLE='Explains wins and losses, classifies trade outcomes, and records strategy lessons.' PORT=7005 python3 agents/base_http_agent.py"
tmux new-window -t "${SESSION_NAME}" -n "api" -c "${ROOT_DIR}" \
  "PORT=4000 DATABASE_URL='${DB_URL}' REDIS_URL='${REDIS_URL_VALUE}' CORS_ORIGIN='http://localhost:3000' AGENT_ENDPOINTS_JSON='${AGENT_ENDPOINTS}' npm run dev:api"
tmux new-window -t "${SESSION_NAME}" -n "web" -c "${ROOT_DIR}" \
  "NEXT_PUBLIC_API_URL='http://localhost:4000' npm run dev:web"

wait_for_port 7001 "market-data agent" 30
wait_for_port 7002 "strategy-research agent" 30
wait_for_port 7006 "event-analysis agent" 30
wait_for_port 7003 "risk agent" 30
wait_for_port 7004 "execution agent" 30
wait_for_port 7005 "post-trade-review agent" 30
wait_for_port 4000 "api" 90
wait_for_port 3000 "web" 90

echo
echo "AiTraders is running."
echo "Web: http://localhost:3000"
echo "API: http://localhost:4000/health"
echo "Logs: tmux attach -t ${SESSION_NAME}"
