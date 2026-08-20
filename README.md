# PremierPower

Marketing and lead-generation site for a licensed residential electrical
contractor in Nairobi. See [PRODUCT.md](PRODUCT.md) for the brief and
[DESIGN.md](DESIGN.md) for the committed visual direction ("The Chase Plan").

## Running it with Docker

```bash
cp .env.example .env       # then set ADMIN_PASSWORD and SECRET_KEY
docker compose up --build
```

| Service | URL | Container port |
|---|---|---|
| Site | <http://localhost:8090> | 80 |
| Admin CMS | <http://localhost:8090/admin> | proxied to api |
| API docs | <http://localhost:8010/api/docs> | 8000 |
| Postgres | `localhost:5440` | 5432 |

**Host ports are deliberately non-default.** This machine already runs Postgres
on 5432 and 5438, Airflow on 8080, and Superset on 8088, so nothing here binds
a port another app is using. All three are overridable via `WEB_PORT`,
`API_PORT`, and `DB_PORT` in `.env`; the container-side ports never change, so
services still find each other on the compose network regardless.

nginx serves the built SPA and proxies `/api` and `/admin` through to the
backend, so the browser talks to one origin, no CORS is involved, and no host
URL is compiled into the bundle. Set `VITE_DEMO=1` in `.env` to build the image
with sample data.

`ADMIN_PASSWORD` and `SECRET_KEY` have no defaults — compose refuses to start
without them rather than booting with a guessable admin login.

## Running it without Docker

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # production build into dist/
```

Deploys to Vercel as a static SPA. Set `VITE_API_URL` to the backend's
`/api` origin; it falls back to a same-origin `/api` when unset.

### Backend

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # then edit it — see below
.venv/bin/uvicorn app.main:app --reload --port 8000
```

- API docs: <http://localhost:8000/api/docs>
- Admin CMS: <http://localhost:8000/admin>

`.env` must set `DATABASE_URL` (Postgres), `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
and a generated `SECRET_KEY`. Tables and the site-settings rows are created on
first startup.

Deploys to Render as a web service with a managed Postgres instance; Render
supplies `DATABASE_URL` automatically.

## Demo mode

To see the site full — for review or a client presentation — build or run it
with sample data:

```bash
cd frontend
VITE_DEMO=1 npm run dev
VITE_DEMO=1 npm run build
```

Demo mode fills the phone, WhatsApp, address, warranty and stat figures, adds
three sample testimonials, and puts a permanent black ribbon across every page
saying the data is not real.

Two fields stay deliberately unrealistic even in demo mode:

- **The EPRA licence number** renders as `SAMPLE — not a licence`. A
  plausible-looking licence number on an electrician's site is a false
  credential claim in a regulated trade, and a demo that carries one can be
  screenshotted, shared, or promoted to production by accident.
- **Testimonials** are labelled "Sample review" with placeholder text rather
  than invented praise attributed to invented customers.

For images, drop real files into `frontend/public/demo/` using the filenames in
that folder's README. Anything missing falls back to a labelled sample block,
and a broken file falls back the same way rather than showing a broken image.

Demo mode is off unless `VITE_DEMO=1` is explicitly set, so a normal production
build can never pick it up.

## Testing

### Backend

```bash
cd backend
.venv/bin/pytest          # 7 tests, throwaway SQLite — no Postgres needed
```

Covers the lead round trip, validation rejection, the admin auth gate, and the
rule that unpublished content and unset settings are never served.

### End to end

Against the Docker stack — one command, nothing else to start:

```bash
docker compose up -d
cd frontend && SITE_URL=http://localhost:8090 npm run test:e2e
```

Or against local dev servers, in three terminals:

```bash
# 1. backend
cd backend && .venv/bin/uvicorn app.main:app --port 8000

# 2. frontend, built against that backend
cd frontend
VITE_DEMO=1 VITE_API_URL=http://127.0.0.1:8000/api npm run build
npx vite preview --port 4173 --host 127.0.0.1

# 3. the tests
cd frontend && npm run test:e2e
```

21 checks across desktop and mobile: every route free of horizontal overflow,
no console errors, the hero CTA visible above the fold, a lead submitted
through the real form reaching the API, and the before/after reveal operable
from the keyboard.

Run `.venv/bin/uvicorn` with a `DATABASE_URL` pointing at SQLite
(`sqlite:///./local.db`) for a quick local run; use Postgres for anything you
intend to deploy.

### Manual pass before launch

Automation does not cover these:

- Tap the sticky bottom bar on a real handset, not a devtools viewport.
- Follow the WhatsApp link on a phone and confirm it opens the right number.
- Submit the form on the deployed backend and confirm the client receives it.
- Check the EPRA number on the live site against the Authority's register.

## What the client edits

Everything content-shaped lives in the admin CMS, no redeploy needed:

| Section | What it controls |
|---|---|
| Services | The service lines and their warning-sign lists |
| Installations | Project photo pairs — chase open, then finished |
| Testimonials | Reviews; the safety-mentioning ones sort first |
| Site settings | Phone, WhatsApp, EPRA licence, warranty, stat figures |
| Assessment requests | Incoming leads, with a handled flag |

## Launch blockers

The site renders honest, visibly-unconfirmed gaps wherever the client has not
supplied real information — it will never ship a fake licence number or a dead
phone line by accident. Every one of these must be filled before going live:

- [ ] EPRA licence number and class
- [ ] Phone and WhatsApp numbers, both confirmed live
- [ ] Registered business name and street address (feeds the JSON-LD in `index.html`)
- [ ] Workmanship warranty term
- [ ] Real installation photographs — including the marked-out wall, and at
      least one chase-open/finished pair shot from a fixed tripod position
- [ ] Three or more real testimonials
- [ ] Lead form tested end to end against the deployed backend
