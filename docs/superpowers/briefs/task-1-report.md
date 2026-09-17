# Task 1 Report — Fork Plane and trim unused apps

Branch: `plan-01-foundation` (base `768a054`) → commit `7eb2d9b`.
Work dir: `D:\Project\Web Project\Enuma\StackGate`.

## What was implemented

Forked upstream Plane (`https://github.com/makeplane/plane.git`, branch `preview`, depth 1) into StackGate, keeping only what Plan 01 needs:

- Copied: `apps/web`, `apps/live`, `packages`, `patches`, plus root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.npmrc`, `.node-version`, `.oxlintrc.json`, `.oxfmtrc.json`, `.prettierignore`, `.gitignore`, `.husky`, `LICENSE.txt`, `setup.sh`.
- Never copied any `.git` directory; never copied upstream `AGENTS.md` (ours at root untouched).
- Temp clone dir removed afterwards.
- `pnpm-workspace.yaml`: deleted exactly `- "!apps/api"` and `- "!apps/proxy"`; `packages:` block now `apps/*` + `packages/*`.
- Regenerated lockfile (`pnpm install --no-frozen-lockfile`), exit 0.
- Prerequisite not spelled out in the brief but required by upstream's own pipeline: built workspace packages (`turbo run build --filter=./packages/*`, 12 packages, all successful) because `turbo.json` declares `check:types` with `dependsOn: ["^build"]` and every `@plane/*` package resolves its types from `dist/` (absent on a fresh checkout). `dist/`/`build/` are gitignored, so the commit is unaffected.
- Committed with the exact brief message: `feat: fork plane web+live+packages, trim admin/space/django/proxy`.

## Verification commands and actual outputs

| # | Command | Expected | Actual |
|---|---------|----------|--------|
| 1 | `Test-Path "$env:TEMP\plane-upstream\apps\web\package.json"` (after clone) | `True` | `True` |
| 2 | `Get-ChildItem "…\StackGate\apps"` (after copy) | `live` + `web` only | `live`, `web` only |
| 3a | `Test-Path "…\StackGate\apps\web\.git"` | `False` | `False` |
| 3b | `Test-Path "$env:TEMP\plane-upstream"` (after removal) | `False` (gone) | `False` |
| 4 | First 3 lines of `pnpm-workspace.yaml` | `packages:` / `- apps/*` / `- packages/*` | Exact match |
| 5 | `pnpm install --no-frozen-lockfile` | exit 0 | exit 0 (deprecation/peer warnings only) |
| 6a | `pnpm --filter web check:types` (before package build) | exit 0 | **FAILED** (exit 2, hundreds of `TS2307: Cannot find module '@plane/…'` — `dist/` not built; see note above) |
| 6b | `turbo run build --filter=./packages/*` | n/a (added prerequisite) | 12/12 builds successful, ~50s |
| 6c | `pnpm --filter web check:types` (after build) | exit 0, no TS errors | **EXIT_CODE=0**, no TypeScript errors |
| 7 | Forbidden-path check: `apps/admin`, `apps/space`, `apps/api`, `apps/proxy`, `deployments` | must not exist | All `False` (absent) |
| 8 | Secret scan of staged files (`.env`, keys, pem, credentials) | clean | Clean — only `apps/live/.env.example` + `apps/web/.env.example` (upstream templates, committable per plan) |

## Files changed (commit `7eb2d9b`, 4130 files, +430577)

- `apps/` — 2396 files (`web` + `live` only)
- `packages/` — 1721 files (all 15 upstream packages incl. `editor`, `propel`, `ui`, `services`, `types`, `utils`, `i18n`, …)
- `patches/react-color@2.19.3.patch` — 1
- Root: `package.json`, `pnpm-workspace.yaml` (2 exclusion lines removed), `pnpm-lock.yaml` (regenerated), `turbo.json`, `.npmrc`, `.node-version`, `.oxlintrc.json`, `.oxfmtrc.json`, `.prettierignore`, `.gitignore`, `LICENSE.txt` (AGPL-3.0 kept), `setup.sh`
- `.husky`: `git add .husky` added nothing — the dir contains only `_/` (husky runtime, self-ignored via `.husky/_/.gitignore`); upstream tracks no hook files at this revision. Exact brief `git add` command used verbatim, exit 0.
- Untracked leftovers (intentionally not committed): `AGENTS.md`, `docs/superpowers/briefs/`, `docs/superpowers/plans/` (pre-existing scaffolding).

## Self-review findings

- Completeness: all 7 brief steps done; every verification in the brief run with expected output achieved (6c after the documented build prerequisite).
- Quality: no file content modified except the 2-line `pnpm-workspace.yaml` deletion; fork is 1:1 upstream.
- Discipline: stayed on `plan-01-foundation`; `master` untouched; no secrets committed; `LICENSE.txt` kept; nothing outside Task 1 implemented.
- No deviations from the brief's commands, paths, or commit message.

## Issues / concerns

1. **Brief gap (handled, no outcome change):** `pnpm --filter web check:types` cannot pass on a fresh checkout without building `@plane/*` packages first — upstream `turbo.json` itself declares `check:types dependsOn ^build`. Resolved via `turbo run build --filter=./packages/*`; recommend a one-line note added to the Task 1 brief for future replays.
2. **Toolchain drift (pre-existing, not blocking):** local `node v22.15.0` < required `>=22.22.0`, and shell `pnpm` is 10.30.1 vs pinned `11.10.0` (corepack auto-switched to 11.10.0 during `check:types`, per its log line). Consider aligning local node/pnpm with `.node-version` / `packageManager` before later tasks.
3. `check:types` prints benign warnings (react-router node-version notice, vite-tsconfig-paths suggestion, tailwind-config CJS/ESM notice) — no errors.
