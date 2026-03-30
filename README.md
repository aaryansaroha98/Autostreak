# AutoStreak

AutoStreak is a production-ready SaaS app that keeps your GitHub contribution graph active by creating **real commits** in your repositories on a reliable schedule.

It uses your own GitHub PAT, commits with your account identity, encrypts tokens at rest, and persists scheduling through Redis + BullMQ.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui patterns + Radix + Lucide icons
- Prisma + PostgreSQL (Neon/Railway compatible)
- NextAuth.js v5 (GitHub + Credentials)
- BullMQ + Redis + node-cron
- Octokit GitHub REST API (with simple-git fallback)
- Zod validation

## Core Features

- Add any GitHub repo URL (public/private) + classic PAT (`repo` scope)
- Automated commit engine:
  - `get ref -> get commit/tree -> create blob -> create tree -> create commit -> update ref`
  - fallback to `simple-git` clone/push when API path fails
- New daily file format:
  - `autostreak-YYYY-MM-DD-HH-mm.md`
  - includes UTC timestamp + quote + random payload
- Commit frequency settings:
  - daily / every 12h / every 8h
- Per-repo controls:
  - active/paused toggle
  - run now
  - edit templates
  - delete + revoke (remove encrypted PAT)
- Activity log + contribution chart preview
- API rate limiting + GitHub quota tracking

## Scheduling Model

- `node-cron` plans jobs for each UTC day
- `BullMQ` stores delayed jobs durably in Redis
- each job retries up to 3 times
- per-user stable 0-60s schedule offset reduces spikes
- random minute selection across the day makes commit timing natural

## Security

- PATs are encrypted with **AES-256-GCM** before saving
- PATs are never returned in API responses
- API routes enforce authenticated user ownership
- Input validation with Zod
- Basic Redis-backed rate limiting on sensitive routes

## Environment Variables

Copy `.env.example` to `.env`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `NEXTAUTH_SECRET` | yes | NextAuth secret |
| `NEXTAUTH_URL` | yes | App URL (e.g. `http://localhost:3000`) |
| `AUTH_TRUST_HOST` | recommended | `true` for trusted host setups |
| `GITHUB_ID` | yes | GitHub OAuth app client ID |
| `GITHUB_SECRET` | yes | GitHub OAuth app client secret |
| `ENCRYPTION_KEY` | yes | Base64-encoded 32-byte key for PAT encryption |
| `REDIS_URL` | yes | Redis connection URL |
| `CRON_SECRET` | optional | Protects `/api/scheduler/sync` |
| `APP_URL` | optional | Public app URL |

Generate encryption key:

```bash
openssl rand -base64 32
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Prepare env:

```bash
cp .env.example .env
```

3. Run database migrations and generate Prisma client:

```bash
npx prisma migrate dev
npm run prisma:generate
```

4. Start services in separate terminals:

```bash
npm run dev
npm run worker
npm run cron
```

5. Open:

- App: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

## Docker

Build and run full stack:

```bash
docker compose up --build
```

This starts:

- `app` (Next.js)
- `worker` (BullMQ worker)
- `scheduler` (cron planner)
- `postgres`
- `redis`

## Railway Deployment

Recommended architecture: **3 Railway services + managed Postgres + managed Redis**.

1. Create Railway Postgres and Redis services.
2. Create service `autostreak-web` from this repo.
   - Build command: `npm install && npm run prisma:generate && npm run build`
   - Start command: `npm run start`
3. Create service `autostreak-worker` from same repo.
   - Start command: `npm run worker`
4. Create service `autostreak-cron` from same repo.
   - Start command: `npm run cron`
5. Add the same env vars to all app services (`DATABASE_URL`, `REDIS_URL`, auth/env keys).
6. Run Prisma migrations once (Railway shell or CI step):

```bash
npx prisma migrate deploy
```

## Render Deployment

Use separate web/background services:

- Web service: `npm run start`
- Background worker: `npm run worker`
- Background scheduler: `npm run cron`

Attach managed Postgres + Redis and set the same env vars.

## Fly.io Deployment

Deploy as multiple process groups:

- `web`: `npm run start`
- `worker`: `npm run worker`
- `cron`: `npm run cron`

Bind to Fly Postgres/Redis (or external managed services).

## API Endpoints

- `POST /api/auth/register`
- `GET /api/repos`
- `POST /api/repos`
- `PATCH /api/repos/:id`
- `DELETE /api/repos/:id`
- `POST /api/repos/:id/toggle`
- `POST /api/repos/:id/run`
- `GET /api/activity?limit=50`
- `POST /api/scheduler/sync` (`x-cron-secret` if configured)
- `GET /api/health`

## Template Tokens

Supported in commit message/file content templates:

- `{{date}}`
- `{{time}}`
- `{{isoTimestamp}}`
- `{{quote}}`
- `{{repo}}`
- `{{owner}}`
- `{{random}}`

## Folder Structure

```text
app/
  (auth)/sign-in/
  (dashboard)/
  api/
components/
  auth/
  dashboard/
  ui/
lib/
  scheduler/
prisma/
scripts/
types/
```

## Notes

- This app stores PATs encrypted, but PAT handling remains sensitive. Use least-privilege tokens and rotate periodically.
- If branch protections block direct pushes, configure repo rules accordingly or use dedicated automation branches.
