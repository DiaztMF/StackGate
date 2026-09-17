# Task 2 Brief — Scaffold the Hono API with health endpoint and tests (AMENDED v2)

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 2.
Branch: `plan-01-foundation`. Work from `D:\Project\Web Project\Enuma\StackGate`.
State: a previous attempt created the Task 2 files uncommitted and proved RED (missing `../src/app`) plus GREEN (2/2 tests pass), but `check:types` failed with TS2835 and `check:lint` failed on the dotenv side-effect import. This amendment fixes exactly those two defects. Continue from the existing working tree — do not recreate files that already match.

## Amendment rulings (brief-owner calls, follow them exactly)

1. All relative TypeScript imports in `apps/api` must use explicit `.js` extensions (required by `moduleResolution: NodeNext`). Vitest tolerates extensionless imports, `tsc --noEmit` does not.
2. Load env with `import { config } from "dotenv"; config();` — never bare `import "dotenv/config"`, which trips `oxlint --max-warnings=0`.
3. The task commit must include the regenerated root lockfile: `git add apps/api pnpm-lock.yaml`.

## Requirements

Create `apps/api/package.json` exactly:

```json
{
  "name": "stackgate-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc --noEmit",
    "check:types": "tsc --noEmit",
    "check:lint": "oxlint --max-warnings=0 src tests",
    "test": "vitest run"
  },
  "dependencies": {
    "@vercel/functions": "^2.2.2",
    "bcryptjs": "^3.0.2",
    "drizzle-orm": "^0.44.0",
    "hono": "^4.7.0",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "@hono/node-server": "^1.13.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "22.12.0",
    "@types/pg": "^8.11.0",
    "dotenv": "16.4.7",
    "drizzle-kit": "^0.31.0",
    "oxlint": "1.51.0",
    "tsx": "4.20.6",
    "typescript": "5.8.3",
    "vitest": "^4.1.8"
  }
}
```

Create `apps/api/tsconfig.json` exactly:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "api/**/*.ts", "tests/**/*.ts"]
}
```

Create `apps/api/.env.example` exactly:

```text
DATABASE_URL="postgresql://user:password@host:5432/stackgate"
JWT_SECRET="change-me-32-chars-minimum"
PORT="8000"
```

`apps/api/tests/health.test.ts` must import `../src/app.js` (with extension):

```typescript
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await createApp().request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true } });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await createApp().request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Not found" } });
  });
});
```

`apps/api/src/server.ts` must be exactly:

```typescript
import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

config();

const port = Number(process.env.PORT ?? 8000);
serve({ fetch: createApp().fetch, port });
console.log(`stackgate-api listening on ${port}`);
```

`apps/api/api/index.ts` must be exactly:

```typescript
import { handle } from "hono/vercel";
import { createApp } from "../src/app.js";

export default handle(createApp());
```

`apps/api/src/app.ts` and `apps/api/vercel.json` are unchanged from the previous attempt (verify they match the plan if present, create if missing).

Gates, in order: `pnpm --filter stackgate-api test` → `Test Files 1 passed (1)`, `Tests 2 passed (2)`; `pnpm --filter stackgate-api check:types` → exit 0; `pnpm --filter stackgate-api check:lint` → exit 0. Commit exactly: `git add apps/api pnpm-lock.yaml` then `git commit -m "feat(api): hono scaffold with health endpoint and tests"`.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets (no `.env`, only `.env.example`).
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- Exported contract that later tasks rely on: `createApp()` from `apps/api/src/app.ts`.
- Environment note: local node is v22.15.0 (below the required >=22.22.0); corepack provides pnpm 11.10.0. If a tool refuses to run on this node version, escalate instead of downgrading dependency versions.
