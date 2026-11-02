# Worker entry point

Run `PYTHONPATH=services/api .venv/bin/python -m app.worker` from the repository root.
The worker implementation lives in `services/api/app/worker.py` so the API and
worker share the exact domain models, config, and transaction rules. They are
separate processes, with no HTTP app import in the worker. See ADR 0001.
