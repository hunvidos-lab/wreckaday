"""Local operator tools: python -m app.generation_ledger show|reconcile|seed-day."""

import argparse
import json
from datetime import UTC, datetime
from decimal import Decimal

import httpx

from .budget_store import BudgetStore
from .generation_config import settings
from .generation_costs import CostMeter


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("show", "reconcile", "seed-day"))
    parser.add_argument("--day", default=datetime.now(UTC).date().isoformat())
    parser.add_argument("--reserved-usd", type=Decimal)
    args = parser.parse_args()
    ledger = BudgetStore(settings.budget_database_url.get_secret_value())
    if args.action == "seed-day":
        datetime.strptime(args.day, "%Y-%m-%d")
        if args.reserved_usd is None or not args.reserved_usd.is_finite() or args.reserved_usd < 0:
            parser.error("seed-day requires a nonnegative --reserved-usd; each call ADDS this amount")
        ledger.seed_day(args.day, args.reserved_usd)
        print("Added prior reservation. Do not repeat the migration seed.")
        return
    for row in ledger.records():
        meter = CostMeter(settings, lambda costs: None)
        meter.components = json.loads(row["costs"])
        if args.action == "reconcile":
            # Reads only stored fal request IDs; never invokes an inference endpoint.
            with httpx.Client(follow_redirects=False) as client:
                meter.reconcile(client)
            ledger.settle_key(row["id"], row["status"], meter.components)
        print(json.dumps({"id": row["id"], "day": row["day"], "status": row["status"], **meter.summary()}))


if __name__ == "__main__":
    main()
