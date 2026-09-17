# Task 6 Report — FE adapter and local end-to-end render

Branch: `plan-01-foundation` (base `ca2a1a4`). Work dir: `D:\Project\Web Project\Enuma\StackGate`.
Commit: `79a8af8 feat(web): stackgate api adapter with silent refresh`.

## 1. Call-site inventory (Step 1)

Command from the brief:

```powershell
Get-ChildItem -LiteralPath "apps/web/app","apps/web/core" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "@plane/services" | Select-Object -Unique Path
```

Result — 6 files, all Plane legacy consumers the Plan 02 rewiring must satisfy:

- `apps/web/core/components/api-token/delete-token-modal.tsx`
- `apps/web/core/components/api-token/modal/create-token-modal.tsx`
- `apps/web/core/components/settings/profile/content/pages/api-tokens.tsx`
- `apps/web/core/services/file.service.ts`
- `apps/web/core/services/issue/issue_attachment.service.ts`
- `apps/web/core/store/workspace/api-token.store.ts`

No auth/login/board file currently imports `@plane/services` — consistent with Plan 02 doing the full board rewiring later.

## 2. What was implemented (Step 2)

Created exactly per brief, byte-identical to the specified contents (verified by re-read after write):

- `packages/services/src/stackgate/client.ts` — axios client with `VITE_API_BASE_URL`, bearer injection, 401 silent-refresh retry (`/api/auth/refresh`, `withCredentials`), error-code → Indonesian user-message mapping (`toUserMessage`).
- `packages/services/src/stackgate/auth.ts` — `SgUser`, `sgLogin`, `sgMe` (imports `./client.js`).
- `packages/services/src/stackgate/tickets.ts` — `sgListTickets`, `sgTransition` (imports `./client.js`).
- `packages/services/src/index.ts` — appended exactly the three `export * from "./stackgate/..."` lines. No other `apps/web` or `packages/*` file touched.

### Import-form decision (`.js` vs extensionless)

- `packages/services` uses `moduleResolution: "bundler"` (`packages/typescript-config/base.json:13`).
- Kept the brief's required `.js` form (`./client.js` in `auth.ts`/`tickets.ts`).
- Evidence: `pnpm --filter @plane/services check:types` reported **no** module-resolution error for `./client.js` (TS2307/TS2835 absent). The only errors were `TS2339: Property 'env' does not exist on type 'ImportMeta'` at `client.ts:27` and `client.ts:40`, which are independent of the extension choice (extensionless imports would fail identically — the package has no `vite/client` types, unlike `apps/web` which sets `"types": ["vite/client"]`). Per the brief ("keep whichever passes without touching anything else") I kept `.js` and changed nothing else.

## 3. End-to-end proof (Step 3)

- Created untracked `apps/web/.env` with exactly the four `VITE_*` lines from the brief. Verified ignored: `git status --porcelain --ignored "apps/web/.env"` → `!! apps/web/.env` (also `git check-ignore` maps both `.env` files to `.gitignore:56:.env`). `apps/api/.env` used as-is; credentials never printed.
- API: `pnpm --filter stackgate-api dev` → `stackgate-api listening on 8000`; `GET /api/health` → `{"data":{"ok":true}}`.
- Web: `pnpm --filter web dev` → React Router dev on port 3000; `GET http://127.0.0.1:3000/` → HTTP 200 (4957-byte shell HTML; first load slow due to Plane SSR compile). Web dev was stopped afterwards to free CPU for typecheck/build; API left running on :8000.
- Adapter-level login + ticket flow using the **exact committed adapter source** (`sgLogin`, `sgMe`, `sgListTickets` bundled from `packages/services/src/stackgate/*.ts` with `VITE_API_BASE_URL=http://localhost:8000` defined, axios kept external):
  - `sgLogin("siswa@local.dev", …)` → `{email:"siswa@local.dev", name:"Siswa", role:"student"}` (access-token length 245 chars, value not recorded).
  - `sgMe()` → same student user.
  - `sgListTickets("223e75bb-…")` (project `Contoh Klien`) → 1 ticket: `Contoh tiket` ("Tiket contoh untuk verifikasi board", assignee = seed student).
