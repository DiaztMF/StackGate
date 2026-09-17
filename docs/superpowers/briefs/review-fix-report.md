# Review-Fix Report — Plan 01 final-review findings (F1–F7)

Branch: `plan-01-foundation`. Commit: `c18b0cf` — "fix(review): cors, cookie, guard matrix, interceptor, regression tests".
Brief followed verbatim in F1→F7 order. `.env` used via env file only, never printed or committed.

## Fixes applied (file:line evidence, post-commit worktree)

- F1 CORS (Critical): `apps/api/src/app.ts:2` (`import { cors } from "hono/cors"`), `:9-12` (origins from `WEB_ORIGIN`), `:13-22` (`app.use("*", cors({origin: origins, allowMethods, allowHeaders, credentials: true, maxAge: 600}))` — allowHeaders `Content-Type, Authorization`). `apps/api/.env.example:4-5` appends `WEB_ORIGIN="http://localhost:3000"` + `COOKIE_CROSS_SITE="0"`. No new dependency (hono/cors ships in hono); no lockfile change.
- F2 cookie (Critical): `apps/api/src/auth/routes.ts:14-23` `refreshCookieOptions()` (`httpOnly, path "/api/auth", maxAge REFRESH_DAYS*86400, sameSite None/Lax via COOKIE_CROSS_SITE, secure crossSite?true:false`). Both setCookie calls replaced (`:47` login, `:77` refresh). deleteCookie (`:86`) uses `{ path, sameSite, secure }` from `refreshCookieOptions()` — typecheck passed, no path-only fallback needed.
- F3 atomic refresh (Important): `apps/api/src/auth/routes.ts:3` adds `gt` to drizzle-orm import; `:51-78` fail-closed atomic revoke (`update … set revokedAt … where and(eq(tokenHash), isNull(revokedAt), gt(expiresAt, now))) .returning()`, 401 `UNAUTHORIZED` when no row, then user lookup, sign, insert next token, set cookie).
- F4 JSON validation (Important): shared helper `apps/api/src/http.ts:3` `readJson<T>` + `:11` `invalidJson` (400 `VALIDATION_ERROR` "Body JSON tidak valid"). All `c.req.json` sites now via `readJson` (grep: only `http.ts:5` remains). Applied: login (`auth/routes.ts:30-35`, empty email/password → 400 "Email dan password wajib diisi"); transition (`tickets/routes.ts:53-58`, empty `to_state` → 400); gate-check create (`:101-106`, empty label → 400 "Label wajib diisi"); research-link create (`:78-83`, existing url/label check kept); comment create (`:118-123`, existing check kept); ticket create (`:18-23`, existing title check kept).
- F5 guard matrix (Important): `apps/api/src/tickets/guard.ts:9-14` signature gains `note?`; `:21` `fromKey`; `:23-40` ready block unchanged (lead-only, GATE_INCOMPLETE, RESEARCH_LINK_REQUIRED); `:42-50` backlog-return (non-student + note required); `:52-60` review→in-development lead-reject + note; `:62-70` backlog→in-development (assignee required, student must be assignee); `:72-86` in-development→review (assignee check, description required, research links); `:88` default 403 "Transisi ini tidak diizinkan". Routes: `tickets/routes.ts:55-59` parses `{to_state, note}`, requires `to_state`, passes `note`; `:61-67` refetch null-check (404) + `db.transaction` for update + `ticketTransitions` insert; `:24-25` project-existence 404 "Proyek tidak ditemukan" (fixes FK-500).
- F6 regression tests (Important): `apps/api/tests/guard.test.ts` DB-backed, self-contained (`probe-<Date.now()>-<seq>` slugs/emails), reverse-order cleanup in `afterEach`, `Promise.all` for parallel inserts (no await-in-loop). `JWT_SECRET` test dummy at top. 5 cases: `:138` student backlog→indev 200; `:144` student →ready 403 FORBIDDEN_TRANSITION; `:152` lead →ready unchecked item 422 GATE_INCOMPLETE; `:161` researchRequired indev→review 422 RESEARCH_LINK_REQUIRED; `:171` lead reject without note 422 / with note 200. Real HTTP via `createApp().request` + Bearer login tokens. Lint-clean.
- F7 interceptor (Important): `packages/services/src/stackgate/client.ts:22` module-level `refreshPromise`; `:24-27` `isAuthUrl` (login/refresh skip); `:29-36` `fetchFreshToken`, `:38-46` `clearWhenDone`, `:48-54` `startRefresh` single-flight; `:71-80` skip-refresh for auth URLs, try/catch → `setAccessToken(null)` + `toUserMessage("UNAUTHORIZED")`; `:82-84` server-message preference (`serverMessage ?? code→toUserMessage`). Keeps `create({...})` (`:61`), `process.env` sourcing, zero new warnings.

