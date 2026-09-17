# Review-fix review package
## Commits
c18b0cf fix(review): cors, cookie, guard matrix, interceptor, regression tests
## Stat
 apps/api/.env.example                     |   2 +
 apps/api/.gitignore                       |   1 +
 apps/api/src/app.ts                       |  15 +++
 apps/api/src/auth/routes.ts               |  48 +++++---
 apps/api/src/http.ts                      |  13 +++
 apps/api/src/tickets/guard.ts             |  75 ++++++++----
 apps/api/src/tickets/routes.ts            |  41 +++++--
 apps/api/tests/guard.test.ts              | 182 ++++++++++++++++++++++++++++++
 packages/services/src/stackgate/client.ts |  58 ++++++++--
 9 files changed, 381 insertions(+), 54 deletions(-)
## Full diff
``diff
diff --git a/apps/api/.env.example b/apps/api/.env.example
index df9fc8c..1909a90 100644
--- a/apps/api/.env.example
+++ b/apps/api/.env.example
@@ -1,3 +1,5 @@
 DATABASE_URL="postgresql://user:password@host:5432/stackgate"
 JWT_SECRET="change-me-32-chars-minimum"
 PORT="8000"
+WEB_ORIGIN="http://localhost:3000"
+COOKIE_CROSS_SITE="0"
diff --git a/apps/api/.gitignore b/apps/api/.gitignore
new file mode 100644
index 0000000..e985853
--- /dev/null
+++ b/apps/api/.gitignore
@@ -0,0 +1 @@
+.vercel
diff --git a/apps/api/src/app.ts b/apps/api/src/app.ts
index b8d271d..9c0da77 100644
--- a/apps/api/src/app.ts
+++ b/apps/api/src/app.ts
@@ -1,10 +1,25 @@
 import { Hono } from "hono";
+import { cors } from "hono/cors";
 import auth from "./auth/routes.js";
 import ticketsApi from "./tickets/routes.js";
 
 export function createApp(): Hono {
   const app = new Hono();
 
+  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
+    .split(",")
+    .map((s) => s.trim())
+    .filter(Boolean);
+  app.use(
+    "*",
+    cors({
+      origin: origins,
+      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
+      allowHeaders: ["Content-Type", "Authorization"],
+      credentials: true,
+      maxAge: 600,
+    }),
+  );
   app.get("/api/health", (c) => c.json({ data: { ok: true } }));
   app.route("/api/auth", auth);
   app.route("/api", ticketsApi);
diff --git a/apps/api/src/auth/routes.ts b/apps/api/src/auth/routes.ts
index bac2728..d3f9374 100644
--- a/apps/api/src/auth/routes.ts
+++ b/apps/api/src/auth/routes.ts
@@ -1,21 +1,38 @@
 import { Hono } from "hono";
 import { getCookie, setCookie, deleteCookie } from "hono/cookie";
-import { and, eq, isNull } from "drizzle-orm";
+import { and, eq, gt, isNull } from "drizzle-orm";
 import { db } from "../db/client.js";
 import { refreshTokens, users } from "../db/schema.js";
 import { verifyPassword } from "./password.js";
 import { authMiddleware, type AuthUser } from "./middleware.js";
 import { hashRefreshToken, newRefreshToken, signAccess } from "./tokens.js";
+import { invalidJson, readJson } from "../http.js";
 
 const REFRESH_DAYS = 7;
 const auth = new Hono<{ Variables: { user: AuthUser } }>();
 
+function refreshCookieOptions(): { httpOnly: true; path: "/api/auth"; maxAge: number; sameSite: "None" | "Lax"; secure: boolean } {
+  const crossSite = process.env.COOKIE_CROSS_SITE === "1";
+  return {
+    httpOnly: true,
+    path: "/api/auth",
+    maxAge: REFRESH_DAYS * 86400,
+    sameSite: crossSite ? "None" : "Lax",
+    secure: crossSite ? true : false,
+  };
+}
+
 function publicUser(u: typeof users.$inferSelect) {
   return { id: u.id, email: u.email, name: u.name, role: u.role };
 }
 
 auth.post("/login", async (c) => {
-  const { email, password } = await c.req.json<{ email: string; password: string }>();
+  const parsed = await readJson<{ email: string; password: string }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const { email, password } = parsed.body;
+  if (!email || email.trim().length === 0 || !password || password.length === 0) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email dan password wajib diisi" } }, 400);
+  }
   const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
   if (!user || !(await verifyPassword(password, user.passwordHash))) {
     return c.json({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } }, 401);
@@ -27,24 +44,29 @@ auth.post("/login", async (c) => {
     tokenHash,
     expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
   });
-  setCookie(c, "sg_refresh", token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
+  setCookie(c, "sg_refresh", token, refreshCookieOptions());
   return c.json({ data: { accessToken, user: publicUser(user) } });
 });
 
 auth.post("/refresh", async (c) => {
   const presented = getCookie(c, "sg_refresh");
   if (!presented) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" } }, 401);
-  const [stored] = await db
-    .select()
-    .from(refreshTokens)
-    .where(and(eq(refreshTokens.tokenHash, hashRefreshToken(presented)), isNull(refreshTokens.revokedAt)))
-    .limit(1);
-  if (!stored || stored.expiresAt.getTime() < Date.now()) {
+  const [revoked] = await db
+    .update(refreshTokens)
+    .set({ revokedAt: new Date() })
+    .where(
+      and(
+        eq(refreshTokens.tokenHash, hashRefreshToken(presented)),
+        isNull(refreshTokens.revokedAt),
+        gt(refreshTokens.expiresAt, new Date()),
+      ),
+    )
+    .returning();
+  if (!revoked) {
     return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
   }
-  const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
+  const [user] = await db.select().from(users).where(eq(users.id, revoked.userId)).limit(1);
   if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
-  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id));
   const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
   const next = newRefreshToken();
   await db.insert(refreshTokens).values({
@@ -52,7 +74,7 @@ auth.post("/refresh", async (c) => {
     tokenHash: next.tokenHash,
     expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
   });
-  setCookie(c, "sg_refresh", next.token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
+  setCookie(c, "sg_refresh", next.token, refreshCookieOptions());
   return c.json({ data: { accessToken, user: publicUser(user) } });
 });
 
@@ -61,7 +83,7 @@ auth.post("/logout", async (c) => {
   if (presented) {
     await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)));
   }
-  deleteCookie(c, "sg_refresh", { path: "/api/auth" });
+  deleteCookie(c, "sg_refresh", { path: "/api/auth", sameSite: refreshCookieOptions().sameSite, secure: refreshCookieOptions().secure });
   return c.json({ data: { ok: true } });
 });
 
