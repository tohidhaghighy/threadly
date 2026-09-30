#!/usr/bin/env bash
set -euo pipefail

WEB_PORT="${WEB_PORT:-4059}"
export PORT="${PORT:-4050}"
export API_PROXY_TARGET="${API_PROXY_TARGET:-http://127.0.0.1:${PORT}}"

cd /app/backend
node dist/main.js &
backend_pid=$!

cd /app
HOST=0.0.0.0 PORT="${WEB_PORT}" node .output/server/index.mjs &
frontend_pid=$!

cleanup() {
  kill "${backend_pid}" "${frontend_pid}" 2>/dev/null || true
  wait "${backend_pid}" "${frontend_pid}" 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM

wait -n "${backend_pid}" "${frontend_pid}"
status=$?
cleanup
exit "${status}"
