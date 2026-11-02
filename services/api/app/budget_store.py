"""Atomic, content-free development reservations shared across processes/restarts."""

import hashlib
import json
import threading
from decimal import ROUND_CEILING, Decimal
from pathlib import Path

from sqlalchemy import BigInteger, Column, MetaData, String, Table, Text, create_engine, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool

NANO = Decimal(1_000_000_000)
metadata = MetaData()
days = Table(
    "generation_budget_days",
    metadata,
    Column("day", String, primary_key=True),
    Column("reserved", BigInteger, nullable=False),
)
attempts = Table(
    "generation_cost_records",
    metadata,
    Column("id", String, primary_key=True),
    Column("day", String, nullable=False),
    Column("ceiling", BigInteger, nullable=False),
    Column("status", String, nullable=False),
    Column("costs", Text, nullable=False),
)


def nanos(amount: Decimal) -> int:
    return int((amount * NANO).to_integral_value(rounding=ROUND_CEILING))


class BudgetRejected(Exception):
    pass


class DuplicateAttempt(Exception):
    pass


class BudgetStore:
    def __init__(self, url: str):
        self.url = url
        self.engine = None
        self.lock = threading.Lock()

    def connect(self):
        # Lazy initialization: importing the disabled API never creates a database.
        with self.lock:
            if self.engine is None:
                engine = create_engine(
                    self.url,
                    **(
                        {
                            "connect_args": {"check_same_thread": False, "timeout": 30},
                            **({"poolclass": StaticPool} if self.url.endswith(":memory:") else {}),
                        }
                        if self.url.startswith("sqlite:")
                        else {}
                    ),
                )
                if engine.dialect.name not in ("sqlite", "postgresql"):
                    raise ValueError("Use SQLite for development or PostgreSQL")
                if engine.dialect.name == "sqlite" and engine.url.database not in (None, ":memory:"):
                    Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
                metadata.create_all(engine)
                self.engine = engine
        return self.engine

    def reserve(self, request_id: str, day: str, ceiling: Decimal, limit: Decimal | None) -> Decimal:
        engine = self.connect()
        insert = sqlite_insert if engine.dialect.name == "sqlite" else pg_insert
        try:
            with engine.begin() as conn:
                conn.execute(insert(days).values(day=day, reserved=0).on_conflict_do_nothing())
                # Insert first: duplicate IDs roll back the entire transaction, including the day update.
                conn.execute(
                    attempts.insert().values(
                        id=self.key(request_id),
                        day=day,
                        ceiling=nanos(ceiling),
                        status="reserved",
                        costs="[]",
                    )
                )
                query = update(days).where(days.c.day == day)
                if limit is not None:
                    query = query.where(days.c.reserved + nanos(ceiling) <= int(limit * NANO))
                result = conn.execute(query.values(reserved=days.c.reserved + nanos(ceiling)))
                if result.rowcount != 1:
                    raise BudgetRejected()
                return Decimal(conn.scalar(select(days.c.reserved).where(days.c.day == day))) / NANO
        except IntegrityError as exc:
            raise DuplicateAttempt() from exc

    @staticmethod
    def key(request_id: str) -> str:
        return hashlib.sha256(request_id.encode()).hexdigest()

    def seed_day(self, day: str, amount: Decimal):
        """Account for known pre-ledger spend once during development migration."""
        engine = self.connect()
        insert = sqlite_insert if engine.dialect.name == "sqlite" else pg_insert
        with engine.begin() as conn:
            conn.execute(insert(days).values(day=day, reserved=0).on_conflict_do_nothing())
            conn.execute(
                update(days).where(days.c.day == day).values(reserved=days.c.reserved + nanos(amount))
            )

    def settle(self, request_id: str, status: str, costs: list[dict]):
        """Keep failed/unknown reservations; increase the daily hold if observed costs exceed it."""
        self.settle_key(self.key(request_id), status, costs)

    def settle_key(self, record_key: str, status: str, costs: list[dict]):
        known = sum(
            (Decimal(item["cost_usd"]) for item in costs if item.get("cost_usd") is not None), Decimal(0)
        )
        with self.connect().begin() as conn:
            row = conn.execute(select(attempts).where(attempts.c.id == record_key)).mappings().one()
            # Lock/serialize on the day row, then read the record again to avoid double settlement.
            conn.execute(update(days).where(days.c.day == row["day"]).values(reserved=days.c.reserved))
            ceiling = conn.scalar(select(attempts.c.ceiling).where(attempts.c.id == row["id"]))
            extra = max(0, nanos(known) - ceiling)
            if extra:
                conn.execute(
                    update(days).where(days.c.day == row["day"]).values(reserved=days.c.reserved + extra)
                )
            conn.execute(
                update(attempts)
                .where(attempts.c.id == row["id"])
                .values(ceiling=max(ceiling, nanos(known)), status=status, costs=json.dumps(costs))
            )

    def records(self):
        with self.connect().connect() as conn:
            return [dict(row) for row in conn.execute(select(attempts)).mappings()]
