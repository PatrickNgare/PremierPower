"""Test database.

Tests run against PostgreSQL — the same engine that ships. There is no SQLite
path: a suite that passes against a different database than production is
testing a system nobody runs, and it hid two real bugs here already (a
Postgres-only `now()` default, and a column too narrow for its data, which
SQLite silently accepted because it does not enforce VARCHAR length).

A throwaway database is created for the session and dropped at the end, so the
suite never touches development data.

Point it somewhere else with TEST_DATABASE_URL, or let it derive one by
appending `_test` to the database in DATABASE_URL.
"""

import os
from urllib.parse import urlparse, urlunparse

import psycopg
import pytest

DEFAULT_DEV_URL = "postgresql+psycopg://premierpower:premierpower@localhost:5440/premierpower"


def _derive_test_url(url: str) -> str:
    parts = urlparse(url)
    name = parts.path.lstrip("/") or "premierpower"
    return urlunparse(parts._replace(path=f"/{name}_test"))


def _maintenance_dsn(url: str) -> str:
    """A DSN for the `postgres` database, which is where CREATE/DROP DATABASE
    has to be issued from — you cannot drop the database you are connected to.
    psycopg wants a plain postgresql:// scheme, not SQLAlchemy's +psycopg."""
    parts = urlparse(url)
    return urlunparse(parts._replace(scheme="postgresql", path="/postgres"))


TEST_URL = os.environ.get("TEST_DATABASE_URL") or _derive_test_url(
    os.environ.get("DATABASE_URL") or DEFAULT_DEV_URL
)
TEST_DB = urlparse(TEST_URL).path.lstrip("/")

# Set before anything imports the app: app.settings reads the environment once,
# at import, and app.db builds its engine from it.
os.environ["DATABASE_URL"] = TEST_URL
os.environ.setdefault("SECRET_KEY", "test-key-that-is-at-least-32-bytes-long-for-hs256")
os.environ.setdefault("ADMIN_EMAIL", "admin@premierpower.test")
os.environ.setdefault("ADMIN_PASSWORD", "test-password-1234")


def _drop_database(conn) -> None:
    # Anything still attached blocks the drop; sessions left by a previous
    # interrupted run are the usual culprit.
    conn.execute(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = %s AND pid <> pg_backend_pid()",
        (TEST_DB,),
    )
    conn.execute(f'DROP DATABASE IF EXISTS "{TEST_DB}"')


def _recreate_database() -> None:
    with psycopg.connect(_maintenance_dsn(TEST_URL), autocommit=True) as conn:
        _drop_database(conn)
        conn.execute(f'CREATE DATABASE "{TEST_DB}"')


@pytest.fixture(scope="session", autouse=True)
def database():
    """A clean database for the session.

    Created before the app starts, so the lifespan's `alembic upgrade head`
    runs against an empty schema exactly as it would on a new deployment —
    which is the point of running the migrations in the suite at all.
    """
    try:
        _recreate_database()
    except psycopg.OperationalError as exc:
        pytest.exit(
            f"Cannot reach PostgreSQL at {_maintenance_dsn(TEST_URL)}: {exc}\n"
            "Start it with `docker compose up -d db`, or set TEST_DATABASE_URL.",
            returncode=1,
        )
    yield
    # Dropped on the way out, so nothing is left behind between runs. The next
    # run recreates it regardless, so a failure here is not worth stopping for.
    try:
        with psycopg.connect(_maintenance_dsn(TEST_URL), autocommit=True) as conn:
            _drop_database(conn)
    except psycopg.OperationalError:
        pass


@pytest.fixture(scope="session")
def client(database):
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth(client):
    r = client.post("/api/admin/login", data={
        "username": os.environ["ADMIN_EMAIL"], "password": os.environ["ADMIN_PASSWORD"],
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
