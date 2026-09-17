# Task 3 review package
## Commits
d490026 fix(api): self-contained db test, lint-clean seed
20abc6a feat(api): drizzle schema, neon client, state seed
## Stat
 apps/api/drizzle.config.ts               |  11 +
 apps/api/drizzle/0000_medical_siren.sql  | 123 +++++
 apps/api/drizzle/meta/0000_snapshot.json | 888 +++++++++++++++++++++++++++++++
 apps/api/drizzle/meta/_journal.json      |  13 +
 apps/api/package.json                    |   5 +-
 apps/api/src/db/client.ts                |  14 +
 apps/api/src/db/schema.ts                | 102 ++++
 apps/api/src/db/seed.ts                  |  48 ++
 apps/api/tests/db.test.ts                |  23 +
 9 files changed, 1226 insertions(+), 1 deletion(-)
## Full diff (excludes generated drizzle SQL)
``diff
diff --git a/apps/api/drizzle.config.ts b/apps/api/drizzle.config.ts
new file mode 100644
index 0000000..60479b0
--- /dev/null
+++ b/apps/api/drizzle.config.ts
@@ -0,0 +1,11 @@
+import { config } from "dotenv";
+import type { Config } from "drizzle-kit";
+
+config();
+
+export default {
+  schema: "./src/db/schema.ts",
+  out: "./drizzle",
+  dialect: "postgresql",
+  dbCredentials: { url: process.env.DATABASE_URL! },
+} satisfies Config;
diff --git a/apps/api/package.json b/apps/api/package.json
index 1e36073..b7ef924 100644
--- a/apps/api/package.json
+++ b/apps/api/package.json
@@ -8,7 +8,10 @@
     "build": "tsc --noEmit",
     "check:types": "tsc --noEmit",
     "check:lint": "oxlint --max-warnings=0 src tests",
