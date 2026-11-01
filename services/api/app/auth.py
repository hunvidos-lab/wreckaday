from datetime import UTC, datetime, timedelta
from uuid import NAMESPACE_URL, uuid5

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

bearer = HTTPBearer(auto_error=False)


def subject(account: str):
    return str(uuid5(NAMESPACE_URL, f"wreckday-dev:{account}"))


def token(account: str):
    return jwt.encode(
        {
            "sub": subject(account),
            "aud": "wreckday-dev",
            "iss": "wreckday-local",
            "exp": datetime.now(UTC) + timedelta(hours=8),
        },
        settings.signing_secret,
        algorithm="HS256",
    )


def user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not settings.dev_auth or not credentials:
        raise HTTPException(401, "Sign in to continue")
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.signing_secret,
            algorithms=["HS256"],
            audience="wreckday-dev",
            issuer="wreckday-local",
            options={"require": ["exp", "sub"]},
        )
        if claims["sub"] not in {subject("alex"), subject("sam")}:
            raise ValueError("Unknown fixture account")
        return claims["sub"]
    except (jwt.PyJWTError, ValueError) as exc:
        raise HTTPException(401, "Session expired; sign in again") from exc