## Deviations from the brief

1. Staged `apps/api/.gitignore` (pre-existing untracked file, content `.vercel`) was pulled in by the verbatim `git add apps/api packages/services`. I initially unstaged it to keep the commit scoped, then re-staged to follow the brief's exact add command — so commit `c18b0cf` contains 9 files including `.gitignore`. Reason: obey the implementer contract verbatim. No secrets in it.
2. CORS smoke ran on port 8123 (`PORT=8123 WEB_ORIGIN=http://localhost:3000`) instead of 8000 because :8000 is occupied by an unrelated Laravel/php process (PID 10924, `D:\System\laragon\…\php.exe`, Symfony 404 body). Reason: environment conflict; health endpoint + CORS assertions are port-independent.
3. Interceptor single-flight cleanup uses a `void clearWhenDone(promise)` async helper instead of `.then().finally()` chaining, because oxlint `no-promise-in-callback` flagged the chained form (2 warnings). Reason: zero-new-warnings budget; behavior identical (shared promise, cleared when settled).

## Gate outputs

- `pnpm --filter stackgate-api test` → exit 0. `Test Files 5 passed (5)`, `Tests 11 passed (11)`, Duration ~12.6s (second run; first run 18.97s also 5/11 green). Engine warning only: `Unsupported engine: wanted {"node":">=22.22.0"} (current {"node":"v22.15.0"})`. pg SSL notice (verify-full alias) on stderr, non-blocking.
- `pnpm --filter stackgate-api check:types` → exit 0 (`tsc --noEmit`, clean apart from engine warning).
- `pnpm --filter stackgate-api check:lint` → exit 0: `Finished in ~151-180ms on 17 files with 93 rules` (includes new `src/http.ts` + `tests/guard.test.ts`; `--max-warnings=0` satisfied).
- `pnpm --filter @plane/services check:types` → exit 0 (clean apart from engine warning).
- `pnpm --filter @plane/services check:lint` → exactly 6 pre-existing warnings, zero new. Full list (`oxlint --format unix .`):
  - `src/auth/auth.service.ts:110:40` — `promise(always-return)`: Each then() should return a value or throw
  - `src/file/file-upload.service.ts:31:25` — `import(no-named-as-default-member)`: "axios" also has a named export "CancelToken"
  - `src/file/file-upload.service.ts:41:13` — `import(no-named-as-default-member)`: "axios" also has a named export "isCancel"
  - `src/indexedDB.service.ts:21:15`, `:52:19`, `:65:15` — `unicorn(prefer-add-event-listener)` ×3
  - `src/stackgate/client.ts` alone → 0 problems (verified via `oxlint --format unix src/stackgate/client.ts`, exit 0).
- `pnpm --filter web check:types` → exit 0 (`react-router typegen && tsc --noEmit`). Notes: `react-router requires Node > 22.22.0` (running 22.15.0, still exit 0), `vite-tsconfig-paths` deprecation notice, `tailwind-config/postcss.config.js` MODULE_TYPELESS_PACKAGE_JSON warning.
- CORS smoke (port 8123): `STATUS:200`, `ACAO:http://localhost:3000`, `VARY:Origin`, body `{"data":{"ok":true}}`. First attempt on :8000 hit the foreign Laravel listener (Symfony 404 `The route api/health could not be found`), confirming the port conflict, not an app failure.

## Commit + verification

- Staged exactly per contract (`git add apps/api packages/services`); secret scan on staged diff matched only `.env.example` placeholders (`user:password@host`, `change-me-…`) and the `guard.test.ts` dummy `test-secret-32-chars-minimum-xxxx` (as briefed). `git ls-files` shows no `.env` tracked; `apps/api/.env` is git-ignored (`check-ignore` → `.gitignore:56:.env`, exit 0).
- Commit: `c18b0cf` "fix(review): cors, cookie, guard matrix, interceptor, regression tests" on `plan-01-foundation` (parent `48a7063`). Stat: 9 files, +381/−54. Post-commit `git status --short` shows only pre-existing untracked `AGENTS.md` and `docs/superpowers/briefs/`.

## Self-review findings

- No deviations in guard logic vs brief matrix; `ready` block byte-equivalent in behavior; default-deny tail present.
- Refresh handler is fail-closed: replayed/expired token revokes nothing and returns 401; double-use of the same token fails the second time (row already revoked).
- Transaction in transition handler covers update + history insert; refetch null-check returns 404 before writing.
- `deleteCookie` with `sameSite`/`secure` passed `tsc --noEmit` — no fallback needed.
- Test cleanup order (gate items → links → comments → transitions → tickets → states → projects → users → workspaces) respects FK constraints; suite passed twice against live Neon branch DB.
- Untracked `AGENTS.md` and `docs/superpowers/briefs/` left untouched (out of commit scope).
