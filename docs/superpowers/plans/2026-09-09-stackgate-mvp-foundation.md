# StackGate MVP Plan 01 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork Plane, trim unused apps, and ship a working slice: Hono API (auth + tickets + transition guards) on Neon, FE adapter rendering the real board, both deployed.

**Architecture:** Single monorepo `StackGate`. `apps/web` + `packages/*` reused 1:1 from Plane with a new `packages/services/src/stackgate` adapter. New `apps/api` Hono app (Node runtime locally and on Vercel Functions) with Drizzle over Neon Postgres. `apps/live` kept untouched for Plan 03.

**Tech Stack:** Node >=22.22.0, pnpm 11.10.0, Hono 4, Drizzle ORM + drizzle-kit, `pg` Pool, `@vercel/functions` (`attachDatabasePool`), `bcryptjs`, `hono/jwt`, Vitest, Vercel (static + functions), Neon Postgres.

## Global Constraints

- Node `>=22.22.0`, pnpm `11.10.0`.
- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate` unless stated otherwise.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets. `.env` files stay untracked; only `.env.example` files are committed.
- Forked Plane code stays AGPL-3.0. Keep `LICENSE.txt`.
- API error shape is always `{error: {code, message}}`. Success shape is always `{data: ...}`.
- Every task ends with its own commit. Do not batch commits across tasks.
- All relative TypeScript imports in `apps/api` must use explicit `.js` extensions (required by `moduleResolution: NodeNext`). Extensionless relative imports fail `tsc --noEmit` with TS2835 even when Vitest passes.
- Load env files with `import { config } from "dotenv"; config();` at the top of the entry file. Bare `import "dotenv/config"` trips `oxlint --max-warnings=0` and fails the lint gate.
- Any task that changes `apps/api/package.json` dependencies must `git add` the regenerated root `pnpm-lock.yaml` in the same commit.

## Scope Note

This is Plan 01 of 3. Plan 02 covers gate-checklist UI, comments UI, research-link UI, and the PM workload dashboard. Plan 03 covers `apps/live` on Render, R2 storage, Resend email, and Vercel Cron cleanup. Plan 01 delivers: trimmed fork that typechecks, API with auth + ticket lifecycle + guards (tested), board rendering real data locally, both projects deployed.

---

### Task 1: Fork Plane and trim unused apps

**Files:**
- Create: repo contents via copy (see steps)
- Modify: `pnpm-workspace.yaml` (remove two exclusion lines)
- Delete: `apps/admin`, `apps/space`, `apps/api`, `apps/proxy`, `deployments`
- Test: `pnpm --filter web check:types` passes

**Interfaces:**
- Consumes: upstream `https://github.com/makeplane/plane.git` (preview branch, v1.4.2 era).
- Produces: trimmed monorepo where `pnpm install` resolves and `apps/web` typechecks.

- [ ] **Step 1: Clone upstream to a temp dir (do not clone inside StackGate)**

```powershell
git clone --depth 1 --branch preview https://github.com/makeplane/plane.git "$env:TEMP\plane-upstream"
```

Run: `Test-Path -LiteralPath "$env:TEMP\plane-upstream\apps\web\package.json"`
Expected: `True`

- [ ] **Step 2: Copy only the needed paths into StackGate (never copy `.git`)**

```powershell
$src = "$env:TEMP\plane-upstream"
$dst = "D:\Project\Web Project\Enuma\StackGate"
Copy-Item -LiteralPath "$src\apps\web" -Destination "$dst\apps\web" -Recurse
Copy-Item -LiteralPath "$src\apps\live" -Destination "$dst\apps\live" -Recurse
Copy-Item -LiteralPath "$src\packages" -Destination "$dst\packages" -Recurse
Copy-Item -LiteralPath "$src\patches" -Destination "$dst\patches" -Recurse
foreach ($f in @("package.json","pnpm-workspace.yaml","pnpm-lock.yaml","turbo.json",".npmrc",".node-version",".oxlintrc.json",".oxfmtrc.json",".prettierignore",".gitignore",".husky","LICENSE.txt","setup.sh")) {
  Copy-Item -LiteralPath "$src\$f" -Destination "$dst\$f"
}
```

Run: `Get-ChildItem -LiteralPath "D:\Project\Web Project\Enuma\StackGate\apps"`
Expected: directories `live` and `web` only.

- [ ] **Step 3: Remove the upstream `.git` footprint and temp dir**

```powershell
Remove-Item -LiteralPath "$env:TEMP\plane-upstream" -Recurse -Force
```

Run: `Test-Path -LiteralPath "D:\Project\Web Project\Enuma\StackGate\apps\web\.git"`
Expected: `False`

