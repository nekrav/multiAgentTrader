#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="${AITRADERS_TMUX_SESSION:-aitraders}"
RUNTIME_ROOT="${AITRADERS_RUNTIME_ROOT:-${HOME}/.local/aitraders-runtime}"
LOCAL_ROOT="${RUNTIME_ROOT}/root"
LOCAL_LIB="${LOCAL_ROOT}/usr/lib/x86_64-linux-gnu"
PG_BIN="${LOCAL_ROOT}/usr/lib/postgresql/16/bin"
REDIS_CLI="${LOCAL_ROOT}/usr/bin/redis-cli"
PGDATA="${RUNTIME_ROOT}/data/postgres"

with_runtime_libs() {
  LD_LIBRARY_PATH="${LOCAL_LIB}:${LD_LIBRARY_PATH:-}" "$@"
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

cd "${ROOT_DIR}"

if command -v tmux >/dev/null 2>&1 && tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Stopping tmux session '${SESSION_NAME}'..."
  tmux kill-session -t "${SESSION_NAME}"
else
  echo "tmux session '${SESSION_NAME}' is not running."
fi

if command -v docker >/dev/null 2>&1; then
  echo "Stopping Docker Compose services for this project..."
  docker_compose stop web api market-data-agent strategy-research-agent risk-agent execution-agent post-trade-review-agent postgres redis >/dev/null 2>&1 || true
else
  echo "Docker is not installed or not on PATH; skipped Docker Compose stop."
fi

if [[ -x "${PG_BIN}/pg_ctl" && -f "${PGDATA}/PG_VERSION" ]]; then
  echo "Stopping user-local PostgreSQL if running..."
  with_runtime_libs "${PG_BIN}/pg_ctl" -D "${PGDATA}" -w stop >/dev/null 2>&1 || true
fi

if [[ -x "${REDIS_CLI}" ]]; then
  echo "Stopping user-local Redis if running..."
  with_runtime_libs "${REDIS_CLI}" -h 127.0.0.1 -p 6379 shutdown >/dev/null 2>&1 || true
fi

echo "Checking AiTraders ports..."
if command -v ss >/dev/null 2>&1; then
  if ss -ltnp '( sport = :3000 or sport = :4000 or sport = :7001 or sport = :7002 or sport = :7003 or sport = :7004 or sport = :7005 )' | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'; then
    echo "Some application ports are still listening:"
    ss -ltnp '( sport = :3000 or sport = :4000 or sport = :7001 or sport = :7002 or sport = :7003 or sport = :7004 or sport = :7005 )'
    echo "If these are stale local processes, stop them manually after checking ownership."
    exit 1
  fi
fi

echo "AiTraders application services are stopped."
