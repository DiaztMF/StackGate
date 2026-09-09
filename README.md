# StackGate

Ticket-based project management for software houses that use intern developers. Frontend forked from Plane (`apps/web`, UI reused 1:1), backend replaced with a lightweight Hono API.

## Pages / Routes

| Route | Page | Description |
|---|---|---|
| `/` | Web app | Plane SPA: workspaces, projects, kanban boards, cycles, modules, pages |
| `/api/health` | API health | Returns `{"data":{"ok":true}}` |
| `/api/auth/*` | Auth | Login, refresh rotation, logout, me |
| `/api/projects/:id/tickets` | Tickets | List and create tickets per project |
| `/api/tickets/:id/transition` | Gate | State transitions with role enforcement |

## Project Structure

```text
src/  # (monorepo root, no src/ dir — layout below)
apps/
  web/        # Plane SPA fork (React Router, port 3000) — UI 1:1
  api/        # Hono replacement backend (port 8000, Vercel Functions)
    src/
      app.ts        # App wiring: CORS, routes, error shape
      auth/         # JWT access (15m) + refresh rotation (7d)
      tickets/      # CRUD + transition guard matrix
      db/           # Drizzle schema, Neon client, dev seed
    api/index.ts    # Vercel Node (req,res) handler entry
    tests/          # Vitest: health, auth, db, tickets, guards
  live/         # Hocuspocus/Yjs realtime server (Plan 03, Render)
packages/
  services/src/stackgate/  # FE adapter: client, auth, tickets
  ui|types|utils|...       # Shared Plane packages
docs/superpowers/
  specs/  # Design spec
  plans/  # Implementation plans
```

## Tech Stack

- **React Router 8 + React 19 + Vite 8** — SPA fork, static deploy
- **Hono 4** — API ringan, cold-start kecil di serverless
- **Drizzle + Neon Postgres** — schema 12 tabel, `pg` Pool + `attachDatabasePool`
- **Upstash Redis** — session/rate-limit (Plan 03 live)
- **Vitest** — guard matrix regression tests

## Scripts

| Script | Command | Description |
|---|---|---|
| Web dev | `pnpm --filter web dev` | React Router dev, port 3000 |
| API dev | `pnpm --filter stackgate-api dev` | Hono local, port 8000 |
| API tests | `pnpm --filter stackgate-api test` | Vitest suite |
| Typecheck | `pnpm --filter <pkg> check:types` | `tsc --noEmit` |
| Lint | `pnpm --filter <pkg> check:lint` | oxlint, zero-warning budget |
| Web build | `pnpm --filter web build` | Emits `build/client` |
| DB migrate | `pnpm --filter stackgate-api db:migrate` | drizzle-kit migrate |
| DB seed | `pnpm --filter stackgate-api db:seed` | Dev data (`ALLOW_DEV_SEED=1`) |

## Quick Start

```bash
npm install -g pnpm@11.10.0
pnpm install --no-frozen-lockfile
pnpm exec turbo run build --filter=./packages/*
```

Copy `apps/api/.env.example` to `apps/api/.env`, fill `DATABASE_URL` (Neon pooled) and `JWT_SECRET` (32+ chars), then:

```bash
pnpm --filter stackgate-api db:migrate
ALLOW_DEV_SEED=1 pnpm --filter stackgate-api db:seed
pnpm --filter stackgate-api dev
pnpm --filter web dev
```

Seed logins: `pm@local.dev`, `lead@local.dev`, `siswa@local.dev` (password `dev123456`).

## Ticket States

`Backlog` → `In Development` → `Quality Gate Review` → `Client Ready`. Students move forward to Review only; only leads close to Client Ready with a complete gate checklist. Research links marked required block entry to Review. Enforced server-side in `apps/api/src/tickets/guard.ts`.

## Deployment

- API: `https://stackgate-api.vercel.app` (Vercel Functions, Node runtime, manual `(req,res)` adapter in `apps/api/api/index.ts` + `vercel.json` rewrite)
- Web: `https://stackgate-web.vercel.app` (static `build/client`, baked `VITE_API_BASE_URL`)
- Required API env: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `COOKIE_CROSS_SITE=1` in production

## Contributing

See `AGENTS.md` for conventions, gates, and deployment rules.
