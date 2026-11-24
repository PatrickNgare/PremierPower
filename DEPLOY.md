# Deploying to one server

A single Ubuntu server running the same `docker compose` stack as your laptop,
behind Caddy for HTTPS. Nothing about the application changes: nginx still
serves the SPA and proxies `/api` on the compose network, and no host URL is
baked into the build — which is why the same image works on any domain.

## 1. The server

Any VPS will do: Ubuntu Server 24.04, 1 GB of RAM, 20 GB of disk, a static
public IP, and SSH key access.

Firewall — inbound only:

| Port | Source | Why |
|---|---|---|
| 22 | **Your IP only** | SSH. Never `0.0.0.0/0`. |
| 80 | Anywhere | Let's Encrypt HTTP-01 validation, then redirects to 443 |
| 443 | Anywhere | The site |

Do **not** open 5440, 8010 or 8090. The stack pins those to loopback (below),
so nothing outside the box can reach Postgres or the API directly.

## 2. The domain

Using a free subdomain from [duckdns.org](https://duckdns.org): sign in, create
e.g. `premierpower`, and set its IP to the server IP. It resolves in seconds
and Let's Encrypt is happy to certify it.

Verify before going further — Caddy will fail to get a certificate otherwise:

```bash
dig +short premierpower.duckdns.org     # must print your server IP
```

## 3. Bootstrap

```bash
ssh -i your-key.pem ubuntu@<server-ip>
curl -fsSL https://raw.githubusercontent.com/PatrickNgare/PremierPower/master/deploy/bootstrap.sh | bash
exit          # docker group membership needs a fresh login
```

The script adds **2 GB of swap**, which is not optional: a 1 GB server
has too little RAM and `npm ci && vite build` inside Docker is killed without it,
with nothing but exit code 137 to explain itself.

## 4. Configure

```bash
ssh -i your-key.pem ubuntu@<server-ip>
cd ~/PremierPower
cp .env.example .env
nano .env
```

Everything that differs from the laptop defaults:

```ini
# The reverse proxy is the only public listener. Without these three the
# database is exposed to the internet.
DB_BIND=127.0.0.1:
API_BIND=127.0.0.1:
WEB_BIND=127.0.0.1:

SITE_DOMAIN=premierpower.duckdns.org
ACME_EMAIL=you@example.com

# Generate each of these — never reuse the laptop values:
#   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
SECRET_KEY=<generated>
POSTGRES_PASSWORD=<generated>
ADMIN_PASSWORD=<generated>

CORS_ORIGINS=https://premierpower.duckdns.org
SITE_URL=https://premierpower.duckdns.org

# Off. Demo mode stamps a black "this data is not real" ribbon across every
# page and renders the licences as "DUMMY — not a licence".
VITE_DEMO=

# Same Cloudinary account as local — the images are already there.
CLOUDINARY_CLOUD_NAME=diduc97on
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## 5. Start

```bash
./deploy/up.sh
```

It refuses to start if the bind variables are missing, because publishing
Postgres to the internet is the one mistake that turns a pitch site into an
incident. First build takes several minutes on a small server; subsequent ones
are cached.

Then open `https://premierpower.duckdns.org`. Caddy fetches the certificate on
the first request, so the very first load can take a few seconds.

## 6. Load the content

The site reads everything from the CMS at `/admin`. Sign in with `ADMIN_EMAIL`
and `ADMIN_PASSWORD`, then fill **Company details** — with demo mode off, an
empty field renders as a visible gap rather than a placeholder.

## Updating

```bash
cd ~/PremierPower && git pull && ./deploy/up.sh
```

## Backups

The overlay runs a nightly `pg_dump` into `deploy/backups/`, keeping seven
days. To pull one down:

```bash
scp -i your-key.pem ubuntu@<server-ip>:~/PremierPower/deploy/backups/*.gz .
```

To restore:

```bash
gunzip -c deploy/backups/2026-09-01.sql.gz \
  | docker compose exec -T db psql -U premierpower -d premierpower
```

## Troubleshooting

**Build killed, exit 137** — out of memory. Confirm swap is on: `swapon --show`.

**Caddy will not get a certificate** — DNS is not pointing here yet, or port 80
is closed. Check `dig +short $SITE_DOMAIN` and the firewall, then
`docker compose logs caddy`.

**502 from Caddy** — the API is still starting. `docker compose ps` will show
`web` waiting on `api`'s healthcheck; give it 30 seconds.

**Enquiries arrive but no email** — `SMTP_PASSWORD` is unset. The enquiry still
saves and the admin bell still lights; the dashboard says so explicitly.
