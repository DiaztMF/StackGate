# Task 5 review package
## Commits
ca2a1a4 feat(api): ticket lifecycle with transition guards
## Stat
 apps/api/src/app.ts            |   2 +
 apps/api/src/tickets/guard.ts  |  56 ++++++++++++++++++++++
 apps/api/src/tickets/routes.ts | 105 +++++++++++++++++++++++++++++++++++++++++
 apps/api/tests/tickets.test.ts |  13 +++++
 4 files changed, 176 insertions(+)
## Full diff
``diff
diff --git a/apps/api/src/app.ts b/apps/api/src/app.ts
index df2e269..b8d271d 100644
--- a/apps/api/src/app.ts
+++ b/apps/api/src/app.ts
@@ -1,11 +1,13 @@
 import { Hono } from "hono";
 import auth from "./auth/routes.js";
+import ticketsApi from "./tickets/routes.js";
 
 export function createApp(): Hono {
   const app = new Hono();
 
   app.get("/api/health", (c) => c.json({ data: { ok: true } }));
   app.route("/api/auth", auth);
+  app.route("/api", ticketsApi);
 
   app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
   app.onError((err, c) => {
diff --git a/apps/api/src/tickets/guard.ts b/apps/api/src/tickets/guard.ts
new file mode 100644
index 0000000..196925e
--- /dev/null
+++ b/apps/api/src/tickets/guard.ts
@@ -0,0 +1,56 @@
+import { and, eq, isNull } from "drizzle-orm";
+import { db } from "../db/client.js";
+import { gateCheckItems, researchLinks, states, tickets } from "../db/schema.js";
+import type { AuthUser } from "../auth/middleware.js";
+
+export type GuardOk = { ok: true; toStateId: string };
+export type GuardFail = { ok: false; status: 403 | 422 | 404; code: string; message: string };
+
+const STUDENT_FORWARD: Record<string, string> = {
+  backlog: "in-development",
+  "in-development": "review",
+};
+
+export async function checkTransition(ticketId: string, toKey: string, actor: AuthUser): Promise<GuardOk | GuardFail> {
+  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
+  if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
+  const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
+  const toState = projectStates.find((s) => s.key === toKey);
+  if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
+  const fromState = projectStates.find((s) => s.id === ticket.stateId);
+
+  if (actor.role === "student") {
+    const allowed = fromState && STUDENT_FORWARD[fromState.key] === toKey;
+    if (!allowed) {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Siswa hanya boleh maju ke Review" };
+    }
+    if (toKey === "review" && ticket.researchRequired) {
+      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
+      if (links.length === 0) {
+        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
+      }
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  if (toKey === "ready") {
+    if (actor.role !== "lead") {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh menutup tiket" };
+    }
+    const unchecked = await db
+      .select({ id: gateCheckItems.id })
+      .from(gateCheckItems)
+      .where(and(eq(gateCheckItems.ticketId, ticket.id), isNull(gateCheckItems.checkedAt)))
+      .limit(1);
+    if (unchecked.length > 0) {
+      return { ok: false, status: 422, code: "GATE_INCOMPLETE", message: "Checklist gerbang belum lengkap" };
+    }
+    const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
+    if (ticket.researchRequired && links.length === 0) {
+      return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  return { ok: true, toStateId: toState.id };
+}
diff --git a/apps/api/src/tickets/routes.ts b/apps/api/src/tickets/routes.ts
new file mode 100644
index 0000000..2b4248d
--- /dev/null
+++ b/apps/api/src/tickets/routes.ts
@@ -0,0 +1,105 @@
+import { Hono } from "hono";
+import { eq } from "drizzle-orm";
+import { db } from "../db/client.js";
+import { comments, gateCheckItems, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
+import { authMiddleware, type AuthUser } from "../auth/middleware.js";
+import { checkTransition } from "./guard.js";
+
+const ticketsApi = new Hono<{ Variables: { user: AuthUser } }>();
+
+ticketsApi.get("/projects/:id/tickets", authMiddleware, async (c) => {
+  const rows = await db.select().from(tickets).where(eq(tickets.projectId, c.req.param("id")));
+  return c.json({ data: { tickets: rows } });
+});
+
+ticketsApi.post("/projects/:id/tickets", authMiddleware, async (c) => {
+  const user = c.get("user");
+  const body = await c.req.json<{ title: string; description?: string; assigneeId?: string; researchRequired?: boolean }>();
+  if (!body.title || body.title.trim().length === 0) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
+  }
+  const projectStates = await db.select().from(states).where(eq(states.projectId, c.req.param("id")));
+  const backlog = projectStates.find((s) => s.key === "backlog");
+  if (!backlog) return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog belum ada" } }, 400);
+  const [row] = await db
+    .insert(tickets)
+    .values({
+      projectId: c.req.param("id"),
+      stateId: backlog.id,
+      title: body.title.trim(),
+      description: body.description ?? "",
+      assigneeId: body.assigneeId ?? null,
+      reporterId: user.id,
+      researchRequired: body.researchRequired ?? false,
+    })
+    .returning();
+  await db.insert(ticketTransitions).values({ ticketId: row.id, fromStateId: null, toStateId: backlog.id, actorId: user.id });
+  return c.json({ data: { ticket: row } }, 201);
+});
+
+ticketsApi.get("/tickets/:id", authMiddleware, async (c) => {
+  const [row] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
+  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
+  return c.json({ data: { ticket: row } });
+});
+
+ticketsApi.post("/tickets/:id/transition", authMiddleware, async (c) => {
+  const user = c.get("user");
+  const { to_state } = await c.req.json<{ to_state: string }>();
+  const result = await checkTransition(c.req.param("id"), to_state, user);
+  if (!result.ok) return c.json({ error: { code: result.code, message: result.message } }, result.status);
+  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
+  const [updated] = await db.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
+  await db.insert(ticketTransitions).values({ ticketId: updated.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
+  return c.json({ data: { ticket: updated } });
+});
+
+ticketsApi.get("/tickets/:id/research-links", authMiddleware, async (c) => {
+  const rows = await db.select().from(researchLinks).where(eq(researchLinks.ticketId, c.req.param("id")));
+  return c.json({ data: { links: rows } });
+});
+
+ticketsApi.post("/tickets/:id/research-links", authMiddleware, async (c) => {
+  const user = c.get("user");
+  const body = await c.req.json<{ url: string; label: string; required?: boolean }>();
+  if (!body.url || !body.label) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "URL dan label wajib diisi" } }, 400);
+  }
+  const [row] = await db
+    .insert(researchLinks)
+    .values({ ticketId: c.req.param("id"), url: body.url, label: body.label, required: body.required ?? false, createdById: user.id })
+    .returning();
+  return c.json({ data: { link: row } }, 201);
+});
+
+ticketsApi.get("/tickets/:id/gate-checks", authMiddleware, async (c) => {
+  const rows = await db.select().from(gateCheckItems).where(eq(gateCheckItems.ticketId, c.req.param("id")));
+  return c.json({ data: { items: rows } });
+});
+
+ticketsApi.post("/tickets/:id/gate-checks", authMiddleware, async (c) => {
+  const user = c.get("user");
+  if (user.role === "student") {
+    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang mengelola checklist" } }, 403);
+  }
+  const body = await c.req.json<{ label: string }>();
+  const [row] = await db.insert(gateCheckItems).values({ ticketId: c.req.param("id"), label: body.label }).returning();
+  return c.json({ data: { item: row } }, 201);
+});
+
+ticketsApi.get("/tickets/:id/comments", authMiddleware, async (c) => {
+  const rows = await db.select().from(comments).where(eq(comments.ticketId, c.req.param("id")));
+  return c.json({ data: { comments: rows } });
+});
+
+ticketsApi.post("/tickets/:id/comments", authMiddleware, async (c) => {
+  const user = c.get("user");
+  const body = await c.req.json<{ body: string }>();
+  if (!body.body || body.body.trim().length === 0) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
+  }
+  const [row] = await db.insert(comments).values({ ticketId: c.req.param("id"), authorId: user.id, body: body.body.trim() }).returning();
+  return c.json({ data: { comment: row } }, 201);
+});
+
+export default ticketsApi;
diff --git a/apps/api/tests/tickets.test.ts b/apps/api/tests/tickets.test.ts
new file mode 100644
index 0000000..b33172d
--- /dev/null
+++ b/apps/api/tests/tickets.test.ts
@@ -0,0 +1,13 @@
+import { describe, expect, it } from "vitest";
+import { createApp } from "../src/app.js";
+
+describe("transition guards (no token)", () => {
+  it("rejects transition without token", async () => {
+    const res = await createApp().request("/api/tickets/00000000-0000-0000-0000-000000000000/transition", {
+      method: "POST",
+      headers: { "Content-Type": "application/json" },
+      body: JSON.stringify({ to_state: "ready" }),
+    });
+    expect(res.status).toBe(401);
+  });
+});
``
