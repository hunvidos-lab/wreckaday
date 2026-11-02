import logging
import shutil
import threading
import time
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from . import media
from .models import Account, Job, Ledger, Session, Story, now
from .providers import MockImageGenerator, MockStoryWriter
from .render import render

log = logging.getLogger("wreckday.worker")
ACTIVE = ("planning", "generating", "rendering")


def settle(db, job, capture):
    if not job.credits_reserved:
        return
    account = db.scalar(select(Account).where(Account.id == job.owner).with_for_update())
    amount = job.credits_reserved
    account.reserved -= amount
    if not capture:
        account.available += amount
    db.add(
        Ledger(
            owner=job.owner,
            event_key=f"{'capture' if capture else 'release'}:{job.id}",
            event="capture" if capture else "release",
            amount=-amount if capture else 0,
        )
    )
    job.credits_reserved = 0


def recover_leases():
    # Read candidates without locks, then use the same account -> story -> job
    # order as requests. Recheck expiry under lock to avoid refunding a heartbeat.
    with Session() as db:
        candidates = db.execute(
            select(Job.id, Job.owner, Job.story_id).where(Job.state.in_(ACTIVE), Job.lease_expires_at < now())
        ).all()
    for job_id, owner, story_id in candidates:
        with Session.begin() as db:
            db.scalar(select(Account).where(Account.id == owner).with_for_update())
            story = db.scalar(select(Story).where(Story.id == story_id).with_for_update())
            job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
            if not job or job.state not in ACTIVE or job.lease_expires_at >= now():
                continue
            if job.attempt_count >= 2:
                job.state = "failed"
                job.error_code = "WORKER_INTERRUPTED"
                settle(db, job, False)
                if story and job.kind == "generate":
                    story.state = "failed"
            else:
                job.state = "queued"


def claim(worker):
    recover_leases()
    with Session.begin() as db:
        job = db.scalar(
            select(Job)
            .where(Job.state == "queued")
            .order_by(Job.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if not job:
            return None
        job.state = "planning"
        job.attempt_count += 1
        job.lease_owner = worker
        job.lease_expires_at = now() + timedelta(seconds=90)
        return job.id


def heartbeat(job_id, worker, stop):
    while not stop.wait(10):
        with Session.begin() as db:
            job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
            if not job or job.lease_owner != worker or job.state not in ACTIVE:
                return
            job.lease_expires_at = now() + timedelta(seconds=90)


def process(job_id, worker):
    stop = threading.Event()
    thread = threading.Thread(target=heartbeat, args=(job_id, worker, stop), daemon=True)
    thread.start()
    workspace = media.root() / "_jobs" / f"{job_id}-{worker}"
    try:
        with Session.begin() as db:
            job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
            if not job or job.lease_owner != worker or job.state not in ACTIVE:
                return
            story = db.get(Story, job.story_id)
            if not story:
                return
            story_id = story.id
            revision = story.revision
            kind = job.kind
            frames = story.frames
            reveal = story.reveal
            job.state = "generating" if kind == "generate" else "rendering"
            job.progress = 15
            if kind == "generate":
                plan = MockStoryWriter().plan(story.inputs)
                frames = [
                    {
                        "id": str(uuid4()),
                        "key": f"{story_id}/frame-{i}.png",
                        "caption": frame.caption,
                        "beat": frame.beat,
                    }
                    for i, frame in enumerate(plan)
                ]
        workspace.mkdir(parents=True, exist_ok=True)
        for i, frame in enumerate(frames):
            if kind == "generate":
                MockImageGenerator().generate(i, workspace / f"frame-{i}.png")
            else:
                target = workspace / frame["key"].split("/")[-1]
                if frame.get("still_key", "").endswith("-v2.png"):
                    shutil.copyfile(media.path(frame["key"]), target)
                else:
                    # Older mock frames contained a baked-in label; refresh from the clean fixture.
                    MockImageGenerator().generate(i, target)
        with Session.begin() as db:
            job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
            if not job or job.lease_owner != worker or job.state not in ACTIVE:
                return
            job.state = "rendering"
            job.progress = 70
        video = workspace / f"export-{revision}.mp4"
        render(workspace, frames, reveal, video)
        with Session.begin() as db:
            # Account -> story -> job lock order matches HTTP operations.
            db.scalar(select(Account).where(Account.id == job.owner).with_for_update())
            story = db.scalar(select(Story).where(Story.id == story_id).with_for_update())
            current = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
            if not story or not current or current.lease_owner != worker or current.state not in ACTIVE:
                return
            if story.revision != revision:
                current.state = "failed"
                current.error_code = "STORY_CHANGED_EXPORT_AGAIN"
                return
            destination = media.path(story_id)
            destination.mkdir(parents=True, exist_ok=True)
            if kind == "generate":
                for i in range(3):
                    shutil.copyfile(workspace / f"frame-{i}.png", destination / f"frame-{i}.png")
                story.frames = frames
                story.state = "completed"
            if kind == "export":
                for frame in frames:
                    shutil.copyfile(workspace / frame["key"].split("/")[-1], media.path(frame["key"]))
            for i, frame in enumerate(frames):
                frame["still_key"] = f"{story_id}/still-{frame['id']}-r{revision}-v2.png"
                shutil.copyfile(workspace / f"card-{i}.png", media.path(frame["still_key"]))
            story.frames = [dict(frame) for frame in frames]
            story.export_key = None
            story.export_revision = revision
            current.state = "completed"
            current.progress = 100
            current.error_code = None
            settle(db, current, True)
        log.info("job completed id=%s provider=mock provider_cost_usd=0", job_id)
    except Exception:
        log.exception("job failed id=%s", job_id)
        with Session.begin() as db:
            initial = db.get(Job, job_id)
            if initial:
                db.scalar(select(Account).where(Account.id == initial.owner).with_for_update())
                story = db.scalar(select(Story).where(Story.id == initial.story_id).with_for_update())
                job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
                if job and job.lease_owner == worker:
                    job.state = "failed"
                    job.error_code = "RENDER_FAILED"
                    if story and job.kind == "generate":
                        story.state = "failed"
                    settle(db, job, False)
    finally:
        stop.set()
        thread.join(timeout=2)
        shutil.rmtree(workspace, ignore_errors=True)


def run_once():
    worker = str(uuid4())
    job_id = claim(worker)
    if job_id:
        process(job_id, worker)
    return job_id


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    while True:
        try:
            if not run_once():
                time.sleep(1)
        except SQLAlchemyError:
            log.warning("Database unavailable; retrying in two seconds")
            time.sleep(2)