diff --git a/apps/api/src/http.ts b/apps/api/src/http.ts
new file mode 100644
index 0000000..36af4ee
--- /dev/null
+++ b/apps/api/src/http.ts
@@ -0,0 +1,13 @@
+import type { Context } from "hono";
+
+export async function readJson<T>(c: Context): Promise<{ ok: true; body: T } | { ok: false }> {
+  try {
+    return { ok: true, body: await c.req.json<T>() };
+  } catch {
+    return { ok: false };
+  }
+}
+
+export function invalidJson(c: Context) {
+  return c.json({ error: { code: "VALIDATION_ERROR", message: "Body JSON tidak valid" } }, 400);
+}
diff --git a/apps/api/src/tickets/guard.ts b/apps/api/src/tickets/guard.ts
index 196925e..04185a2 100644
--- a/apps/api/src/tickets/guard.ts
+++ b/apps/api/src/tickets/guard.ts
@@ -6,32 +6,19 @@ import type { AuthUser } from "../auth/middleware.js";
 export type GuardOk = { ok: true; toStateId: string };
 export type GuardFail = { ok: false; status: 403 | 422 | 404; code: string; message: string };
 
-const STUDENT_FORWARD: Record<string, string> = {
-  backlog: "in-development",
-  "in-development": "review",
-};
-
-export async function checkTransition(ticketId: string, toKey: string, actor: AuthUser): Promise<GuardOk | GuardFail> {
+export async function checkTransition(
+  ticketId: string,
+  toKey: string,
+  actor: AuthUser,
+  note?: string,
+): Promise<GuardOk | GuardFail> {
   const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
   if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
   const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
   const toState = projectStates.find((s) => s.key === toKey);
   if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
   const fromState = projectStates.find((s) => s.id === ticket.stateId);
-
-  if (actor.role === "student") {
-    const allowed = fromState && STUDENT_FORWARD[fromState.key] === toKey;
-    if (!allowed) {
-      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Siswa hanya boleh maju ke Review" };
-    }
-    if (toKey === "review" && ticket.researchRequired) {
-      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
-      if (links.length === 0) {
-        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
-      }
-    }
-    return { ok: true, toStateId: toState.id };
-  }
+  const fromKey = fromState?.key;
 
   if (toKey === "ready") {
     if (actor.role !== "lead") {
@@ -52,5 +39,51 @@ export async function checkTransition(ticketId: string, toKey: string, actor: Au
     return { ok: true, toStateId: toState.id };
   }
 
-  return { ok: true, toStateId: toState.id };
+  if (toKey === "backlog" && fromKey !== "backlog") {
+    if (actor.role === "student") {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead atau PM yang boleh mengembalikan tiket" };
+    }
+    if (!note || note.trim().length === 0) {
+      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Alasan pengembalian wajib diisi" };
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  if (fromKey === "review" && toKey === "in-development") {
+    if (actor.role !== "lead") {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh me-reject tiket" };
+    }
+    if (!note || note.trim().length === 0) {
+      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Catatan revisi wajib diisi" };
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  if (fromKey === "backlog" && toKey === "in-development") {
+    if (!ticket.assigneeId) {
+      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Tiket harus punya assignee dulu" };
+    }
+    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  if (fromKey === "in-development" && toKey === "review") {
+    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
+      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
+    }
+    if (!ticket.description || ticket.description.trim().length === 0) {
+      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Deskripsi tiket wajib diisi dulu" };
+    }
+    if (ticket.researchRequired) {
+      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
+      if (links.length === 0) {
+        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
+      }
+    }
+    return { ok: true, toStateId: toState.id };
+  }
+
+  return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Transisi ini tidak diizinkan" };
 }
diff --git a/apps/api/src/tickets/routes.ts b/apps/api/src/tickets/routes.ts
index 2b4248d..0efdc16 100644
--- a/apps/api/src/tickets/routes.ts
+++ b/apps/api/src/tickets/routes.ts
@@ -1,8 +1,9 @@
 import { Hono } from "hono";
 import { eq } from "drizzle-orm";
 import { db } from "../db/client.js";
-import { comments, gateCheckItems, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
+import { comments, gateCheckItems, projects, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
 import { authMiddleware, type AuthUser } from "../auth/middleware.js";
+import { invalidJson, readJson } from "../http.js";
 import { checkTransition } from "./guard.js";
 
 const ticketsApi = new Hono<{ Variables: { user: AuthUser } }>();
@@ -14,10 +15,14 @@ ticketsApi.get("/projects/:id/tickets", authMiddleware, async (c) => {
 
 ticketsApi.post("/projects/:id/tickets", authMiddleware, async (c) => {
   const user = c.get("user");
-  const body = await c.req.json<{ title: string; description?: string; assigneeId?: string; researchRequired?: boolean }>();
+  const parsed = await readJson<{ title: string; description?: string; assigneeId?: string; researchRequired?: boolean }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const body = parsed.body;
   if (!body.title || body.title.trim().length === 0) {
     return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
   }
+  const [project] = await db.select().from(projects).where(eq(projects.id, c.req.param("id"))).limit(1);
+  if (!project) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);
   const projectStates = await db.select().from(states).where(eq(states.projectId, c.req.param("id")));
   const backlog = projectStates.find((s) => s.key === "backlog");
   if (!backlog) return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog belum ada" } }, 400);
@@ -45,12 +50,21 @@ ticketsApi.get("/tickets/:id", authMiddleware, async (c) => {
 
 ticketsApi.post("/tickets/:id/transition", authMiddleware, async (c) => {
   const user = c.get("user");
-  const { to_state } = await c.req.json<{ to_state: string }>();
-  const result = await checkTransition(c.req.param("id"), to_state, user);
+  const parsed = await readJson<{ to_state: string; note?: string }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const { to_state, note } = parsed.body;
+  if (!to_state || to_state.trim().length === 0) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "State tujuan wajib diisi" } }, 400);
+  }
+  const result = await checkTransition(c.req.param("id"), to_state, user, note);
   if (!result.ok) return c.json({ error: { code: result.code, message: result.message } }, result.status);
   const [ticket] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
-  const [updated] = await db.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
-  await db.insert(ticketTransitions).values({ ticketId: updated.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
+  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
+  const [updated] = await db.transaction(async (tx) => {
+    const [row] = await tx.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
+    await tx.insert(ticketTransitions).values({ ticketId: row.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
+    return [row];
+  });
   return c.json({ data: { ticket: updated } });
 });
 
@@ -61,7 +75,9 @@ ticketsApi.get("/tickets/:id/research-links", authMiddleware, async (c) => {
 
 ticketsApi.post("/tickets/:id/research-links", authMiddleware, async (c) => {
   const user = c.get("user");
-  const body = await c.req.json<{ url: string; label: string; required?: boolean }>();
+  const parsed = await readJson<{ url: string; label: string; required?: boolean }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const body = parsed.body;
   if (!body.url || !body.label) {
     return c.json({ error: { code: "VALIDATION_ERROR", message: "URL dan label wajib diisi" } }, 400);
   }
@@ -82,7 +98,12 @@ ticketsApi.post("/tickets/:id/gate-checks", authMiddleware, async (c) => {
   if (user.role === "student") {
     return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang mengelola checklist" } }, 403);
   }
-  const body = await c.req.json<{ label: string }>();
+  const parsed = await readJson<{ label: string }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const body = parsed.body;
+  if (!body.label || body.label.trim().length === 0) {
+    return c.json({ error: { code: "VALIDATION_ERROR", message: "Label wajib diisi" } }, 400);
+  }
   const [row] = await db.insert(gateCheckItems).values({ ticketId: c.req.param("id"), label: body.label }).returning();
   return c.json({ data: { item: row } }, 201);
 });
@@ -94,7 +115,9 @@ ticketsApi.get("/tickets/:id/comments", authMiddleware, async (c) => {
 
 ticketsApi.post("/tickets/:id/comments", authMiddleware, async (c) => {
   const user = c.get("user");
-  const body = await c.req.json<{ body: string }>();
+  const parsed = await readJson<{ body: string }>(c);
+  if (!parsed.ok) return invalidJson(c);
+  const body = parsed.body;
   if (!body.body || body.body.trim().length === 0) {
     return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
   }
diff --git a/apps/api/tests/guard.test.ts b/apps/api/tests/guard.test.ts
new file mode 100644
index 0000000..76ca4ca
--- /dev/null
+++ b/apps/api/tests/guard.test.ts
@@ -0,0 +1,182 @@
+import { afterEach, describe, expect, it } from "vitest";
+import { inArray } from "drizzle-orm";
+import { createApp } from "../src/app.js";
+import { db } from "../src/db/client.js";
+import { hashPassword } from "../src/auth/password.js";
+import {
+  comments,
+  gateCheckItems,
+  projects,
+  refreshTokens,
+  researchLinks,
+  states,
+  ticketTransitions,
+  tickets,
+  users,
+  workspaces,
+} from "../src/db/schema.js";
+
+process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";
+
+const app = createApp();
+
+let seq = 0;
+function uniq(prefix: string): string {
+  seq += 1;
+  return `${prefix}-${Date.now()}-${seq}`;
+}
+
+const workspaceIds: string[] = [];
+const projectIds: string[] = [];
+const userIds: string[] = [];
+const ticketIds: string[] = [];
+
+afterEach(async () => {
+  if (ticketIds.length > 0) {
+    await db.delete(gateCheckItems).where(inArray(gateCheckItems.ticketId, ticketIds));
+    await db.delete(researchLinks).where(inArray(researchLinks.ticketId, ticketIds));
+    await db.delete(comments).where(inArray(comments.ticketId, ticketIds));
+    await db.delete(ticketTransitions).where(inArray(ticketTransitions.ticketId, ticketIds));
+    await db.delete(tickets).where(inArray(tickets.id, ticketIds));
+    ticketIds.length = 0;
+  }
+  if (projectIds.length > 0) {
+    await db.delete(states).where(inArray(states.projectId, projectIds));
+    await db.delete(projects).where(inArray(projects.id, projectIds));
+    projectIds.length = 0;
+  }
+  if (userIds.length > 0) {
+    await db.delete(refreshTokens).where(inArray(refreshTokens.userId, userIds));
+    await db.delete(users).where(inArray(users.id, userIds));
+    userIds.length = 0;
+  }
+  if (workspaceIds.length > 0) {
+    await db.delete(workspaces).where(inArray(workspaces.id, workspaceIds));
+    workspaceIds.length = 0;
+  }
+});
+
+interface Fixture {
+  ticketId: string;
+  studentToken: string;
+  leadToken: string;
+}
+
+async function loginToken(email: string, password: string): Promise<string> {
+  const res = await app.request("/api/auth/login", {
+    method: "POST",
+    headers: { "Content-Type": "application/json" },
+    body: JSON.stringify({ email, password }),
+  });
+  expect(res.status).toBe(200);
+  const json = (await res.json()) as { data: { accessToken: string } };
+  return json.data.accessToken;
+}
+
+async function setupFixture(opts?: { researchRequired?: boolean; description?: string }): Promise<Fixture> {
+  const tag = uniq("probe");
+  const password = "Test1234!";
+  const [studentHash, leadHash] = await Promise.all([hashPassword(password), hashPassword(password)]);
+  const [ws] = await db.insert(workspaces).values({ name: `WS ${tag}` }).returning({ id: workspaces.id });
+  workspaceIds.push(ws.id);
+  const [project] = await db
+    .insert(projects)
+    .values({ workspaceId: ws.id, name: `Proj ${tag}`, slug: `probe-${tag}` })
+    .returning({ id: projects.id });
+  projectIds.push(project.id);
+  const stateDefs = [
+    { key: "backlog", name: "Backlog", position: "0" },
+    { key: "in-development", name: "In Development", position: "1" },
+    { key: "review", name: "Review", position: "2" },
+    { key: "ready", name: "Ready", position: "3" },
+  ];
+  const inserted = await Promise.all(
+    stateDefs.map((s) => db.insert(states).values({ projectId: project.id, ...s }).returning({ id: states.id, key: states.key })),
+  );
+  const flat = inserted.flat();
+  const backlog = flat.find((s) => s.key === "backlog");
+  expect(backlog).toBeDefined();
+  const backlogId = (backlog as { id: string }).id;
+  const studentEmail = `student-${tag}@local.dev`;
+  const leadEmail = `lead-${tag}@local.dev`;
+  const [student] = await db
+    .insert(users)
+    .values({ email: studentEmail, name: "Student", role: "student", passwordHash: studentHash })
+    .returning({ id: users.id });
+  const [lead] = await db
+    .insert(users)
+    .values({ email: leadEmail, name: "Lead", role: "lead", passwordHash: leadHash })
+    .returning({ id: users.id });
+  userIds.push(student.id, lead.id);
+  const [ticket] = await db
+    .insert(tickets)
+    .values({
+      projectId: project.id,
+      stateId: backlogId,
+      title: `T ${tag}`,
+      description: opts?.description ?? "",
+      assigneeId: student.id,
+      reporterId: lead.id,
+      researchRequired: opts?.researchRequired ?? false,
+    })
+    .returning({ id: tickets.id });
+  ticketIds.push(ticket.id);
+  const studentToken = await loginToken(studentEmail, password);
+  const leadToken = await loginToken(leadEmail, password);
+  return { ticketId: ticket.id, studentToken, leadToken };
+}
+
+function transition(token: string, ticketId: string, body: Record<string, string>) {
+  return app.request(`/api/tickets/${ticketId}/transition`, {
+    method: "POST",
+    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
+    body: JSON.stringify(body),
+  });
+}
+
+describe("guard matrix", () => {
+  it("student backlogGåÆin-development GåÆ 200", async () => {
+    const f = await setupFixture({ description: "Deskripsi awal" });
+    const res = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
+    expect(res.status).toBe(200);
+  });
+
+  it("student GåÆready GåÆ 403 FORBIDDEN_TRANSITION", async () => {
+    const f = await setupFixture();
+    const res = await transition(f.studentToken, f.ticketId, { to_state: "ready" });
+    expect(res.status).toBe(403);
+    const json = (await res.json()) as { error: { code: string } };
+    expect(json.error.code).toBe("FORBIDDEN_TRANSITION");
+  });
+
+  it("lead GåÆready with unchecked gate items GåÆ 422 GATE_INCOMPLETE", async () => {
+    const f = await setupFixture();
+    await db.insert(gateCheckItems).values({ ticketId: f.ticketId, label: "Check 1" });
+    const res = await transition(f.leadToken, f.ticketId, { to_state: "ready" });
+    expect(res.status).toBe(422);
+    const json = (await res.json()) as { error: { code: string } };
+    expect(json.error.code).toBe("GATE_INCOMPLETE");
+  });
+
+  it("researchRequired ticket student in-developmentGåÆreview GåÆ 422 RESEARCH_LINK_REQUIRED", async () => {
+    const f = await setupFixture({ description: "Riset modul X", researchRequired: true });
+    const r1 = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
+    expect(r1.status).toBe(200);
+    const r2 = await transition(f.studentToken, f.ticketId, { to_state: "review" });
+    expect(r2.status).toBe(422);
+    const json = (await r2.json()) as { error: { code: string } };
+    expect(json.error.code).toBe("RESEARCH_LINK_REQUIRED");
+  });
+
+  it("lead reject reviewGåÆin-development without note GåÆ 422, with note GåÆ 200", async () => {
+    const f = await setupFixture({ description: "Deskripsi lengkap" });
+    const r1 = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
+    expect(r1.status).toBe(200);
+    const r2 = await transition(f.studentToken, f.ticketId, { to_state: "review" });
+    expect(r2.status).toBe(200);
+    const bad = await transition(f.leadToken, f.ticketId, { to_state: "in-development" });
+    expect(bad.status).toBe(422);
+    const good = await transition(f.leadToken, f.ticketId, { to_state: "in-development", note: "Perlu revisi" });
+    expect(good.status).toBe(200);
+  });
+});
diff --git a/packages/services/src/stackgate/client.ts b/packages/services/src/stackgate/client.ts
index b24f889..5b9d3fa 100644
--- a/packages/services/src/stackgate/client.ts
+++ b/packages/services/src/stackgate/client.ts
@@ -19,6 +19,40 @@ export function setAccessToken(token: string | null): void {
   accessToken = token;
 }
 
+let refreshPromise: Promise<string> | null = null;
+
+function isAuthUrl(url: string | undefined): boolean {
+  if (!url) return false;
+  return url.includes("/api/auth/login") || url.includes("/api/auth/refresh");
+}
+
+async function fetchFreshToken(): Promise<string> {
+  const refresh = await axios.post<{ data: { accessToken: string } }>(
+    `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
+    {},
+    { withCredentials: true },
+  );
+  return refresh.data.data.accessToken;
+}
+
+async function clearWhenDone(p: Promise<string>): Promise<void> {
+  try {
+    await p;
+  } catch {
+    // caller handles refresh errors
+  } finally {
+    if (refreshPromise === p) refreshPromise = null;
+  }
+}
+
+function startRefresh(): Promise<string> {
+  if (!refreshPromise) {
+    refreshPromise = fetchFreshToken();
+    void clearWhenDone(refreshPromise);
+  }
+  return refreshPromise;
+}
+
 interface RetriableConfig extends InternalAxiosRequestConfig {
   _retried?: boolean;
 }
@@ -32,20 +66,22 @@ export function createStackGateClient(): AxiosInstance {
   instance.interceptors.response.use(
     (res) => res,
     async (error: unknown) => {
-      const axiosError = error as AxiosError<{ error?: { code?: string } }>;
+      const axiosError = error as AxiosError<{ error?: { code?: string; message?: string } }>;
       const original = axiosError.config as RetriableConfig | undefined;
-      if (axiosError.response?.status === 401 && original && !original._retried) {
+      if (axiosError.response?.status === 401 && original && !original._retried && !isAuthUrl(original.url)) {
         original._retried = true;
-        const refresh = await axios.post<{ data: { accessToken: string } }>(
-          `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
-          {},
-          { withCredentials: true },
-        );
-        setAccessToken(refresh.data.data.accessToken);
-        return instance(original);
+        try {
+          const token = await startRefresh();
+          setAccessToken(token);
+          return instance(original);
+        } catch {
+          setAccessToken(null);
+          throw new Error(toUserMessage("UNAUTHORIZED"));
+        }
       }
-      const code = axiosError.response?.data?.error?.code;
-      throw new Error(code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi");
+      const serverMessage = axiosError.response?.data?.error?.message as string | undefined;
+      const code = axiosError.response?.data?.error?.code as string | undefined;
+      throw new Error(serverMessage ?? (code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi"));
     },
   );
   return instance;
``
