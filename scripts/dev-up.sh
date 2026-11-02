#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

for tool in node pnpm uv curl lsof; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      node) echo 'Missing Node.js 24.x. Install Node.js 24 from https://nodejs.org.' ;;
      pnpm) echo 'Missing pnpm. Install with: npm i -g pnpm@11.25' ;;
      uv) echo 'Missing uv. Install it from https://docs.astral.sh/uv/getting-started/installation/.' ;;
      *) echo "Missing $tool. Install it before starting Wreckaday." ;;
    esac
    exit 1
  fi
done
if [ "$(node -p 'process.versions.node.split(".")[0]')" != 24 ]; then
  echo 'Wreckaday needs Node.js 24.x. Switch Node versions, then run pnpm dev again.'
  exit 1
fi
for port in 8000 8081; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use. Stop that server, then run pnpm dev again."
    exit 1
  fi
done
if [ ! -d node_modules ] || [ ! -x apps/mobile/node_modules/.bin/expo ]; then
  pnpm install --frozen-lockfile
fi
if [ ! -d .venv ]; then
  uv venv .venv --python 3.12
  uv pip install --python .venv/bin/python -r services/api/requirements.lock
elif ! .venv/bin/python -c 'import uvicorn, fastapi, sqlalchemy, PIL, pydantic_settings, httpx' >/dev/null 2>&1; then
  uv pip install --python .venv/bin/python -r services/api/requirements.lock
fi
if [ ! -e .env ]; then (umask 077; cp .env.example .env); fi
mkdir -p work/logs
chmod 700 work/logs

api_pid=''
web_pid=''
cleanup() {
  trap - EXIT INT TERM HUP
  for child in "$api_pid" "$web_pid"; do
    if [ -n "$child" ]; then kill -TERM -- "-$child" 2>/dev/null || true; fi
  done
  sleep 1
  for child in "$api_pid" "$web_pid"; do
    if [ -n "$child" ]; then
      kill -KILL -- "-$child" 2>/dev/null || true
      wait "$child" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

console_token=$(.venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(24))')
printf 'Key console token: %s\n' "$console_token"
WRECKDAY_KEY_CONSOLE_ENABLED=true WRECKDAY_KEY_CONSOLE_TOKEN="$console_token" \
  PYTHONPATH=services/api .venv/bin/python scripts/dev-process.py \
  .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log \
  >work/logs/api.log 2>&1 &
api_pid=$!
unset console_token

wait_for() {
  local url=$1 limit=$2 child=$3 log=$4
  local deadline=$((SECONDS + limit))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if curl --max-time 1 -fsS "$url" >/dev/null 2>&1; then return 0; fi
    if ! kill -0 "$child" 2>/dev/null; then break; fi
    sleep 1
  done
  echo "Wreckaday could not start $url. Last log lines:"
  tail -n 20 "$log"
  return 1
}
wait_for http://127.0.0.1:8000/healthz 30 "$api_pid" work/logs/api.log
# Keep provider/admin secrets out of the web process. Only the public API URL is passed.
EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=http://localhost:8000 \
  .venv/bin/python scripts/dev-process.py pnpm --filter mobile web \
  >work/logs/web.log 2>&1 &
web_pid=$!
wait_for http://localhost:8081 120 "$web_pid" work/logs/web.log
if command -v open >/dev/null 2>&1; then open http://localhost:8081; fi
live=$(curl --max-time 5 -fsS http://127.0.0.1:8000/v2/capabilities | \
  .venv/bin/python -c 'import json,sys; print("on" if json.load(sys.stdin)["data"]["generation_available"] else "off")')
printf '\nWreckaday is running.\n  App:  http://localhost:8081\n  API:  http://127.0.0.1:8000   (live generation: %s)\n  Logs: work/logs/\nClose this window or press Ctrl+C to stop everything.\n' "$live"
while kill -0 "$api_pid" 2>/dev/null && kill -0 "$web_pid" 2>/dev/null; do sleep 1; done
echo 'A Wreckaday server stopped. Check work/logs/, then run pnpm dev again.'
exit 1