- [ ] **Step 4: Allow the new backend directory in the workspace**

In `pnpm-workspace.yaml`, delete exactly these two lines:

```yaml
  - "!apps/api"
  - "!apps/proxy"
```

The `packages:` block must read:

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 5: Regenerate the lockfile (frozen install fails after deleting workspace projects, so regeneration is required, not optional)**

Run: `pnpm install --no-frozen-lockfile`
Expected: exit code 0 with an updated `pnpm-lock.yaml`.

- [ ] **Step 6: Verify the fork typechecks**

Run: `pnpm --filter web check:types`
Expected: exit code 0, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add apps packages patches package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc .node-version .oxlintrc.json .oxfmtrc.json .prettierignore .gitignore .husky LICENSE.txt setup.sh
git commit -m "feat: fork plane web+live+packages, trim admin/space/django/proxy"
```

---

### Task 2: Scaffold the Hono API with health endpoint and tests

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/api/index.ts`, `apps/api/vercel.json`, `apps/api/.env.example`, `apps/api/tests/health.test.ts`
- Modify: none
- Test: `apps/api/tests/health.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `createApp()` exported from `apps/api/src/app.ts` returning a Hono app with `GET /api/health` → `{data: {ok: true}}`, JSON 404 `{error: {code: "NOT_FOUND"}}`, and a global error handler returning `{error: {code: "INTERNAL_ERROR"}}` with status 500.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/tests/health.test.ts
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

- [ ] **Step 2: Create package files, then run the test to verify it fails**

```json
// apps/api/package.json
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

```json
// apps/api/tsconfig.json
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

```text
# apps/api/.env.example
DATABASE_URL="postgresql://user:password@host:5432/stackgate"
JWT_SECRET="change-me-32-chars-minimum"
PORT="8000"
```

Run: `pnpm --filter stackgate-api test`
Expected: FAIL with "Failed to resolve import ../src/app" (proves the test runs before the implementation exists).

- [ ] **Step 3: Write the minimal implementation**

```typescript
// apps/api/src/app.ts
import { Hono } from "hono";

export function createApp(): Hono {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({ data: { ok: true } }));

  app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  });

  return app;
}
```

```typescript
// apps/api/src/server.ts
import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

config();

const port = Number(process.env.PORT ?? 8000);
serve({ fetch: createApp().fetch, port });
console.log(`stackgate-api listening on ${port}`);
```

```typescript
// apps/api/api/index.ts
import { handle } from "hono/vercel";
import { createApp } from "../src/app.js";

export default handle(createApp());
```

```json
// apps/api/vercel.json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index" }]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter stackgate-api test`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`.

- [ ] **Step 5: Verify types and lint**

Run: `pnpm --filter stackgate-api check:types`
Expected: exit code 0.

Run: `pnpm --filter stackgate-api check:lint`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): hono scaffold with health endpoint and tests"
```

---

### Task 3: Drizzle schema, Neon wiring, and state seed

**Files:**
- Create: `apps/api/drizzle.config.ts`, `apps/api/src/db/schema.ts`, `apps/api/src/db/client.ts`, `apps/api/src/db/seed.ts`
- Modify: `apps/api/package.json` (add `db:generate`, `db:migrate`, `db:seed` scripts)
- Test: `apps/api/tests/db.test.ts` (inserts then deletes one state row; requires `TEST_DATABASE_URL`)

**Interfaces:**
- Consumes: `DATABASE_URL` (Neon, pooled `-pooler` host) in `apps/api/.env`, never committed.
- Produces: `db` Drizzle client from `apps/api/src/db/client.ts`; tables `users`, `workspaces`, `workspace_members`, `projects`, `project_members`, `states`, `tickets`, `ticket_transitions`, `gate_check_items`, `research_links`, `comments`, `refresh_tokens`; `seed()` creating demo workspace, project, 4 states, and 3 dev users (guarded by `ALLOW_DEV_SEED=1`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/tests/db.test.ts
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { projects, states, workspaces } from "../src/db/schema.js";

describe("db roundtrip", () => {
  it("inserts and deletes a state row with its parents", async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
    const [ws] = await db.insert(workspaces).values({ name: "Probe WS" }).returning({ id: workspaces.id });
    const [project] = await db
      .insert(projects)
      .values({ workspaceId: ws.id, name: "Probe Project", slug: `probe-${Date.now()}` })
      .returning({ id: projects.id });
    const [row] = await db
      .insert(states)
      .values({ projectId: project.id, key: "probe", name: "Probe", position: "99" })
      .returning({ id: states.id });
    expect(row.id).toBeDefined();
    await db.delete(states).where(eq(states.id, row.id));
    await db.delete(projects).where(eq(projects.id, project.id));
    await db.delete(workspaces).where(eq(workspaces.id, ws.id));
  });
});
```

