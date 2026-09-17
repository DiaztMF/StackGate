# Task 3 Brief — Drizzle schema, Neon wiring, and state seed

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 3.
Branch: `plan-01-foundation` (base now `23335f1`). Work from `D:\Project\Web Project\Enuma\StackGate`.

Binding rulings from Task 2 (apply everywhere, already applied in the code below): relative imports carry `.js` extensions; env loads via `import { config } from "dotenv"; config();`.

## Requirements

Database provisioned by controller: Neon project `StackGate` (`shy-glitter-00193690`), branch `main` (`br-square-art-b3y2owsu`), pooled host. `apps/api/.env` already contains `DATABASE_URL` and `TEST_DATABASE_URL` (same branch) and is verified git-ignored — do not print, copy, or commit its contents. Skip any ask-for-URL step; use the env file as-is. Never run the seed against any other database.

Create `apps/api/tests/db.test.ts` exactly (TDD RED first):

```typescript
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { states } from "../src/db/schema.js";

describe("db roundtrip", () => {
  it("inserts and deletes a state row", async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
    const [row] = await db
      .insert(states)
      .values({ projectId: "00000000-0000-0000-0000-000000000000", key: "probe", name: "Probe", position: "99" })
      .returning({ id: states.id });
    expect(row.id).toBeDefined();
    await db.delete(states).where(eq(states.id, row.id));
  });
});
```

Create `apps/api/src/db/schema.ts` exactly (12 tables):

```typescript
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

Create `apps/api/src/db/client.ts` exactly:

```typescript
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

Create `apps/api/drizzle.config.ts` exactly:

```typescript
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

Run `$env:TEST_DATABASE_URL = "<neon-branch-url>"; pnpm --filter stackgate-api test tests/db.test.ts` and confirm FAIL with `relation "states" does not exist`.

Extend `apps/api/package.json` scripts to exactly:

```json
"scripts": {
  "dev": "tsx src/server.ts",
  "build": "tsc --noEmit",
  "check:types": "tsc --noEmit",
  "check:lint": "oxlint --max-warnings=0 src tests",
  "test": "vitest run",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "tsx src/db/seed.ts"
}
```

Run `pnpm --filter stackgate-api db:generate` and confirm a new SQL file under `apps/api/drizzle/` creating all 12 tables.

Create `apps/api/src/db/seed.ts` exactly:

```typescript
import { config } from "dotenv";
import bcrypt from "bcryptjs";
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
  const passwordHash = await bcrypt.hash("dev123456", 10);
  const [pm] = await db.insert(users).values({ email: "pm@local.dev", name: "PM", role: "pm", passwordHash }).returning();
  const [lead] = await db.insert(users).values({ email: "lead@local.dev", name: "Lead", role: "lead", passwordHash }).returning();
  const [student] = await db.insert(users).values({ email: "siswa@local.dev", name: "Siswa", role: "student", passwordHash }).returning();
  const [ws] = await db.insert(workspaces).values({ name: "Demo" }).returning();
  const [project] = await db.insert(projects).values({ workspaceId: ws.id, name: "Contoh Klien", slug: "contoh-klien" }).returning();
  for (const u of [pm, lead, student]) {
    await db.insert(projectMembers).values({ projectId: project.id, userId: u.id, role: u.role });
  }
  const stateRows = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Quality Gate Review", position: "2" },
    { key: "ready", name: "Client Ready", position: "3" },
  ];
  const insertedStates = [];
  for (const s of stateRows) {
    const [row] = await db.insert(states).values({ projectId: project.id, ...s }).returning();
    insertedStates.push(row);
  }
  const backlog = insertedStates[0];
  const [sample] = await db
    .insert(tickets)
    .values({ projectId: project.id, stateId: backlog.id, title: "Contoh tiket", description: "Tiket contoh untuk verifikasi board", assigneeId: student.id, reporterId: pm.id })
    .returning();
  await db.insert(ticketTransitions).values({ ticketId: sample.id, fromStateId: null, toStateId: backlog.id, actorId: pm.id });
  for (const label of DEFAULT_GATE_ITEMS) {
    await db.insert(gateCheckItems).values({ ticketId: sample.id, label });
  }
  console.log(`seeded project ${project.id}`);
}

void main();
```

Then, with `$env:DATABASE_URL` set to the Neon branch URL: `pnpm --filter stackgate-api db:migrate` (expect migrations applied, no errors), then `$env:ALLOW_DEV_SEED = "1"; pnpm --filter stackgate-api db:seed` (expect `seeded project <uuid>`), then `$env:TEST_DATABASE_URL = $env:DATABASE_URL; pnpm --filter stackgate-api test tests/db.test.ts` (expect 1 passed). Then `check:types` exit 0 and full `pnpm --filter stackgate-api test` green. Commit exactly: `git add apps/api/drizzle.config.ts apps/api/src/db apps/api/tests/db.test.ts apps/api/package.json apps/api/drizzle` then `git commit -m "feat(api): drizzle schema, neon client, state seed"`.

## Amendment v2 (brief-owner rulings after implementer escalation — follow exactly)

Findings from the first attempt (commit `20abc6a`, tests green but fragile):

1. `tests/db.test.ts` as pinned cannot pass on a fresh database: it inserts a `states` row with a zero UUID whose parent `projects` row does not exist (FK `23503`). Replace the test file with the self-contained version below (creates workspace → project → probe, cleans up in reverse). Rationale: CI runs this test against a fresh Neon branch where no manual fixture row exists.
2. `src/db/seed.ts` as pinned trips `oxlint --max-warnings=0` (1× `no-named-as-default-member` on `bcrypt.hash`, 3× `no-await-in-loop`). Replace with the version below: `import { hash } from "bcryptjs"` and `Promise.all` instead of awaited loops. Behavior is identical; Task 5's lint gate requires this green.
3. Delete the manual fixture row left in the dev database (`projects.id = 00000000-0000-0000-0000-000000000000`, name `Probe Fixture`) using the temp script below, then delete the temp script and verify it is gone via `git status --porcelain`.

Replacement `apps/api/tests/db.test.ts` (full file):

```typescript
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

Replacement `apps/api/src/db/seed.ts` (full file):

```typescript
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

Temp fixture cleanup (create as `apps/api/fixture-cleanup.mjs`, run, then delete the file):

```javascript
import { config } from "dotenv";
config();
import { eq } from "drizzle-orm";
import { db } from "./src/db/client.js";
import { projects } from "./src/db/schema.js";

await db.delete(projects).where(eq(projects.id, "00000000-0000-0000-0000-000000000000"));
console.log("fixture removed");
process.exit(0);
```

Run: `pnpm --filter stackgate-api exec tsx fixture-cleanup.mjs`, then `Remove-Item -LiteralPath "apps/api/fixture-cleanup.mjs"`, then confirm `git status --porcelain` shows no trace of it.

After all three fixes, re-run in order: `pnpm --filter stackgate-api test tests/db.test.ts`, full `pnpm --filter stackgate-api test`, `pnpm --filter stackgate-api check:types`, `pnpm --filter stackgate-api check:lint` (must be 0 warnings). Commit exactly: `git add apps/api/tests/db.test.ts apps/api/src/db/seed.ts` then `git commit -m "fix(api): self-contained db test, lint-clean seed"`.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets (no `.env`). Seed password `dev123456` is dev-only and guarded by `ALLOW_DEV_SEED=1`; never run seed against production.
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- Exported contracts later tasks rely on: `db` from `src/db/client.ts`; all table definitions from `src/db/schema.ts` with the exact names above.
