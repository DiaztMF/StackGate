# Task 5 Report — Ticket lifecycle with transition guards

Branch: `plan-01-foundation` (base `d0c0124`) · Workdir: `D:\Project\Web Project\Enuma\StackGate`
Commit: `ca2a1a4 feat(api): ticket lifecycle with transition guards`
Skills used: test-driven-development (RED-first), nodejs-backend-patterns, verification-before-completion.

## What was implemented

Tickets domain on the Task 3 schema with Task 4 auth, per brief (PATCH /api/gate-checks/:id NOT built — deferred to Plan 02):

- `apps/api/src/tickets/guard.ts` — `checkTransition()` guard matrix: students may only move
  backlog→in-development→review; `ready` requires lead role + all gate items checked + research
  link when `researchRequired`; unknown ticket/state → 404/422 with documented codes
  (`FORBIDDEN_TRANSITION`, `GATE_INCOMPLETE`, `RESEARCH_LINK_REQUIRED`, `VALIDATION_ERROR`).
- `apps/api/src/tickets/routes.ts` — ticket CRUD (list per project, create in backlog + transition
  record), transition, research-links list/create, gate-checks list/create (non-student only),
  comments list/create; all `{ data: ... }` shapes as briefed.
- `apps/api/src/app.ts` — mounted `ticketsApi` at `/api`.
- `apps/api/tests/tickets.test.ts` — brief-exact no-token transition test.

## TDD evidence

RED — `pnpm --filter stackgate-api test tests/tickets.test.ts` (test file created first, no routes mounted):

```text
FAIL  tests/tickets.test.ts > transition guards (no token) > rejects transition without token
AssertionError: expected 404 to be 401 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Matches the brief's predicted failure verbatim (`expected 404 to be 401`).

GREEN (single file, after guard.ts + routes.ts + mount):

```text
Test Files  1 passed (1)
      Tests  1 passed (1)
```

## Full gates (fresh runs, exit codes verified via $LASTEXITCODE)

`pnpm --filter stackgate-api test` → TEST_EXIT:0

```text
Test Files  4 passed (4)
      Tests  6 passed (6)
```

`pnpm --filter stackgate-api check:types` → TYPES_EXIT:0 (no tsc errors; direct
`tsc --noEmit` in `apps/api` also prints nothing).

`pnpm --filter stackgate-api check:lint` → LINT_EXIT:0

```text
Found 0 warnings and 0 errors.
Finished in 191ms on 15 files with 93 rules using 12 threads.
```

Note: the suite hits the Neon test DB (pre-existing pg `sslmode` warnings in the log only).

## Deviations from brief-exact code (3, all minimal + behavior-preserving)

1. `routes.ts`: replaced `ticketsApi.use("*", authMiddleware)` with per-route `authMiddleware`
   on all 10 routes (Task 4 convention, `src/auth/routes.ts:68`). The blanket `use("*")`
   mounted at `/api` intercepted unmatched paths, breaking the pre-existing health test:
   `GET /api/nope` returned 401 instead of 404 (`health.test.ts:13`). All ticket endpoints
   keep identical auth behavior; unknown routes 404 again. Full suite caught it, now green.
2. `routes.ts`: `new Hono()` → `new Hono<{ Variables: { user: AuthUser } }>()` + type-only
   import (Task 4 convention, `src/auth/routes.ts:11`). Otherwise `c.get("user")` is
   `unknown` and `check:types` fails. No runtime change.
3. `guard.ts`: deleted the second `if (actor.role === "student")` block (brief lines 89-91).
   Unreachable dead code — the first student block always returns, so TS narrows role to
   `"lead" | "pm"` and `tsc` errors TS2367. Runtime behavior identical.

## Files changed (commit ca2a1a4, 4 files, +176)

- `apps/api/src/tickets/guard.ts` (new)
- `apps/api/src/tickets/routes.ts` (new)
- `apps/api/tests/tickets.test.ts` (new)
- `apps/api/src/app.ts` (+2 lines: import + `app.route("/api", ticketsApi)`)

Commit command used exactly as briefed (quoted paths):
`git add apps/api/src/tickets apps/api/src/app.ts apps/api/tests/tickets.test.ts`
+ `git commit -m "feat(api): ticket lifecycle with transition guards"`.

## Self-review findings

- `git status` after commit: only pre-existing untracked `AGENTS.md`, `docs/superpowers/briefs/`,
  `docs/superpowers/plans/` remain — none staged/committed. No `.env` touched or committed.
- Secret scan over the 4 changed files: only the word "token" in test descriptions
  ("rejects transition without token"); no credentials, no `DATABASE_URL`.
- Stayed on `plan-01-foundation`; `master` untouched.
- Exported contracts for Task 6 intact: list/detail/transition endpoints with `{ data: ... }`
  shapes and the documented error codes.

## Issues / concerns

- Environment note: local node v22.15.0 < required >=22.22.0 prints a pnpm engine warning
  but every tool (vitest, tsc, oxlint) ran to completion — no escalation needed.
- PowerShell 5.1 renders pnpm stderr (engine warning) as `NativeCommandError` text even on
  success; gates were verified via `$LASTEXITCODE` (0) plus output content, not the wrapper text.
- Pre-existing quirk (not mine, flagging only): `pg` prints `sslmode prefer/require treated as
  verify-full` warnings during tests; harmless, from the Neon connection string.