- [ ] **Step 2: Create the schema, client, and config, then run the test to verify it fails**

```typescript
// apps/api/src/db/schema.ts
import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "lead", "pm"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull(),
});

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  key: text("key").notNull(),
  name: text("name").notNull(),
  position: text("position").notNull().default("0"),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  stateId: uuid("state_id").notNull().references(() => states.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  assigneeId: uuid("assignee_id").references(() => users.id),
  reporterId: uuid("reporter_id").references(() => users.id),
  researchRequired: boolean("research_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ticketTransitions = pgTable("ticket_transitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  fromStateId: uuid("from_state_id").references(() => states.id),
  toStateId: uuid("to_state_id").notNull().references(() => states.id),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gateCheckItems = pgTable("gate_check_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  label: text("label").notNull(),
  checkedById: uuid("checked_by_id").references(() => users.id),
  checkedAt: timestamp("checked_at"),
});

export const researchLinks = pgTable("research_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  url: text("url").notNull(),
  label: text("label").notNull(),
  required: boolean("required").notNull().default(false),
  createdById: uuid("created_by_id").references(() => users.id),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});
```

```typescript
// apps/api/src/db/client.ts
import { config } from "dotenv";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

config();

const connectionString = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");

export const pool = new Pool({ connectionString, max: 5 });
attachDatabasePool(pool);
export const db = drizzle(pool, { schema });
```

```typescript
// apps/api/drizzle.config.ts
import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config();

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

Run: `$env:TEST_DATABASE_URL = "<neon-branch-url>"; pnpm --filter stackgate-api test tests/db.test.ts`
Expected: FAIL with `relation "states" does not exist` (client and schema exist, but no migration has been applied yet — Step 5 fixes that).

- [ ] **Step 3: Add migration scripts and generate the migration**

Add to `apps/api/package.json` scripts:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx src/db/seed.ts"
```

Run: `pnpm --filter stackgate-api db:generate`
Expected: new SQL file under `apps/api/drizzle/` creating all 12 tables.

- [ ] **Step 4: Write the dev seed (guarded, dev only)**

```typescript
// apps/api/src/db/seed.ts
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { db } from "./client.js";
import { gateCheckItems, projectMembers, projects, states, ticketTransitions, tickets, users, workspaces } from "./schema.js";

config();

const DEFAULT_GATE_ITEMS = [
  "Kode berjalan sesuai acceptance tiket",
  "Tidak ada secret ter-commit",
  "Mengikuti modul riset yang ditautkan",
  "Sudah self-test oleh pelaksana",
];

async function main(): Promise<void> {
  if (process.env.ALLOW_DEV_SEED !== "1") throw new Error("Refusing to seed: set ALLOW_DEV_SEED=1");
  const passwordHash = await hash("dev123456", 10);
  const [pm] = await db.insert(users).values({ email: "pm@local.dev", name: "PM", role: "pm", passwordHash }).returning();
  const [lead] = await db.insert(users).values({ email: "lead@local.dev", name: "Lead", role: "lead", passwordHash }).returning();
  const [student] = await db.insert(users).values({ email: "siswa@local.dev", name: "Siswa", role: "student", passwordHash }).returning();
  const [ws] = await db.insert(workspaces).values({ name: "Demo" }).returning();
  const [project] = await db.insert(projects).values({ workspaceId: ws.id, name: "Contoh Klien", slug: "contoh-klien" }).returning();
  await Promise.all(
    [pm, lead, student].map((u) => db.insert(projectMembers).values({ projectId: project.id, userId: u.id, role: u.role })),
  );
  const stateRows = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Quality Gate Review", position: "2" },
    { key: "ready", name: "Client Ready", position: "3" },
  ];
  const insertedStates = await Promise.all(
    stateRows.map(async (s) => {
      const [row] = await db.insert(states).values({ projectId: project.id, ...s }).returning();
      return row;
    }),
  );
  const backlog = insertedStates[0];
  const [sample] = await db
    .insert(tickets)
    .values({ projectId: project.id, stateId: backlog.id, title: "Contoh tiket", description: "Tiket contoh untuk verifikasi board", assigneeId: student.id, reporterId: pm.id })
    .returning();
  await db.insert(ticketTransitions).values({ ticketId: sample.id, fromStateId: null, toStateId: backlog.id, actorId: pm.id });
  await Promise.all(DEFAULT_GATE_ITEMS.map((label) => db.insert(gateCheckItems).values({ ticketId: sample.id, label })));
  console.log(`seeded project ${project.id}`);
}

void main();
```

