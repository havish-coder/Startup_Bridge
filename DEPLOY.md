# Deployment

The whole stack is containerized: Postgres + backend (Express/Prisma) + frontend
(Vite build served by nginx, which also reverse-proxies `/api` to the backend).

## Run the full stack locally

```bash
# 1. Put real secrets in backend/.env (at minimum JWT_SECRET).
#    Generate one with:
#      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 2. Build and start everything:
docker compose up --build -d
```

- Frontend → http://localhost:8080
- Backend  → http://localhost:4000/api/health
- Postgres → localhost:5432

The backend container runs `npx prisma migrate deploy` on every start (see
`backend/Dockerfile`), so the schema is applied automatically. This is the
production-safe migration command — never `migrate dev` or `db push` in prod.

## What still needs doing before a real public deploy

- **HTTPS / TLS.** The compose setup is HTTP only. In front of it, terminate TLS
  with Caddy (automatic Let's Encrypt) or put it behind Cloudflare. JWTs and
  negotiation chat must not travel in plaintext.
- **Secrets.** `backend/.env` is fine for local/dev. In production inject
  `JWT_SECRET` and the DB password through the platform's secret manager — never
  commit them, never share over chat. Rotate the current `JWT_SECRET` (it has
  been shared over WhatsApp and is considered compromised).
- **File storage.** Uploads currently live on a Docker volume (`uploads_data`).
  That survives restarts but does NOT scale to multiple backend replicas. Move
  to S3 / Cloudflare R2 before scaling out. *(Owner: Switin — files/upload.)*
- **Backups & monitoring.** Enable managed Postgres backups and an uptime check
  on `/api/health`.
- **CORS.** `FRONTEND_URL` is pinned (the backend refuses to boot without it).
  Set it to the real frontend origin in production.
