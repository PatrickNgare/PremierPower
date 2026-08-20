# PremierPower

Marketing and lead-generation site for a licensed residential electrical
contractor in Nairobi. See [PRODUCT.md](PRODUCT.md) for the brief and
[DESIGN.md](DESIGN.md) for the committed visual direction ("The Chase Plan").

## Running it

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
