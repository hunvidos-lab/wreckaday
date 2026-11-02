import hashlib
import hmac
import time
from pathlib import Path

from fastapi import HTTPException

from .config import settings


def root():
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    return settings.storage_root.resolve()


def path(key: str):
    target = (root() / key).resolve()
    if not target.is_relative_to(root()):
        raise ValueError("Invalid asset key")
    return target


def sign(story_id: str, key: str):
    expires = int(time.time()) + 300
    message = f"{story_id}:{key}:{expires}"
    signature = hmac.new(settings.signing_secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    return f"{settings.public_api_url}/v1/media/{story_id}/{Path(key).name}?expires={expires}&signature={signature}"


def verify(story_id: str, key: str, expires: int, signature: str):
    expected = hmac.new(
        settings.signing_secret.encode(), f"{story_id}:{key}:{expires}".encode(), hashlib.sha256
    ).hexdigest()
    if expires < time.time() or expires > time.time() + 301 or not hmac.compare_digest(signature, expected):
        raise HTTPException(403, "Media link expired or invalid")