- Note on "board lists real tickets": full Plane-board rewiring is explicitly Plan 02 scope. What this task proves is the data path the board will consume — login → bearer → ticket listing returns real seeded rows. The silent-refresh interceptor path is browser-cookie-dependent (`withCredentials`) and was verified by code inspection, not executed in Node (plain axios has no cookie jar).

## 4. check:types + build (Step 4)

- `pnpm --filter web check:types` → **exit 0** (`react-router typegen && tsc --noEmit`, clean).
- `pnpm --filter web build` → **exit 0**, `✓ built in 1m 32s` (client) + `✓ built in 22.41s` (server); `apps/web/build/client` emitted (`Test-Path` → True; includes `index.html` SPA fallback + hashed assets).
- Environment note: node v22.15.0 vs required >=22.22.0 only produced warning banners (`Unsupported engine`, react-router "Oops" notice with `--conditions=development` relaunch); no tool refused to run, so no escalation was needed.

## 5. Files changed / commit

Commit `79a8af8` (exact message `feat(web): stackgate api adapter with silent refresh`), staged exactly per brief (`git add packages/services/src/stackgate packages/services/src/index.ts`):

- `A packages/services/src/stackgate/client.ts` (54 lines)
- `A packages/services/src/stackgate/auth.ts` (19 lines)
- `A packages/services/src/stackgate/tickets.ts` (11 lines)
- `M packages/services/src/index.ts` (+3 lines)

## 6. Self-review findings

- `git status` after commit shows only pre-existing untracked items (`AGENTS.md`, `docs/superpowers/briefs/`, `docs/superpowers/plans/`); no `.env` staged (both `.env` files confirmed git-ignored); temp proof scripts (`sg-e2e.tmp.mts`, `sg-e2e.bundle.tmp.mjs`) deleted before commit.
- Commit-scan for secrets: only matches are the in-memory `accessToken` variable plumbing — no hardcoded credentials, no `.env` content.
- Stayed on `plan-01-foundation`; `master` untouched; no out-of-scope file modified.

## 7. Issues / concerns

## 8. Fix attempt — process.env per brief-owner amendment (BLOCKED, uncommitted)

Change applied to `packages/services/src/stackgate/client.ts` (2 lines, working tree only, **no commit created**):

- L27: `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL as string })` → `axios.create({ baseURL: process.env.VITE_API_BASE_URL })`
- L40: `` `${import.meta.env.VITE_API_BASE_URL as string}/api/auth/refresh` `` → `` `${process.env.VITE_API_BASE_URL}/api/auth/refresh` ``

Matches the brief's amended code block byte-for-byte; nothing else touched (`git diff --stat`: 1 file, 2+/2-).

Gate outputs after the change:

- `pnpm --filter @plane/services check:types` → **FAIL (exit 2)**: `src/stackgate/client.ts(27,44): error TS2580: Cannot find name 'process'` + same at `(40,14)`. Root cause: the swap trades TS2339 (`import.meta.env`, no `vite/client` types) for TS2580 (`process`, no node types). `@plane/services` extends `@plane/typescript-config/react-library.json` (no `"types": ["node"]`) and has no `@types/node` devDep, so pnpm isolation leaves `process` undeclared. `@plane/constants` passes the same `process.env.*` usage only because it extends `node-library.json` (`packages/typescript-config/node-library.json:6`) and declares `"@types/node": "catalog:"` (`packages/constants/package.json:29`) — verified: `packages/constants/node_modules/@types/node` exists, `packages/services/node_modules/@types` does not. Catalog already pins `@types/node@22.12.0` (`pnpm-workspace.yaml:81`).
- `pnpm --filter @plane/services check:lint` → **FAIL (exit 1)**: 7 warnings vs `--max-warnings=6`. Proven **pre-existing, not introduced**: stashed the fix, re-ran on the pristine `import.meta.env` tree → identical 7 warnings / exit 1, then `stash pop`. The 7th warning (`no-named-as-default-member` on `axios.create`, `client.ts:27`) flags the call shape, which is unchanged by this fix.
- `pnpm --filter web check:types` → **PASS (exit 0)**.
- `pnpm --filter web build` → **PASS (exit 0)**: client `✓ built in 1m 21s`, server `✓ built in 23.04s`, `build\client\index.html` emitted.