- [ ] **Step 5: Migrate a Neon branch, seed it, and run the DB test**

Run: `$env:DATABASE_URL = "<neon-branch-url>"; pnpm --filter stackgate-api db:migrate`
Expected: `drizzle-kit` reports all migrations applied with no errors.

Run: `$env:DATABASE_URL = "<neon-branch-url>"; $env:ALLOW_DEV_SEED = "1"; pnpm --filter stackgate-api db:seed`
Expected: output line `seeded project <uuid>` (creates demo users `pm@local.dev`, `lead@local.dev`, `siswa@local.dev` with password `dev123456`, one project, four states, one sample ticket with four gate items).

Run: `$env:TEST_DATABASE_URL = $env:DATABASE_URL; pnpm --filter stackgate-api test tests/db.test.ts`
Expected: `Tests  1 passed (1)`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/drizzle.config.ts apps/api/src/db apps/api/tests/db.test.ts apps/api/package.json apps/api/drizzle
git commit -m "feat(api): drizzle schema, neon client, state seed"
```

---

### Task 4: Auth endpoints with JWT rotation

**Files:**
- Create: `apps/api/src/auth/password.ts`, `apps/api/src/auth/tokens.ts`, `apps/api/src/auth/middleware.ts`, `apps/api/src/auth/routes.ts`, `apps/api/tests/auth.test.ts`
- Modify: `apps/api/src/app.ts` (mount `/api/auth` routes)
- Test: `apps/api/tests/auth.test.ts`

**Interfaces:**
- Consumes: `db`, `users`, `refreshTokens` from Task 3; `JWT_SECRET` env.
- Produces: `POST /api/auth/login` → `{data: {accessToken, user}}` + `sg_refresh` httpOnly cookie; `POST /api/auth/refresh` (rotates, revokes old); `POST /api/auth/logout`; `GET /api/auth/me` (Bearer required → `{data: {user}}`); `authMiddleware` setting `c.get("user")` to `{id, email, role}`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/tests/auth.test.ts
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("auth", () => {
  it("rejects wrong credentials with 401", async () => {
    const app = createApp();
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@local.dev", password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } });
  });

  it("rejects /api/auth/me without a token", async () => {
    const res = await createApp().request("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter stackgate-api test tests/auth.test.ts`
Expected: FAIL with 404 (no `/api/auth` routes mounted yet).

- [ ] **Step 3: Write the minimal implementation**

```typescript
// apps/api/src/auth/password.ts
// NOTE: named imports are mandatory — default-import member access trips
// oxlint no-named-as-default-member under --max-warnings=0 (proven in Task 3).
import { compare, hash } from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return compare(password, hashValue);
}
```

```typescript
// apps/api/src/auth/tokens.ts
import { createHash, randomBytes } from "node:crypto";
import { sign, verify } from "hono/jwt";

export interface AccessPayload {
  sub: string;
  email: string;
  role: "student" | "lead" | "pm";
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be at least 32 chars");
  return s;
}

export async function signAccess(payload: AccessPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign({ ...payload, iat: now, exp: now + 15 * 60 }, secret(), "HS256");
}

export async function verifyAccess(token: string): Promise<AccessPayload> {
  return (await verify(token, secret(), "HS256")) as unknown as AccessPayload;
}

export function newRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
```

```typescript
// apps/api/src/auth/middleware.ts
import { createMiddleware } from "hono/factory";
import { verifyAccess } from "./tokens.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "lead" | "pm";
}

export const authMiddleware = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak ditemukan" } }, 401);
  }
  try {
    const payload = await verifyAccess(token);
    c.set("user", { id: payload.sub, email: payload.email, role: payload.role } satisfies AuthUser);
    await next();
  } catch {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak valid" } }, 401);
  }
});
```

