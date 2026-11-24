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

Deploys to Vercel as a static SPA — see [Hosting](#hosting-vercel--render).

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

Deploys to Render as a web service with a managed Postgres instance — see
[Hosting](#hosting-vercel--render).

## Hosting: Vercel + Render

The frontend runs on Vercel and the API and database on Render. Vercel forwards
`/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to Render
([frontend/vercel.json](frontend/vercel.json)), so the browser only ever talks
to one origin: no CORS, and no backend URL compiled into the bundle. Leave
`VITE_API_URL` unset.

**1. Render (API + Postgres).** Dashboard → New → Blueprint → this repository.
[render.yaml](render.yaml) creates `premierpower-api` and `premierpower-db` in
Frankfurt and asks for the admin login, Cloudinary keys and SMTP settings.
`SECRET_KEY` is generated. When it is live, check
`https://premierpower-api.onrender.com/api/health`.

If Render gives the service a different address (the name was taken), replace
`premierpower-api.onrender.com` in `frontend/vercel.json` to match.

**2. Vercel (frontend).** New Project → this repository → Root Directory
`frontend`. Vite is detected; no environment variables are needed.

**3. Tie them together.** Set `CORS_ORIGINS` on Render to the Vercel address,
and in the CMS set the site URL setting to it so the sitemap lists the right
domain.

Costs and limits:

- **Cloudinary is required.** Render's disk is wiped on every deploy, so
  uploads must go to Cloudinary. For PDFs, enable "Allow delivery of PDF and
  ZIP files" in Cloudinary → Settings → Security (`CLOUDINARY_DOCUMENTS` is
  already `true`).
- **The API is on Render's Starter plan ($7/month)**, so it stays awake. On
  the free plan it sleeps after 15 minutes and the next visitor waits about a
  minute.
- **The database is on the free plan, which Render deletes 30 days after
  creation**, CMS content included. Change `plan` under `databases` in
  render.yaml to `basic-256mb` (about $6/month) before then.

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
.venv/bin/pytest          # against a throwaway Postgres database
```

Covers the lead round trip, validation rejection, the admin auth gate, and the
rule that unpublished content and unset settings are never served.

### Light and dark

```bash
cd frontend
SITE_URL=http://127.0.0.1:8090 npm run test:theme
```

Asserts that every light-mode role still resolves to the literal it replaced
(so the switch never restyles light mode), that the switch flips both ways and
persists, that a stored choice outranks the operating system while an unset one
follows it, that the theme is applied before first paint, that the control is
keyboard-operable, and that no page loses contrast in dark mode. The contrast check is
**differential** on purpose: text over photography cannot be judged from tokens
alone and already fails in light mode, so only a regression between the two
themes counts.

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

PostgreSQL is the only supported database. The app refuses to start against
anything else rather than failing later in a less obvious place: the schema
uses Postgres types and the migrations emit Postgres DDL. For a local run
outside Docker, start just the database with `docker compose up -d db` and
point `DATABASE_URL` at `localhost:5440`.

## Before it goes live

Everything below is configuration, not code. The site runs without any of it —
which is the risk, because nothing fails loudly except where noted.

| | What | Why it matters |
|---|---|---|
| 1 | `SMTP_PASSWORD` — a Google App Password for the `SMTP_USER` account | **Until this is set, no enquiry is emailed to anyone.** They are still saved and still appear in the admin, so the failure is silent. The admin dashboard shows a red warning naming the count while it is unset. |
| 2 | `VITE_DEMO=0`, then rebuild the frontend | With demo mode on, the footer of every page prints "NCA DUMMY — not a registration" and the stats band shows placeholder figures marked with an asterisk. |
| 3 | Company details, in the CMS under **Company details** | Sixteen fields — phone, email, address, EPRA and NCA numbers, insurer, warranty, trading figures. Anything left blank is hidden rather than invented, so the site stays honest but says less than it could. |
| 4 | `site_url` | Used by `sitemap.xml` and `robots.txt`. Defaults to `https://premierpower.co.ke`. |
| 5 | Real reviews | The reviews page ships placeholder text. Three genuine ones do more for conversion than anything visual. |

Two credentials are outstanding and can only come from the client: the **EPRA
Electrical Contractor Licence number and class**, and the **NCA registration
number**. Both render as "licensed" / "registered" without a number until
supplied.

Postgres runs on a Docker volume. `docker compose down` preserves it;
`docker compose down -v` deletes every enquiry, CMS edit and upload.

### Manual pass before launch

Automation does not cover these:

- Tap the sticky bottom bar on a real handset, not a devtools viewport.
- Follow the WhatsApp link on a phone and confirm it opens the right number.
- Submit the form on the deployed backend and confirm the client receives it.
- Check the EPRA number on the live site against the Authority's register.

## API

`GET /api/docs` for the interactive reference. Public reads need no auth;
every write needs an admin bearer token.

```bash
# Log in (form-encoded, OAuth2 password flow)
curl -X POST http://localhost:8010/api/admin/login \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD"

# Then pass the token
curl http://localhost:8010/api/stats -H "Authorization: Bearer $TOKEN"
```

| Resource | Public | Admin |
|---|---|---|
| `/api/services` | `GET`, `GET /{slug}` | `GET /all`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| `/api/projects` | `GET`, `GET /{slug}` | same |
| `/api/blog` | `GET`, `GET /{slug}` | same |
| `/api/testimonials` | `GET` | `GET /all`, `POST`, `PUT`, `DELETE` |
| `/api/faqs` | `GET` | same |
| `/api/team` | `GET` | same |
| `/api/banners` | `GET` | same |
| `/api/settings` | `GET` (non-empty only) | `GET /all`, `PUT /{key}` |
| `/api/leads` | `POST` (throttled) | `GET`, `PATCH /{id}/handled`, `DELETE /{id}` |
| `/api/newsletter` | `POST /subscribe`, `POST /unsubscribe` | `GET /subscribers`, `DELETE /subscribers/{id}` |
| `/api/media` | — | `POST /image`, `GET /library`, `DELETE /library/{id}` |
| `/api/admin` | `POST /login` | `GET /me`, `POST /change-password`, `POST /logout-everywhere`, `GET/POST /users`\*, `DELETE /users/{id}`\* |
| `/api/audit` | — | `GET` |
| `/api/stats` | — | `GET` |

\* superuser only.

Notes:

- Unpublished rows are invisible to public reads and visible on `/all`.
- Every write is recorded in the audit log with actor, entity, and IP.
- Uploads go to Cloudinary when configured, otherwise to the `uploads` volume
  and are served from `/uploads`. Images only, 10MB cap.
- Changing a password or calling `logout-everywhere` invalidates all existing
  tokens for that admin.

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
