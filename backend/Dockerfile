FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Installed first so the layer caches across source changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Runs unprivileged.
RUN useradd --create-home --uid 10001 appuser

# The upload directory must exist and be owned by appuser *in the image*:
# Docker seeds a fresh named volume from the image directory, ownership
# included. Created by root at mount time, the unprivileged process cannot
# write to it and every upload fails with a 500.
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app/uploads

USER appuser

EXPOSE 8000
# PORT is set by hosts such as Render; compose leaves it unset and gets 8000.
# Proxy headers are trusted because the app always sits behind one (nginx
# locally, Vercel and Render's edge in production): without them request URLs
# say http:// and the client address is the proxy's.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