```typescript
// apps/api/src/auth/routes.ts
import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { refreshTokens, users } from "../db/schema.js";
import { verifyPassword } from "./password.js";
import { authMiddleware, type AuthUser } from "./middleware.js";
import { hashRefreshToken, newRefreshToken, signAccess } from "./tokens.js";

const REFRESH_DAYS = 7;
const auth = new Hono<{ Variables: { user: AuthUser } }>();

function publicUser(u: typeof users.$inferSelect) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } }, 401);
  }
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
  const { token, tokenHash } = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
  });
  setCookie(c, "sg_refresh", token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
  return c.json({ data: { accessToken, user: publicUser(user) } });
});

auth.post("/refresh", async (c) => {
  const presented = getCookie(c, "sg_refresh");
  if (!presented) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" } }, 401);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hashRefreshToken(presented)), isNull(refreshTokens.revokedAt)))
    .limit(1);
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  }
  const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
  if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id));
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
  const next = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: next.tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
  });
  setCookie(c, "sg_refresh", next.token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
  return c.json({ data: { accessToken, user: publicUser(user) } });
});

auth.post("/logout", async (c) => {
  const presented = getCookie(c, "sg_refresh");
  if (presented) {
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)));
  }
  deleteCookie(c, "sg_refresh", { path: "/api/auth" });
  return c.json({ data: { ok: true } });
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);
  return c.json({ data: { user: publicUser(row) } });
});

export default auth;
```

Mount in `apps/api/src/app.ts` by adding:

```typescript
import auth from "./auth/routes.js";

app.route("/api/auth", auth);
```

- [ ] **Step 4: Run the test to verify it passes (requires a database, because login queries `users`)**

Run: `$env:DATABASE_URL = "<neon-branch-url>"; pnpm --filter stackgate-api test tests/auth.test.ts`
Expected: `Tests  2 passed (2)`.

- [ ] **Step 5: Verify types and lint**

Run: `pnpm --filter stackgate-api check:types`
Expected: exit code 0.

Run: `pnpm --filter stackgate-api check:lint`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.ts apps/api/tests/auth.test.ts
git commit -m "feat(api): jwt auth with refresh rotation"
```

---

### Task 5: Ticket lifecycle with transition guards

**Files:**
- Create: `apps/api/src/tickets/guard.ts`, `apps/api/src/tickets/routes.ts`, `apps/api/tests/tickets.test.ts`
- Modify: `apps/api/src/app.ts` (mount `/api` ticket routes)
- Test: `apps/api/tests/tickets.test.ts`

**Interfaces:**
- Consumes: `db`, schema tables, `authMiddleware`, `AuthUser` from Task 4.
- Produces: `GET/POST /api/projects/:id/tickets`, `GET/PATCH /api/tickets/:id`, `POST /api/tickets/:id/transition` (`{to_state: stateKey}`) enforcing the spec matrix with codes `FORBIDDEN_TRANSITION` (403), `GATE_INCOMPLETE` (422), `RESEARCH_LINK_REQUIRED` (422); `GET/POST /api/tickets/:id/research-links`; `GET/POST /api/tickets/:id/gate-checks`; `PATCH /api/gate-checks/:id` (lead only).

- [ ] **Step 1: Write the first failing test (auth gate on the transition endpoint)**

```typescript
// apps/api/tests/tickets.test.ts
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("transition guards (no token)", () => {
  it("rejects transition without token", async () => {
    const res = await createApp().request("/api/tickets/00000000-0000-0000-0000-000000000000/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_state: "ready" }),
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter stackgate-api test tests/tickets.test.ts`
Expected: FAIL with `expected 404 to be 401` (no ticket routes mounted yet, so the app-level 404 handler answers).

- [ ] **Step 3: Write the guard and routes**

```typescript
// apps/api/src/tickets/guard.ts
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { gateCheckItems, researchLinks, states, tickets } from "../db/schema.js";
import type { AuthUser } from "../auth/middleware.js";

export type GuardOk = { ok: true; toStateId: string };
export type GuardFail = { ok: false; status: 403 | 422 | 404; code: string; message: string };

const STUDENT_FORWARD: Record<string, string> = {
  backlog: "in-development",
  "in-development": "review",
};

export async function checkTransition(ticketId: string, toKey: string, actor: AuthUser): Promise<GuardOk | GuardFail> {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
  const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
  const toState = projectStates.find((s) => s.key === toKey);
  if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
  const fromState = projectStates.find((s) => s.id === ticket.stateId);

  if (actor.role === "student") {
    const allowed = fromState && STUDENT_FORWARD[fromState.key] === toKey;
    if (!allowed) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Siswa hanya boleh maju ke Review" };
    }
    if (toKey === "review" && ticket.researchRequired) {
      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
      if (links.length === 0) {
        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
      }
    }
    return { ok: true, toStateId: toState.id };
  }

  if (toKey === "ready") {
    if (actor.role !== "lead") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh menutup tiket" };
    }
    const unchecked = await db
      .select({ id: gateCheckItems.id })
      .from(gateCheckItems)
      .where(and(eq(gateCheckItems.ticketId, ticket.id), isNull(gateCheckItems.checkedAt)))
      .limit(1);
    if (unchecked.length > 0) {
      return { ok: false, status: 422, code: "GATE_INCOMPLETE", message: "Checklist gerbang belum lengkap" };
    }
    const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
    if (ticket.researchRequired && links.length === 0) {
      return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
    }
    return { ok: true, toStateId: toState.id };
  }

  // NOTE: no trailing student check — the first student block returns on every
  // path, so any further student branch is unreachable (tsc TS2367 proves it).
  return { ok: true, toStateId: toState.id };
}
```

```typescript
// apps/api/src/tickets/routes.ts
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { comments, gateCheckItems, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";
import { checkTransition } from "./guard.js";

const ticketsApi = new Hono();
// NOTE: authMiddleware is applied per-route (e.g. ticketsApi.get("/projects/:id/tickets", authMiddleware, ...)).
// A mounted sub-app use("*") also matches /api/health and breaks the health test with 401 — proven in Task 5.

ticketsApi.get("/projects/:id/tickets", authMiddleware, async (c) => {
  const rows = await db.select().from(tickets).where(eq(tickets.projectId, c.req.param("id")));
  return c.json({ data: { tickets: rows } });
});

ticketsApi.post("/projects/:id/tickets", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ title: string; description?: string; assigneeId?: string; researchRequired?: boolean }>();
  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
  }
  const projectStates = await db.select().from(states).where(eq(states.projectId, c.req.param("id")));
  const backlog = projectStates.find((s) => s.key === "backlog");
  if (!backlog) return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog belum ada" } }, 400);
  const [row] = await db
    .insert(tickets)
    .values({
      projectId: c.req.param("id"),
      stateId: backlog.id,
      title: body.title.trim(),
      description: body.description ?? "",
      assigneeId: body.assigneeId ?? null,
      reporterId: user.id,
      researchRequired: body.researchRequired ?? false,
    })
    .returning();
  await db.insert(ticketTransitions).values({ ticketId: row.id, fromStateId: null, toStateId: backlog.id, actorId: user.id });
  return c.json({ data: { ticket: row } }, 201);
});

ticketsApi.get("/tickets/:id", authMiddleware, async (c) => {
  const [row] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  return c.json({ data: { ticket: row } });
});

ticketsApi.post("/tickets/:id/transition", authMiddleware, async (c) => {
  const user = c.get("user");
  const { to_state } = await c.req.json<{ to_state: string }>();
  const result = await checkTransition(c.req.param("id"), to_state, user);
  if (!result.ok) return c.json({ error: { code: result.code, message: result.message } }, result.status);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  const [updated] = await db.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
  await db.insert(ticketTransitions).values({ ticketId: updated.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
  return c.json({ data: { ticket: updated } });
});

ticketsApi.get("/tickets/:id/research-links", authMiddleware, async (c) => {
  const rows = await db.select().from(researchLinks).where(eq(researchLinks.ticketId, c.req.param("id")));
  return c.json({ data: { links: rows } });
});

ticketsApi.post("/tickets/:id/research-links", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ url: string; label: string; required?: boolean }>();
  if (!body.url || !body.label) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "URL dan label wajib diisi" } }, 400);
  }
  const [row] = await db
    .insert(researchLinks)
    .values({ ticketId: c.req.param("id"), url: body.url, label: body.label, required: body.required ?? false, createdById: user.id })
    .returning();
  return c.json({ data: { link: row } }, 201);
});

