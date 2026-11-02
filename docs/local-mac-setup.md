> Historical Gate 1 setup notes, preserved from the remote branch. The current
> photo-and-premise preview needs no Postgres or queue worker. Use the
> [current README](../README.md) and [ADR 0003](adr/0003-payback-reference-photo-generation.md).
> The Intel Mac/tooling constraints below remain useful background.

# WRECKDAY Gate 1: Intel Mac local preview

User-supplied setup notes, not yet independently verified on this Mac. Target: Intel x86_64, macOS 12.7.6, zsh, Node 24 already installed. Homebrew and MacPorts do not work on this machine, and there is no Docker server; do not recommend them. Install under the user's home directory without sudo. Ask the user before installing anything not listed below.

## 1. PATH (each terminal)

```sh
export PATH=$HOME/.local/bin:$PATH
mkdir -p ~/.local/bin
```

## 2. Enable pnpm

```sh
corepack enable pnpm --install-directory ~/.local/bin
pnpm -v   # repo pins 11.25.0
```

## 3. Clone the app

```sh
git clone -b feat/gate-1-mock-story https://github.com/hunvidos-lab/wreckaday.git ~/wreckaday
cd ~/wreckaday
```

## 4. uv, Python 3.12, and API dependencies

```sh
curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=$HOME/.local/bin UV_NO_MODIFY_PATH=1 sh
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r services/api/requirements.lock
```

## 5. Local PostgreSQL via pgserver

```sh
uv pip install --python .venv/bin/python pgserver
B=$PWD/.venv/lib/python3.12/site-packages/pgserver/pginstall/bin
D=$PWD/work/pgdata
mkdir -p work
echo local-only > /tmp/pw
$B/initdb -D $D -U wreckday --pwfile=/tmp/pw --auth=md5 -E UTF8
rm /tmp/pw
$B/pg_ctl -D $D -o "-p 55432 -c listen_addresses=127.0.0.1 -k /tmp" -l work/pg.log start
PGPASSWORD=local-only $B/psql -h 127.0.0.1 -p 55432 -U wreckday -d postgres -c "create database wreckday"
```

Port 55432, user `wreckday` and password `local-only` must match `.env.example`.

## 6. Configure, migrate, start API and worker

```sh
cp -n .env.example .env
set -a; . ./.env; set +a
(cd services/api && ../../.venv/bin/alembic upgrade head)
PYTHONPATH=services/api nohup .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log > work/api.log 2>&1 &
PYTHONPATH=services/api nohup .venv/bin/python -m app.worker > work/worker.log 2>&1 &
curl -s localhost:8000/readyz
```

Expect HTTP 200. Load `.env` in the same shell that starts the API and worker.

## 7. JavaScript dependencies and web preview

```sh
pnpm install --frozen-lockfile
nohup pnpm --filter mobile web > work/web.log 2>&1 &
```

Open http://localhost:8081. Test the sample; choose She's moving in, select Alex/Sam, confirm 3 demo credits, edit and save captions, prepare, and download a PNG. Accounts are shared test accounts: no real keys or personal data. No inference keys or paid inference are required. Native iOS/Android builds and messaging-app sharing are untested.

## Restart after reboot

1. Set PATH as in step 1.
2. From `~/wreckaday`, define `B` and `D` as in step 5 and run the `pg_ctl ... start` command. Do not repeat `initdb` or `create database` for an existing installation.
3. Load `.env` and start API and worker as in step 6. Migrations can be run again safely.
4. Start the web preview as in step 7.
