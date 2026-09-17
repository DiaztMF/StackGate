# Task 3 Report — Drizzle schema, Neon wiring, and state seed

Branch: `plan-01-foundation` · Commit: `20abc6a feat(api): drizzle schema, neon client, state seed` (base `23335f1`)
DB: Neon project `StackGate`, branch `main` — used only via `apps/api/.env` (`DATABASE_URL` / `TEST_DATABASE_URL`, same branch). Connection string never printed, copied, or committed.

## What was implemented

- `apps/api/tests/db.test.ts` — db roundtrip test, byte-exact per brief (created first, TDD RED first).
- `apps/api/src/db/schema.ts` — 12 tables byte-exact per brief: `users`, `workspaces`, `workspace_members`, `projects`, `project_members`, `states`, `tickets`, `ticket_transitions`, `gate_check_items`, `research_links`, `comments`, `refresh_tokens` (+ `role` enum).
- `apps/api/src/db/client.ts` — `pg` Pool (max 5) + `attachDatabasePool` + drizzle client, exporting `db`/`pool`, byte-exact per brief.
- `apps/api/drizzle.config.ts` — drizzle-kit config, byte-exact per brief.
- `apps/api/package.json` — scripts extended to exactly the brief's 8-entry set (`db:generate`, `db:migrate`, `db:seed` added).
- `apps/api/drizzle/0000_medical_siren.sql` (+ `meta/`) — generated migration creating all 12 tables (verified: 12 `CREATE TABLE` statements).
- `apps/api/src/db/seed.ts` — guarded (`ALLOW_DEV_SEED=1`) dev seed, byte-exact per brief; ran once against the Neon branch DB only.

## TDD RED evidence

Command: `pnpm --filter stackgate-api test tests/db.test.ts` (with `TEST_DATABASE_URL` loaded from `apps/api/.env` into process env, value redacted here)

```text
 FAIL  tests/db.test.ts > db roundtrip > inserts and deletes a state row
Error: Failed query: insert into "states" (...) values (default, $1, $2, $3, $4) returning "id"
Caused by: error: relation "states" does not exist
 Serialized Error: { severity: 'ERROR', code: '42P01', ... routine: 'parserOpenTable' }
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

## Migration and seed outputs (result lines only)

`pnpm --filter stackgate-api db:generate`:

```text
12 tables
comments 5 columns 0 indexes 2 fks
gate_check_items 5 columns 0 indexes 2 fks
project_members 4 columns 0 indexes 2 fks
projects 5 columns 0 indexes 1 fks
refresh_tokens 5 columns 0 indexes 1 fks
research_links 6 columns 0 indexes 2 fks
states 5 columns 0 indexes 1 fks
ticket_transitions 6 columns 0 indexes 4 fks
tickets 9 columns 0 indexes 4 fks
users 6 columns 0 indexes 0 fks
workspace_members 4 columns 0 indexes 2 fks
workspaces 3 columns 0 indexes 0 fks
[✓] Your SQL migration file ➜ drizzle\0000_medical_siren.sql 🚀
```

`pnpm --filter stackgate-api db:migrate` (with `DATABASE_URL` from `apps/api/.env`):

```text
[✓] migrations applied successfully!
```

`pnpm --filter stackgate-api db:seed` (with `ALLOW_DEV_SEED=1`):

```text
seeded project 223e75bb-70a1-4f98-a1ae-e89331452f22
```

## GREEN evidence + full suite + types

Mid-step GREEN anomaly (see Concerns): first post-migration run failed with FK `23503` instead of passing; after inserting the fixture parent row (see below), re-run passed.

Command: `pnpm --filter stackgate-api test tests/db.test.ts` (with `TEST_DATABASE_URL` = branch URL):

```text
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Command: `pnpm --filter stackgate-api check:types` → exit 0 (only the pnpm engine advisory line, no tsc errors).

Command: `pnpm --filter stackgate-api test` (full api suite, both DB URLs loaded from `apps/api/.env`):

```text
 Test Files  2 passed (2)
      Tests  3 passed (3)
```

## Files changed (commit 20abc6a)

- `apps/api/drizzle.config.ts` (new)
- `apps/api/drizzle/0000_medical_siren.sql` (new)
- `apps/api/drizzle/meta/0000_snapshot.json` (new)
- `apps/api/drizzle/meta/_journal.json` (new)
- `apps/api/package.json` (scripts only)
- `apps/api/src/db/client.ts` (new)
- `apps/api/src/db/schema.ts` (new)
- `apps/api/src/db/seed.ts` (new)
- `apps/api/tests/db.test.ts` (new)