ticketsApi.get("/tickets/:id/gate-checks", authMiddleware, async (c) => {
  const rows = await db.select().from(gateCheckItems).where(eq(gateCheckItems.ticketId, c.req.param("id")));
  return c.json({ data: { items: rows } });
});

ticketsApi.post("/tickets/:id/gate-checks", authMiddleware, async (c) => {
  const user = c.get("user");
  if (user.role === "student") {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang mengelola checklist" } }, 403);
  }
  const body = await c.req.json<{ label: string }>();
  const [row] = await db.insert(gateCheckItems).values({ ticketId: c.req.param("id"), label: body.label }).returning();
  return c.json({ data: { item: row } }, 201);
});

ticketsApi.get("/tickets/:id/comments", authMiddleware, async (c) => {
  const rows = await db.select().from(comments).where(eq(comments.ticketId, c.req.param("id")));
  return c.json({ data: { comments: rows } });
});

ticketsApi.post("/tickets/:id/comments", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ body: string }>();
  if (!body.body || body.body.trim().length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
  }
  const [row] = await db.insert(comments).values({ ticketId: c.req.param("id"), authorId: user.id, body: body.body.trim() }).returning();
  return c.json({ data: { comment: row } }, 201);
});

export default ticketsApi;
```

Mount in `apps/api/src/app.ts` by adding:

```typescript
import ticketsApi from "./tickets/routes.js";

