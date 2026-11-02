import shutil
from contextvars import ContextVar
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select

from . import auth, media
from .config import settings
from .models import Account, Job, Ledger, Session, Story, uid
from .schemas import DevLogin, Edit, StoryInput
from .templates import TEMPLATE, moderate

request_context: ContextVar[str] = ContextVar("request_id", default="")

app = FastAPI(title="WRECKDAY — development mock API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)


@app.middleware("http")
async def request_id(request: Request, call_next):
    request.state.request_id = str(uuid4())
    request_context.set(request.state.request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "retryable": exc.status_code >= 500,
            },
            "request_id": request.state.request_id,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": "Check the input fields and try again.",
                "retryable": False,
            },
            "request_id": request.state.request_id,
        },
    )


def result(data):
    return {"data": data, "request_id": request_context.get()}


def own(db, story_id, owner, lock=False):
    statement = select(Story).where(Story.id == story_id, Story.owner == owner)
    story = db.scalar(statement.with_for_update() if lock else statement)
    if not story:
        raise HTTPException(404, "Story not found")
    return story


def job_data(job):
    return {
        "id": job.id,
        "story_id": job.story_id,
        "kind": job.kind,
        "state": job.state,
        "progress": job.progress,
        "error_code": job.error_code,
        "credits_reserved": job.credits_reserved,
        "provider_cost_usd": 0,
        "provider": "mock",
    }


def story_data(story):
    return {
        "id": story.id,
        "title": story.title,
        "state": story.state,
        "template_slug": story.template_slug,
        "revision": story.revision,
        "frames": [
            {
                **f,
                "url": media.sign(story.id, f["key"]),
                "still_url": media.sign(story.id, f["still_key"])
                if f.get("still_key", "").endswith("-v2.png") and story.export_revision == story.revision
                else None,
            }
            for f in story.frames
        ],
        "reveal": story.reveal,
        "export_url": None,
        "provider": "mock",
        "created_at": story.created_at.isoformat(),
    }


@app.get("/healthz")
def health():
    return result({"status": "ok", "mode": "mock", "environment": settings.environment})


@app.get("/readyz")
def ready():
    with Session() as db:
        db.execute(select(Account).limit(1))
    media.root()
    return result({"status": "ready"})


@app.get("/v1/templates")
def templates():
    return result([TEMPLATE])


@app.get("/v1/templates/{slug}")
def template(slug: str):
    if slug != TEMPLATE["slug"]:
        raise HTTPException(404, "Template not found")
    return result(TEMPLATE)


@app.post("/v1/dev/session")
def login(body: DevLogin):
    if not settings.dev_auth:
        raise HTTPException(404, "Development sign-in is disabled")
    owner = auth.subject(body.account)
    with Session.begin() as db:
        # Upsert prevents simultaneous fixture sign-ins from duplicating grants.
        from sqlalchemy.dialects.postgresql import insert

        inserted = db.execute(
            insert(Account)
            .values(id=owner, available=30, reserved=0)
            .on_conflict_do_nothing()
            .returning(Account.id)
        ).scalar()
        if inserted:
            db.add(Ledger(owner=owner, event_key=f"grant:{owner}", event="grant", amount=30))
    return result({"access_token": auth.token(body.account), "user_id": owner, "mode": "development fixture"})


@app.get("/v1/me")
def me(owner=Depends(auth.user)):
    return result({"id": owner, "mode": "development fixture"})


@app.get("/v1/wallet")
def wallet(owner=Depends(auth.user)):
    with Session() as db:
        account = db.get(Account, owner)
        if not account:
            raise HTTPException(401, "Sign in again")
        return result(
            {"available": account.available, "reserved": account.reserved, "currency": "demo credits"}
        )


@app.post("/v1/stories", status_code=201)
def create(body: StoryInput, owner=Depends(auth.user)):
    if not moderate(body.model_dump()):
        raise HTTPException(
            422, "This demo supports fictional, harmless apartment comedy. Please change the details."
        )
    with Session.begin() as db:
        if not db.get(Account, owner):
            raise HTTPException(401, "Sign in again")
        story = Story(
            owner=owner,
            template_slug=body.template_slug,
            title=TEMPLATE["title"],
            inputs=body.model_dump(),
            reveal=TEMPLATE["reveal"],
        )
        db.add(story)
        db.flush()
        return result(story_data(story))


@app.post("/v1/stories/{story_id}/generate", status_code=202)
def generate(
    story_id: str, idempotency_key: str = Header(min_length=8, max_length=128), owner=Depends(auth.user)
):
    with Session.begin() as db:
        account = db.scalar(select(Account).where(Account.id == owner).with_for_update())
        story = own(db, story_id, owner, True)
        existing = db.scalar(select(Job).where(Job.owner == owner, Job.idempotency_key == idempotency_key))
        if existing:
            if existing.story_id != story_id or existing.kind != "generate":
                raise HTTPException(409, "Idempotency key already belongs to another operation")
            return result(job_data(existing))
        if story.state not in ("created", "failed", "canceled"):
            raise HTTPException(409, "Story already queued or generated")
        active = db.scalar(
            select(Job).where(
                Job.owner == owner, Job.state.in_(["queued", "planning", "generating", "rendering"])
            )
        )
        if active:
            raise HTTPException(409, "Finish the current job first")
        if not account or account.available < 3:
            raise HTTPException(402, "Not enough demo credits")
        account.available -= 3
        account.reserved += 3
        job = Job(
            id=uid(), story_id=story.id, owner=owner, idempotency_key=idempotency_key, credits_reserved=3
        )
        db.add(job)
        db.add(Ledger(owner=owner, event_key=f"reserve:{job.id}", event="reserve", amount=0))
        story.state = "queued"
        db.flush()
        return result(job_data(job))


