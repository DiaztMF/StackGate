# Task 4 Report — Auth endpoints with JWT rotation

Branch: `plan-01-foundation`. Commit: `d0c0124 feat(api): jwt auth with refresh rotation` (parent `d490026`).
Workdir: `D:\Project\Web Project\Enuma\StackGate`. Skill used: `test-driven-development` (RED first, then GREEN).

## What was implemented

- `apps/api/tests/auth.test.ts` — brief-exact: login 401 shape (`Email atau password salah`), `/me` without token 401.
- `apps/api/src/auth/password.ts` — bcrypt verify/hash. **Brief-owner deviation applied**: named imports
  `import { compare, hash } from "bcryptjs"` instead of default import (the `no-named-as-default-member`
  pattern flagged in Task 3). Plus one follow-on rename I made: `verifyPassword(password, hash)` →
  `verifyPassword(password, hashValue)` because oxlint `no-shadow` fires on the param shadowing the
  imported `hash` and `check:lint` runs with `--max-warnings=0`.
- `apps/api/src/auth/tokens.ts` — brief-exact except: explicit `"HS256"` passed to `sign`/`verify`.
  Required, not cosmetic: installed hono is **4.13.7** and its `verify(token, key, algOrOptions)` types
  *require* the 3rd arg (`TS2554`), and at runtime `verify` without alg throws `JwtAlgorithmRequired`
  (confirmed in `hono/dist/utils/jwt/jwt.js`), so the brief-exact 2-arg form fails `check:types` AND
  would 401 every `/me`/refresh call at runtime.
- `apps/api/src/auth/middleware.ts` — brief-exact except the middleware is typed
  `createMiddleware<{ Variables: { user: AuthUser } }>`. Required: importing `hono/jwt` anywhere in the
  compilation augments Hono's `ContextVariableMap` with `jwtPayload`, which narrows `c.get()`'s key
  union so `c.get("user")` in routes.ts fails with `TS2769` (`'"user"' is not assignable to 'never'`).
- `apps/api/src/auth/routes.ts` — brief-exact except `new Hono<{ Variables: { user: AuthUser } }>()`
  (+ `type AuthUser` import) for the same `c.get("user")` typing reason. All four routes
  (`POST /login`, `POST /refresh` with rotation, `POST /logout`, `GET /me`) per brief.
- `apps/api/src/app.ts` — added `import auth from "./auth/routes.js"` + `app.route("/api/auth", auth)` (2 lines).

Exported contracts for Tasks 5–6 intact: `authMiddleware` + `AuthUser` from `src/auth/middleware.ts`,
default `auth` router from `src/auth/routes.ts`.

## TDD evidence

RED — `tests/auth.test.ts` created first, routes not yet mounted (env loaded from `apps/api/.env` without echoing values):

```powershell
pnpm --filter stackgate-api test tests/auth.test.ts
```

```text
 ❯ tests/auth.test.ts (2 tests | 2 failed) 115ms
 FAIL  tests/auth.test.ts > auth > rejects wrong credentials with 401
 AssertionError: expected 404 to be 401 // Object.is equality
 FAIL  tests/auth.test.ts > auth > rejects /api/auth/me without a token
 AssertionError: expected 404 to be 401 // Object.is equality
 Test Files  1 failed (1)
      Tests  2 failed (2)
```

Both failed with **404** (no `/api/auth` routes) — the expected RED for the right reason (missing feature, not typos).

GREEN — after creating `src/auth/*` + mounting the router:

```powershell
pnpm --filter stackgate-api test tests/auth.test.ts
```

```text
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

## Gates (final file state)

```powershell
pnpm --filter stackgate-api test
```

```text
 Test Files  3 passed (3)
      Tests  5 passed (5)