-    "test": "vitest run"
+    "test": "vitest run",
+    "db:generate": "drizzle-kit generate",
+    "db:migrate": "drizzle-kit migrate",
+    "db:seed": "tsx src/db/seed.ts"
   },
   "dependencies": {
     "@vercel/functions": "^2.2.2",
diff --git a/apps/api/src/db/client.ts b/apps/api/src/db/client.ts
new file mode 100644
index 0000000..37a6367
--- /dev/null
+++ b/apps/api/src/db/client.ts
@@ -0,0 +1,14 @@
+import { config } from "dotenv";
+import { attachDatabasePool } from "@vercel/functions";
+import { drizzle } from "drizzle-orm/node-postgres";
+import { Pool } from "pg";
+import * as schema from "./schema.js";
+
+config();
+
+const connectionString = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL;
+if (!connectionString) throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");
+
+export const pool = new Pool({ connectionString, max: 5 });
+attachDatabasePool(pool);
+export const db = drizzle(pool, { schema });
diff --git a/apps/api/src/db/schema.ts b/apps/api/src/db/schema.ts
new file mode 100644
index 0000000..ec1d856
--- /dev/null
+++ b/apps/api/src/db/schema.ts
@@ -0,0 +1,102 @@
+import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
+
+export const roleEnum = pgEnum("role", ["student", "lead", "pm"]);
+
+export const users = pgTable("users", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  email: text("email").notNull().unique(),
+  name: text("name").notNull(),
+  role: roleEnum("role").notNull().default("student"),
+  passwordHash: text("password_hash").notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const workspaces = pgTable("workspaces", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  name: text("name").notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const workspaceMembers = pgTable("workspace_members", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
+  userId: uuid("user_id").notNull().references(() => users.id),
+  role: roleEnum("role").notNull(),
+});
+
+export const projects = pgTable("projects", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
+  name: text("name").notNull(),
+  slug: text("slug").notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const projectMembers = pgTable("project_members", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  projectId: uuid("project_id").notNull().references(() => projects.id),
+  userId: uuid("user_id").notNull().references(() => users.id),
+  role: roleEnum("role").notNull(),
+});
+
+export const states = pgTable("states", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  projectId: uuid("project_id").notNull().references(() => projects.id),
+  key: text("key").notNull(),
+  name: text("name").notNull(),
+  position: text("position").notNull().default("0"),
+});
+
+export const tickets = pgTable("tickets", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  projectId: uuid("project_id").notNull().references(() => projects.id),
+  stateId: uuid("state_id").notNull().references(() => states.id),
+  title: text("title").notNull(),
+  description: text("description").notNull().default(""),
+  assigneeId: uuid("assignee_id").references(() => users.id),
+  reporterId: uuid("reporter_id").references(() => users.id),
+  researchRequired: boolean("research_required").notNull().default(false),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const ticketTransitions = pgTable("ticket_transitions", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
+  fromStateId: uuid("from_state_id").references(() => states.id),
+  toStateId: uuid("to_state_id").notNull().references(() => states.id),
+  actorId: uuid("actor_id").notNull().references(() => users.id),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const gateCheckItems = pgTable("gate_check_items", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
+  label: text("label").notNull(),
+  checkedById: uuid("checked_by_id").references(() => users.id),
+  checkedAt: timestamp("checked_at"),
+});
+
+export const researchLinks = pgTable("research_links", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
+  url: text("url").notNull(),
+  label: text("label").notNull(),
+  required: boolean("required").notNull().default(false),
+  createdById: uuid("created_by_id").references(() => users.id),
+});
+
+export const comments = pgTable("comments", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
+  authorId: uuid("author_id").notNull().references(() => users.id),
+  body: text("body").notNull(),
+  createdAt: timestamp("created_at").defaultNow().notNull(),
+});
+
+export const refreshTokens = pgTable("refresh_tokens", {
+  id: uuid("id").primaryKey().defaultRandom(),
+  userId: uuid("user_id").notNull().references(() => users.id),
+  tokenHash: text("token_hash").notNull().unique(),
+  expiresAt: timestamp("expires_at").notNull(),
+  revokedAt: timestamp("revoked_at"),
+});
diff --git a/apps/api/src/db/seed.ts b/apps/api/src/db/seed.ts
new file mode 100644
index 0000000..0bfe831
--- /dev/null
+++ b/apps/api/src/db/seed.ts
@@ -0,0 +1,48 @@
+import { config } from "dotenv";
+import { hash } from "bcryptjs";
+import { db } from "./client.js";
+import { gateCheckItems, projectMembers, projects, states, ticketTransitions, tickets, users, workspaces } from "./schema.js";
+
+config();
+
+const DEFAULT_GATE_ITEMS = [
+  "Kode berjalan sesuai acceptance tiket",
+  "Tidak ada secret ter-commit",
+  "Mengikuti modul riset yang ditautkan",
+  "Sudah self-test oleh pelaksana",
+];
+
+async function main(): Promise<void> {
+  if (process.env.ALLOW_DEV_SEED !== "1") throw new Error("Refusing to seed: set ALLOW_DEV_SEED=1");
+  const passwordHash = await hash("dev123456", 10);
+  const [pm] = await db.insert(users).values({ email: "pm@local.dev", name: "PM", role: "pm", passwordHash }).returning();
+  const [lead] = await db.insert(users).values({ email: "lead@local.dev", name: "Lead", role: "lead", passwordHash }).returning();
+  const [student] = await db.insert(users).values({ email: "siswa@local.dev", name: "Siswa", role: "student", passwordHash }).returning();
+  const [ws] = await db.insert(workspaces).values({ name: "Demo" }).returning();
+  const [project] = await db.insert(projects).values({ workspaceId: ws.id, name: "Contoh Klien", slug: "contoh-klien" }).returning();
+  await Promise.all(
+    [pm, lead, student].map((u) => db.insert(projectMembers).values({ projectId: project.id, userId: u.id, role: u.role })),
+  );
+  const stateRows = [
+    { key: "backlog", name: "Backlog", position: "0" },
+    { key: "in-development", name: "In Development", position: "1" },
+    { key: "review", name: "Quality Gate Review", position: "2" },
+    { key: "ready", name: "Client Ready", position: "3" },
+  ];
+  const insertedStates = await Promise.all(
+    stateRows.map(async (s) => {
+      const [row] = await db.insert(states).values({ projectId: project.id, ...s }).returning();
+      return row;
+    }),
+  );
+  const backlog = insertedStates[0];
+  const [sample] = await db
+    .insert(tickets)
+    .values({ projectId: project.id, stateId: backlog.id, title: "Contoh tiket", description: "Tiket contoh untuk verifikasi board", assigneeId: student.id, reporterId: pm.id })
+    .returning();
+  await db.insert(ticketTransitions).values({ ticketId: sample.id, fromStateId: null, toStateId: backlog.id, actorId: pm.id });
+  await Promise.all(DEFAULT_GATE_ITEMS.map((label) => db.insert(gateCheckItems).values({ ticketId: sample.id, label })));
+  console.log(`seeded project ${project.id}`);
+}
+
+void main();
diff --git a/apps/api/tests/db.test.ts b/apps/api/tests/db.test.ts
new file mode 100644
index 0000000..05db9d7
--- /dev/null
+++ b/apps/api/tests/db.test.ts
@@ -0,0 +1,23 @@
+import { describe, expect, it } from "vitest";
+import { eq } from "drizzle-orm";
+import { db } from "../src/db/client.js";
+import { projects, states, workspaces } from "../src/db/schema.js";
+
+describe("db roundtrip", () => {
+  it("inserts and deletes a state row with its parents", async () => {
+    if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
+    const [ws] = await db.insert(workspaces).values({ name: "Probe WS" }).returning({ id: workspaces.id });
+    const [project] = await db
+      .insert(projects)
+      .values({ workspaceId: ws.id, name: "Probe Project", slug: `probe-${Date.now()}` })
+      .returning({ id: projects.id });
+    const [row] = await db
+      .insert(states)
+      .values({ projectId: project.id, key: "probe", name: "Probe", position: "99" })
+      .returning({ id: states.id });
+    expect(row.id).toBeDefined();
+    await db.delete(states).where(eq(states.id, row.id));
+    await db.delete(projects).where(eq(projects.id, project.id));
+    await db.delete(workspaces).where(eq(workspaces.id, ws.id));
+  });
+});
``