app.route("/api", ticketsApi);
```

The gate-check update endpoint (`PATCH /api/gate-checks/:id`, lead only) ships in Plan 02 with the checklist UI.

- [ ] **Step 4: Run all API tests**

Run: `pnpm --filter stackgate-api test`
Expected: all test files pass (health 2, auth 2, db 1, tickets 1).

- [ ] **Step 5: Verify types and lint**

Run: `pnpm --filter stackgate-api check:types`
Expected: exit code 0.

Run: `pnpm --filter stackgate-api check:lint`
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/tickets apps/api/src/app.ts apps/api/tests/tickets.test.ts
git commit -m "feat(api): ticket lifecycle with transition guards"
```

---

### Task 6: FE adapter and local end-to-end render

**Files:**
- Create: `packages/services/src/stackgate/client.ts`, `packages/services/src/stackgate/auth.ts`, `packages/services/src/stackgate/tickets.ts`, `apps/web/.env` (untracked, local only)
- Modify: `packages/services/src/index.ts` (re-export stackgate adapter)
- Test: manual render + `pnpm --filter web check:types` + `pnpm --filter web build`

**Interfaces:**
- Consumes: API from Tasks 4–5 at `VITE_API_BASE_URL` (local `http://localhost:8000`); access token kept in module memory with silent refresh on 401.
- Produces: `sgLogin`, `sgMe`, `sgListTickets`, `sgTransition` usable by board components; `toUserMessage(code)` mapping API codes to Indonesian messages.

- [ ] **Step 1: Find current auth consumers (proves what must be rewired)**

Run: `Get-ChildItem -LiteralPath "apps/web/app","apps/web/core" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "@plane/services" | Select-Object -Unique Path`
Expected: a concrete file list (these are the only call sites the adapter must satisfy in Plan 01).

- [ ] **Step 2: Write the adapter**

```typescript
// packages/services/src/stackgate/client.ts
import axios, { create, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesi berakhir, silakan login kembali",
  FORBIDDEN_TRANSITION: "Aksi ini di luar hak peran kamu",
  GATE_INCOMPLETE: "Checklist gerbang belum lengkap",
  RESEARCH_LINK_REQUIRED: "Tautan modul riset wajib diisi dulu",
  VALIDATION_ERROR: "Data yang dikirim belum valid",
  NOT_FOUND: "Data tidak ditemukan",
};

export function toUserMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Terjadi kesalahan, coba lagi";
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// NOTE: baseURL comes from process.env, NOT import.meta.env. web's
// vite.config defines process.env as JSON of VITE_* vars, and
// @plane/services has no vite/client types, so import.meta.env breaks
// the services package's own check:types gate. process.env needs
// "@types/node": "catalog:" in packages/services devDependencies
// (same as @plane/constants); add it and regenerate the lockfile.
// NOTE: use the named create() import — axios.create trips
// oxlint no-named-as-default-member and the package budget is
// max-warnings=6 with 6 pre-existing warnings. axios.post below is
// fine ("post" is not a named axios export).
export function createStackGateClient(): AxiosInstance {
  const instance = create({ baseURL: process.env.VITE_API_BASE_URL });
  instance.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });
  interface RetriableConfig extends InternalAxiosRequestConfig {
    _retried?: boolean;
  }
  instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: { code?: string } }>;
      const original = axiosError.config as RetriableConfig | undefined;
      if (axiosError.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        const refresh = await axios.post<{ data: { accessToken: string } }>(
          `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(refresh.data.data.accessToken);
        return instance(original);
      }
      const code = axiosError.response?.data?.error?.code;
      throw new Error(code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi");
    },
  );
  return instance;
}

export const sgApi = createStackGateClient();
```

```typescript
// packages/services/src/stackgate/auth.ts
import { sgApi, setAccessToken } from "./client";

export interface SgUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "lead" | "pm";
}

export async function sgLogin(email: string, password: string): Promise<SgUser> {
  const res = await sgApi.post("/api/auth/login", { email, password }, { withCredentials: true });
  setAccessToken(res.data.data.accessToken as string);
  return res.data.data.user as SgUser;
}

export async function sgMe(): Promise<SgUser> {
  const res = await sgApi.get("/api/auth/me");
  return res.data.data.user as SgUser;
}
```

```typescript
// packages/services/src/stackgate/tickets.ts
import { sgApi } from "./client";

export async function sgListTickets(projectId: string): Promise<unknown[]> {
  const res = await sgApi.get(`/api/projects/${projectId}/tickets`);
  return res.data.data.tickets as unknown[];
}

