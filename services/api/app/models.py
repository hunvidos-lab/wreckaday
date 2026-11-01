import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from .config import settings


def now():
    return datetime.now(UTC)


def uid():
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "credit_accounts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    available: Mapped[int] = mapped_column(default=30)
    reserved: Mapped[int] = mapped_column(default=0)
    __table_args__ = (CheckConstraint("available >= 0 AND reserved >= 0"),)


class Story(Base):
    __tablename__ = "stories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner: Mapped[str] = mapped_column(ForeignKey("credit_accounts.id"), index=True)
    template_slug: Mapped[str]
    title: Mapped[str]
    state: Mapped[str] = mapped_column(default="created")
    inputs: Mapped[dict] = mapped_column(JSON)
    frames: Mapped[list] = mapped_column(JSON, default=list)
    reveal: Mapped[str] = mapped_column(default="AI fiction. Terrible decisions, fictional consequences.")
    revision: Mapped[int] = mapped_column(default=0)
    export_revision: Mapped[int] = mapped_column(default=-1)
    export_key: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Job(Base):
    __tablename__ = "generation_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    story_id: Mapped[str] = mapped_column(ForeignKey("stories.id", ondelete="CASCADE"), index=True)
    owner: Mapped[str] = mapped_column(String(36), index=True)
    kind: Mapped[str] = mapped_column(default="generate")
    state: Mapped[str] = mapped_column(default="queued", index=True)
    progress: Mapped[int] = mapped_column(default=0)
    attempt_count: Mapped[int] = mapped_column(default=0)
    lease_owner: Mapped[str | None]
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    idempotency_key: Mapped[str]
    error_code: Mapped[str | None]
    credits_reserved: Mapped[int] = mapped_column(default=0)
    provider_cost: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (UniqueConstraint("owner", "idempotency_key"),)


class Ledger(Base):
    __tablename__ = "credit_ledger"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner: Mapped[str] = mapped_column(ForeignKey("credit_accounts.id"))
    event_key: Mapped[str] = mapped_column(unique=True)
    event: Mapped[str]
    amount: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


engine = create_engine(settings.database_url, pool_pre_ping=True)
Session = sessionmaker(engine, expire_on_commit=False)