@app.get("/v1/jobs/{job_id}")
def get_job(job_id: str, owner=Depends(auth.user)):
    with Session() as db:
        job = db.scalar(select(Job).where(Job.id == job_id, Job.owner == owner))
        if not job:
            raise HTTPException(404, "Job not found")
        return result(job_data(job))


@app.post("/v1/jobs/{job_id}/cancel")
def cancel(job_id: str, owner=Depends(auth.user)):
    with Session.begin() as db:
        db.scalar(select(Account).where(Account.id == owner).with_for_update())
        initial = db.scalar(select(Job).where(Job.id == job_id, Job.owner == owner))
        if not initial:
            raise HTTPException(404, "Job not found")
        story = own(db, initial.story_id, owner, True)
        job = db.scalar(select(Job).where(Job.id == job_id).with_for_update())
        if job.state not in ("completed", "failed", "canceled"):
            from .worker import settle

            settle(db, job, False)
            job.state = "canceled"
            job.error_code = "USER_CANCELED"
            if job.kind == "generate":
                story.state = "canceled"
        return result(job_data(job))


@app.get("/v1/stories")
def library(limit: int = 20, offset: int = 0, owner=Depends(auth.user)):
    if not 1 <= limit <= 50 or offset < 0:
        raise HTTPException(422, "Invalid page")
    with Session() as db:
        stories = db.scalars(
            select(Story)
            .where(Story.owner == owner)
            .order_by(Story.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result([story_data(s) for s in stories])


@app.get("/v1/stories/{story_id}")
def get_story(story_id: str, owner=Depends(auth.user)):
    with Session() as db:
        story = own(db, story_id, owner)
        latest = db.scalar(
            select(Job).where(Job.story_id == story_id).order_by(Job.created_at.desc()).limit(1)
        )
        return result({**story_data(story), "latest_job_id": latest.id if latest else None})


@app.patch("/v1/stories/{story_id}")
def edit(story_id: str, body: Edit, owner=Depends(auth.user)):
    if sorted(body.order) != [0, 1, 2] or any(not c.strip() or len(c) > 140 for c in body.captions):
        raise HTTPException(422, "Use three unique frames and captions of 1–140 characters")
    with Session.begin() as db:
        story = own(db, story_id, owner, True)
        if story.state != "completed" or story.revision != body.revision:
            raise HTTPException(409, "Story changed. Reload before editing.")
        story.frames = [{**story.frames[i], "caption": body.captions[i]} for i in body.order]
        story.reveal = body.reveal
        story.revision += 1
        return result(story_data(story))


@app.post("/v1/stories/{story_id}/export", status_code=202)
def export(story_id: str, owner=Depends(auth.user)):
    with Session.begin() as db:
        story = own(db, story_id, owner, True)
        if story.state != "completed":
            raise HTTPException(409, "Generate the story first")
        key = f"stills-v2:{story.id}:{story.revision}"
        existing = db.scalar(select(Job).where(Job.owner == owner, Job.idempotency_key == key))
        if existing:
            if existing.state == "failed":
                existing.state = "queued"
                existing.attempt_count = 0
                existing.error_code = None
            return result(job_data(existing))
        job = Job(story_id=story.id, owner=owner, kind="export", idempotency_key=key)
        db.add(job)
        db.flush()
        return result(job_data(job))


@app.delete("/v1/stories/{story_id}")
def delete(story_id: str, owner=Depends(auth.user)):
    with Session.begin() as db:
        account = db.scalar(select(Account).where(Account.id == owner).with_for_update())
        story = own(db, story_id, owner, True)
        jobs = db.scalars(select(Job).where(Job.story_id == story_id).with_for_update()).all()
        for job in jobs:
            if job.credits_reserved:
                account.available += job.credits_reserved
                account.reserved -= job.credits_reserved
                db.add(
                    Ledger(
                        owner=owner,
                        event_key=f"release:{job.id}",
                        event="release",
                        amount=0,
                    )
                )
                job.credits_reserved = 0
            db.delete(job)
        db.delete(story)
        shutil.rmtree(media.path(story_id), ignore_errors=True)
    return result({"deleted": True})


@app.get("/v1/media/{story_id}/{filename}")
def download(story_id: str, filename: str, expires: int, signature: str):
    key = f"{story_id}/{filename}"
    media.verify(story_id, key, expires, signature)
    with Session() as db:
        story = db.get(Story, story_id)
        if not story or key not in [f["key"] for f in story.frames] + [
            f.get("still_key") for f in story.frames if f.get("still_key", "").endswith("-v2.png")
        ]:
            raise HTTPException(404, "Asset not found")
    target = media.path(key)
    if not target.is_file():
        raise HTTPException(404, "Asset not found")
    return FileResponse(
        target, media_type="video/mp4" if filename.endswith(".mp4") else "image/png", filename=filename
    )