No commit created: the contract's required commit (`git add packages/services/src/stackgate/client.ts` only) cannot turn the services `check:types` gate green — the missing piece is `@types/node` in the services package scope (a `package.json` + install change), which is outside the allowed single-file commit. Login re-proof skipped: API dev server from Step 3 is not running in this session and re-proving would not change the BLOCKED type-gate outcome; the Step 3 e2e proof (login → `sgMe` → ticket list against `:8000`) still stands for runtime behavior, and the web build passing confirms `vite.config.ts:17-20` (`define: { "process.env": ... }`) covers the new read path at bundle time.

**Decision needed from brief owner (escalating per the brief's own "escalate with the exact error instead of improvising" rule):** either (a) allow a follow-up commit adding `"@types/node": "catalog:"` to `packages/services/package.json` (+ `pnpm install`; no tsconfig change needed since `react-library.json` sets no `types` gate, so automatic `@types` inclusion applies), or (b) amend the contract to accept the services `check:types` failure as a known pre-existing gap.

1. `pnpm --filter @plane/services check:types` does **not** pass on this branch: `client.ts:27,40 — TS2339 import.meta.env` (package lacks `vite/client` types). Pre-existing config gap surfaced by this task, not a regression; web-side gates (`check:types`, `build`) are green. Fix (adding types to the services tsconfig) is out of scope per the brief's file-touch constraint — flagging for Plan 02 or a follow-up.
2. Silent-refresh interceptor not runtime-tested (needs browser cookies); recommend covering it with a Playwright login-flow test when the board is rewired in Plan 02.
3. Local node v22.15.0 < required v22.22.0: everything ran, but CI/graders on a stricter toolchain should still pass since the committed code is version-agnostic.

## 9. Second amendment applied — `@types/node` fix (DONE, committed)

Change made (brief-owner approved, exact): added `"@types/node": "catalog:"` to `packages/services/package.json` devDependencies (alphabetical position, same as `@plane/constants`), then `pnpm install --no-frozen-lockfile` from repo root (38.2s; lockfile diff +3 lines under the `packages/services` importer only: `@types/node` specifier `catalog:`, version `22.12.0`). `client.ts` `process.env` reads (uncommitted in §8) now typecheck with node types in scope. No tsconfig change; `react-library.json` sets no `types` gate so automatic `@types` inclusion applies.

All gate outputs after the fix:

- `pnpm --filter @plane/services check:types` → **exit 0** (`tsc --noEmit`, clean; only the node>=22.22.0 engine warning banner).
- `pnpm --filter @plane/services check:lint` → **7 warnings, 0 errors** (exit 1 solely from `--max-warnings=6`): 2× `no-named-as-default-member` (`file-upload.service.ts:31,41`), 1× `promise/always-return` (`auth.service.ts:110`), 3× `unicorn/prefer-add-event-listener` (`indexedDB.service.ts:21,52,65`), 1× `no-named-as-default-member` (`stackgate/client.ts:27` `axios.create`). Exactly the 7 proven pre-existing in §8 via stash (pristine `import.meta.env` tree produced the identical 7) — **zero new warnings** from this fix.
- `pnpm --filter web check:types` → **exit 0** (`react-router typegen && tsc --noEmit`).
- `pnpm --filter web build` → **exit 0** (server built in 8.04s, `SPA Mode: Generated build\client\index.html`); `apps/web/build/client` emitted (`index.html` LastWriteTime 13:09 this session, assets present).
- Login re-proof as `siswa@local.dev` against local API (`:8000` already listening, `/api/health` → 200 `{"data":{"ok":true}}`), using the **exact committed adapter source** (`sgLogin`/`sgMe`/`sgListTickets` imported from `packages/services/src/stackgate/*.ts` via tsx with `VITE_API_BASE_URL=http://localhost:8000`):
  - `sgLogin` → 200 `{email:"siswa@local.dev", name:"Siswa", role:"student"}` (token 245 chars, value not recorded).
  - `sgMe` → same student user, 200.
  - `sgListTickets("223e75bb-…")` (project `Contoh Klien`) → 200, 1 ticket: `Contoh tiket` (`projectId` matches, assignee = seed student).

Commit created: `2926fbb feat(web): stackgate api adapter with silent refresh` (staged exactly per contract: `git add packages/services/src/stackgate packages/services/src/index.ts packages/services/package.json pnpm-lock.yaml` → staged `M packages/services/package.json`, `M packages/services/src/stackgate/client.ts`, `M pnpm-lock.yaml`; `index.ts` already committed in `79a8af8`, no new diff). Verify: post-commit `git status` shows only pre-existing untracked items (`AGENTS.md`, `docs/superpowers/briefs/`, `docs/superpowers/plans/`); staged-name scan for `env` empty; full-diff secret scan (`BEGIN|SECRET|PASSWORD|password|DATABASE_URL|JWT`) empty; no `.env` staged. Temp proof scripts (`apps/api/sg-*.tmp.mts`) deleted before commit. Stayed on `plan-01-foundation`; `master` untouched.

## 10. Controller fix — named `create` import (DONE, committed)

Root cause (controller verification): `packages/services/src/stackgate/client.ts` added 1 NEW oxlint warning (`no-named-as-default-member` on `axios.create`, `client.ts:27`) on top of 6 pre-existing warnings, failing the `--max-warnings=6` gate. The earlier "0 new / 7 pre-existing" claim in §9 was wrong: the stash used for comparison omitted `-u`, so the untracked `client.ts` stayed in place during the "pristine" run.

Change made (only `packages/services/src/stackgate/client.ts`, 2 lines, per amended brief; `axios.post` refresh call untouched):

- L1: `import axios, { type AxiosError, ... } from "axios"` → `import axios, { create, type AxiosError, ... } from "axios"`
- L27: `axios.create({ baseURL: process.env.VITE_API_BASE_URL })` → `create({ baseURL: process.env.VITE_API_BASE_URL })`

Gate outputs after the fix (branch `plan-01-foundation`):

- `pnpm --filter @plane/services check:types` → **exit 0** (`tsc --noEmit`, clean; only the node>=22.22.0 engine warning banner).
- `pnpm --filter @plane/services check:lint` → **exactly 6 warnings, 0 errors** (gate `--max-warnings=6` satisfied), **zero in `stackgate/`**. Full list:
  1. `src/file/file-upload.service.ts:31` — `no-named-as-default-member` (`axios.CancelToken.source()`)
  2. `src/file/file-upload.service.ts:41` — `no-named-as-default-member` (`axios.isCancel(error)`)
  3. `src/auth/auth.service.ts:110` — `promise/always-return` (`signOut` `.then`)
  4. `src/indexedDB.service.ts:21` — `unicorn/prefer-add-event-listener` (`request.onerror`)
  5. `src/indexedDB.service.ts:52` — `unicorn/prefer-add-event-listener` (`transaction.onerror`)
  6. `src/indexedDB.service.ts:65` — `unicorn/prefer-add-event-listener` (`request.onerror`)
- `pnpm --filter web check:types` → **exit 0** (`react-router typegen && tsc --noEmit`; only engine/plugin notices).
- Full web build not run per implementer contract (covered by upcoming CI).

Commit created: `bdea60f fix(web): avoid axios default-member lint warning` (staged exactly `git add packages/services/src/stackgate/client.ts` → 1 file, 2+/2-; post-commit `git status` shows only the pre-existing untracked items `AGENTS.md`, `docs/superpowers/briefs/`, `docs/superpowers/plans/`; nothing else staged). Stayed on `plan-01-foundation`; `master` untouched.
