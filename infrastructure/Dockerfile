# syntax=docker/dockerfile:1
FROM python:3.12-slim
RUN --mount=type=secret,id=proxy_ca,target=/run/secrets/proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then cp /run/secrets/proxy_ca /usr/local/share/ca-certificates/session-proxy.crt; update-ca-certificates; fi; \
    apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services/api/requirements.lock ./requirements.lock
RUN --mount=type=secret,id=proxy_ca,target=/run/secrets/proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export PIP_CERT=/run/secrets/proxy_ca; fi; \
    pip install --no-cache-dir -r requirements.lock
COPY services/api/ ./
RUN useradd --uid 10001 --create-home appuser && mkdir -p /data/media && chown -R appuser /data
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