export async function sgTransition(ticketId: string, toState: string): Promise<unknown> {
  const res = await sgApi.post(`/api/tickets/${ticketId}/transition`, { to_state: toState });
  return res.data.data.ticket;
}
```

Append to `packages/services/src/index.ts`:

```typescript
export * from "./stackgate/client";
export * from "./stackgate/auth";
export * from "./stackgate/tickets";
```

- [ ] **Step 3: Point local web at local API and render**

Create untracked `apps/web/.env`:

```text
VITE_API_BASE_URL="http://localhost:8000"
VITE_WEB_BASE_URL="http://localhost:3000"
VITE_LIVE_BASE_URL="http://localhost:3100"
VITE_LIVE_BASE_PATH="/live"
```

Run: `git status --porcelain --ignored "apps/web/.env"`
Expected: `!! apps/web/.env` (the local env file is git-ignored, never committed).

Run API: `pnpm --filter stackgate-api dev` (expects `stackgate-api listening on 8000`).
Run web: `pnpm --filter web dev` (expects React Router dev on port 3000).
Expected: login with a seeded dev user succeeds against the new API; board lists real tickets.

- [ ] **Step 4: Verify types and production build**

Run: `pnpm --filter web check:types`
Expected: exit code 0.

Run: `pnpm --filter web build`
Expected: exit code 0 with `build/client` emitted.

- [ ] **Step 5: Commit**

```bash
git add packages/services/src/stackgate packages/services/src/index.ts packages/services/package.json pnpm-lock.yaml
git commit -m "feat(web): stackgate api adapter with silent refresh"

Known pre-existing issue (do not fix in this task): `pnpm --filter @plane/services check:lint` reports 7 warnings vs `--max-warnings=6` on the untouched fork too. New stackgate files must add zero new warnings; the budget fix belongs to a later task.
```

---

### Task 7: CI and Vercel deploys

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: none (Vercel projects are dashboard/CLI state, documented below)
- Test: CI green on push; both production URLs respond

**Interfaces:**
- Consumes: Tasks 1–6 on `master`.
- Produces: two Vercel projects (`stackgate-web` root `apps/web`, `stackgate-api` root `apps/api`) with env vars set; CI running checks on every push.

- [ ] **Step 1: Write the CI workflow**

```yaml
# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [master, plan-01-foundation]
  pull_request:
jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm --filter web check:lint
      - run: pnpm --filter web check:types
      - run: pnpm --filter web check:format
      - run: pnpm --filter web build
  api:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
      TEST_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
      JWT_SECRET: "ci-only-secret-32-chars-minimum-x"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm --filter stackgate-api check:lint
      - run: pnpm --filter stackgate-api check:types
      - run: pnpm --filter stackgate-api test
```

- [ ] **Step 2: Commit the workflow (controller pushes and wires secrets)**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: web checks plus api checks and tests"
`

Do not push — the controller creates the GitHub repo, pushes `plan-01-foundation`, and sets the `NEON_DATABASE_URL` secret (fresh rotated pooled string), then verifies both CI jobs green.

- [ ] **Step 3: Create the two Vercel projects (controller, same repo, git-linked after push)**

`stackgate-web`: Root Directory `apps/web`, framework React Router/Vite auto-detect, production env `VITE_API_BASE_URL=https://<stackgate-api>.vercel.app`, `VITE_WEB_BASE_URL=https://<stackgate-web>.vercel.app`, `VITE_LIVE_BASE_URL` left empty until Plan 03.
`stackgate-api`: Root Directory `apps/api`, framework Other, production env `DATABASE_URL` (Neon pooled), `JWT_SECRET` (32+ chars), no `PORT` (Vercel injects its own). Use a production `JWT_SECRET` different from the local `apps/api/.env` value.

Security rotation (required, because the dev database password passed through session logs during Plan 01): before pointing production at Neon, reset the role password in Neon (project `StackGate`, role `neondb_owner`), put the fresh pooled connection string into Vercel `DATABASE_URL`, and replace the local `apps/api/.env` values with the fresh string. Verify with `git status --porcelain` that `.env` stays untracked.

- [ ] **Step 4: Verify production**

Run: `curl -s https://<stackgate-api>.vercel.app/api/health`
Expected: exactly `{"data":{"ok":true}}`.

Run: open `https://<stackgate-web>.vercel.app`, log in with a seeded user.
Expected: board renders tickets from Neon.

- [ ] **Step 5: Record the URLs**

Append the two production URLs to the top of this plan file in a `## Deployed (Plan 01)` section and amend the commit:

```bash
git add docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md
git commit -m "docs: record plan 01 production urls"
```