## Self-review findings

- `git diff --cached --stat` before commit listed exactly the 9 files above; `git status` shows only pre-existing untracked items (`AGENTS.md`, `docs/superpowers/...`) untouched.
- Secret scan of staged diff for `postgresql://`, `neon.tech`, and `DATABASE_URL = "..."` patterns: no hits. `apps/api/.env` not staged/committed (git-ignored, `git check-ignore` confirms). No credential appears in this report.
- Temp helper `apps/api/fixture-probe.mjs` (fixture insert, see Concerns) was deleted before staging; verified absent via `git status`.
- Exported contracts intact for Tasks 4–5: `db` from `src/db/client.ts`; all 12 table definitions with exact names from `src/db/schema.ts`. Stayed on `plan-01-foundation`; `master` untouched.

## Issues / concerns

1. **Brief bug — exact test cannot pass on the exact schema without a fixture row (worked around, needs owner decision).** After migration, the byte-exact test failed with `error: insert or update on table "states" violates foreign key constraint "states_project_id_projects_id_fk"` (code `23503`, `Key (project_id)=(00000000-0000-0000-0000-000000000000) is not present in table "projects"`), because the schema declares `states.projectId → projects.id` but the test inserts a zero UUID with no matching project, and the seed creates no such project. Since both files are pinned byte-exact, I changed data, not code: inserted one parent row (`projects.id = 00000000-0000-0000-0000-000000000000`, name `Probe Fixture`, slug `probe-fixture`) under the oldest existing `workspaces` row via a temp script (deleted afterwards). The suite is green with that row present. **Follow-up for Tasks 4–5:** either keep the fixture row or, preferably, amend the test to create its own parent project (requires a brief amendment, since the test is currently pinned exact). The fixture row is ordinary dev data on the Neon branch, not production.
2. **`check:lint` is red on the mandated seed file (not a required gate, reported only).** `pnpm --filter stackgate-api check:lint` reports 4 warnings → exit 1 (max-warnings=0): 1× `no-named-as-default-member` on `bcrypt.hash` and 3× `no-await-in-loop` in `seed.ts`. File left byte-exact per brief. If lint must be green later, it needs either a lint-config tweak or a brief amendment to `seed.ts`.
3. **Seed is not idempotent** — re-running `db:seed` will fail on unique `users.email`. Ran exactly once; do not re-run without wiping dev rows.
4. **Node version advisory (non-blocking).** Local node is v22.15.0 (< required >=22.22.0); pnpm prints an `Unsupported engine` warning on every command but all tools (vitest, tsc, drizzle-kit, tsx/seed) ran successfully, so no escalation was needed.

---

## Fix pass — Amendment v2 findings (commit d490026)

Branch: `plan-01-foundation` · Commit: `d490026 fix(api): self-contained db test, lint-clean seed` (parent `20abc6a`).
Source: `docs/superpowers/briefs/task-3-brief.md`, "Amendment v2" section — applied all three items exactly.

### Fixes applied

1. **`apps/api/tests/db.test.ts` replaced with the self-contained version.** Creates its own `workspaces` → `projects` → `states` chain and cleans up in reverse order; no longer depends on the zero-UUID fixture row. Proves fresh-DB correctness: passed after the fixture row was deleted.
2. **`apps/api/src/db/seed.ts` replaced with the lint-clean version.** `import { hash } from "bcryptjs"` (was default import) and `Promise.all` instead of awaited loops. Behavior identical; no seed re-run needed (seed is not idempotent — ran once in the base commit).
3. **Manual fixture row removed.** Created temp script `apps/api/fixture-cleanup.mjs` per brief, ran `pnpm exec tsx fixture-cleanup.mjs` → output `fixture removed`, then deleted the file. `git status --porcelain` confirms no trace of it.

### Covering test commands with outputs

`pnpm test tests/db.test.ts` (from `apps/api`, env via `apps/api/.env`):

```text
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

`pnpm test` (full api suite):

```text
 Test Files  2 passed (2)
      Tests  3 passed (3)
```

`pnpm check:types` → exit 0 (tsc, no errors).

`pnpm check:lint`:

```text
Found 0 warnings and 0 errors.
```

### Commit created

- Staged exactly: `git add apps/api/tests/db.test.ts apps/api/src/db/seed.ts` — verified via `git status --porcelain` that no secret, no `.env`, and no temp script was staged (`.env` git-ignored; `fixture-cleanup.mjs` deleted before staging).
- Commit: `d490026 fix(api): self-contained db test, lint-clean seed`.
