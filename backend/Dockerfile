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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