```

(health 2 + db roundtrip 1 + auth 2.)

```powershell
pnpm --filter stackgate-api check:types   # tsc --noEmit → exit 0, no errors
pnpm --filter stackgate-api check:lint    # oxlint --max-warnings=0 → "Found 0 warnings and 0 errors", 12 files
```

Intermediate failures on the way to green (both fixed, see deviations above):
1. `src/auth/tokens.ts(22,17): error TS2554: Expected 3 arguments, but got 2` (verify needs alg) and
   `src/auth/routes.ts(69,22): error TS2769` + `(70,66): 'user' is of type 'unknown'` (`c.get("user")` typing).
2. `eslint(no-shadow): 'hash' is already declared in the upper scope` in `password.ts` → param renamed.

## Happy-path smoke test (extra, throwaway script, deleted afterwards)

Exercised the real dev DB with seed user `pm@local.dev` / `dev123456` (login → me → me-bad-token →
refresh → reuse-old-refresh → logout → refresh-after-logout):

```text
login -> 200 (user pm@local.dev, role pm, token 235 chars); login set-cookie present: true
me -> 200
me-bad-token -> 401 {"error":{"code":"UNAUTHORIZED","message":"Token tidak valid"}}
refresh -> 200 (rotated: true); refresh rotated cookie: true
refresh-old-rejected -> 401 {"error":{"code":"UNAUTHORIZED","message":"Refresh token tidak valid"}}
logout -> 200 {"data":{"ok":true}}
refresh-after-logout -> 401 {"error":{"code":"UNAUTHORIZED","message":"Refresh token tidak valid"}}
```

Rotation + revocation semantics confirmed end to end. Smoke script lived at `apps/api/task4-smoke.mts`
temporarily and was deleted; nothing extra remains in the tree.

## Files changed (commit d0c0124, 6 files, +164)

- `apps/api/src/app.ts` (+2)
- `apps/api/src/auth/middleware.ts` (new, 23 lines)
- `apps/api/src/auth/password.ts` (new, 9 lines)
- `apps/api/src/auth/routes.ts` (new, 75 lines)
- `apps/api/src/auth/tokens.ts` (new, 33 lines)
- `apps/api/tests/auth.test.ts` (new, 22 lines)

Commit command used (exact per brief):
`git add apps/api/src/auth apps/api/src/app.ts apps/api/tests/auth.test.ts` →
`git commit -m "feat(api): jwt auth with refresh rotation"` → `d0c0124`.

## Self-review

- `git show --stat HEAD`: only the 6 intended files. `git status`: clean except pre-existing untracked
  `AGENTS.md`, `docs/superpowers/briefs/`, `docs/superpowers/plans/` (present before I started; not staged, not committed).
- No secrets committed: `.env` untouched/untracked; `git diff HEAD --stat` empty after commit.
- **Incident to disclose**: one early inspection command (`Get-Content apps\api\.env | Select -First 2`)
  echoed the DATABASE_URL/TEST_DATABASE_URL values into this session's tool log. They were not written to
  any file, not committed, and not repeated afterwards (all later runs loaded env silently), but the
  credential text exists in the transcript. Creds are dev-only (Neon branch) and the seed password is
  `dev123456` per the brief; consider rotating the Neon branch password if transcript retention is a concern.
- Deviations from "byte-exact" are all documented above with gate-level justification; behavior matches the
  brief (same routes, messages, cookie name `sg_refresh`, 7-day rotation).
- Environment note: local node is v22.15.0 (< required >=22.22.0). pnpm printed only an
  `Unsupported engine` warning; vitest/tsc/oxlint/tsx all ran — no escalation needed.

## Concerns for the controller / Tasks 5–6

1. Plan file still shows the old `password.ts` (default import, `hash` param) and 2-arg `sign`/`verify` —
   needs the controller amendment the brief mentions, otherwise Task 5+ copy-paste will re-break
   `check:types`/`check:lint` on hono 4.13.7.
2. `apps/api/.env` has no `JWT_SECRET`; tests set their own. If runtime (dev server / Vercel) needs auth,
   `JWT_SECRET` (≥32 chars) must be provisioned there — out of scope for this task, flagging only.
