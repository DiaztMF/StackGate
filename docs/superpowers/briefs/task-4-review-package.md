# Task 4 review package
## Commits
d0c0124 feat(api): jwt auth with refresh rotation
## Stat
 apps/api/src/app.ts             |  2 ++
 apps/api/src/auth/middleware.ts | 23 +++++++++++++
 apps/api/src/auth/password.ts   |  9 +++++
 apps/api/src/auth/routes.ts     | 75 +++++++++++++++++++++++++++++++++++++++++
 apps/api/src/auth/tokens.ts     | 33 ++++++++++++++++++
 apps/api/tests/auth.test.ts     | 22 ++++++++++++
 6 files changed, 164 insertions(+)
## Full diff
``diff
diff --git a/apps/api/src/app.ts b/apps/api/src/app.ts
index 6498c37..df2e269 100644
--- a/apps/api/src/app.ts
+++ b/apps/api/src/app.ts
@@ -1,9 +1,11 @@
 import { Hono } from "hono";
+import auth from "./auth/routes.js";
 
 export function createApp(): Hono {
   const app = new Hono();
 
   app.get("/api/health", (c) => c.json({ data: { ok: true } }));
+  app.route("/api/auth", auth);
 
   app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
   app.onError((err, c) => {
diff --git a/apps/api/src/auth/middleware.ts b/apps/api/src/auth/middleware.ts
new file mode 100644
index 0000000..1ad7e6c
--- /dev/null
+++ b/apps/api/src/auth/middleware.ts
@@ -0,0 +1,23 @@
+import { createMiddleware } from "hono/factory";
+import { verifyAccess } from "./tokens.js";
+
+export interface AuthUser {
+  id: string;
+  email: string;
+  role: "student" | "lead" | "pm";
+}
+
+export const authMiddleware = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
+  const header = c.req.header("Authorization") ?? "";
+  const [scheme, token] = header.split(" ");
+  if (scheme !== "Bearer" || !token) {
+    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak ditemukan" } }, 401);
+  }
+  try {
+    const payload = await verifyAccess(token);
+    c.set("user", { id: payload.sub, email: payload.email, role: payload.role } satisfies AuthUser);
+    await next();
+  } catch {
+    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak valid" } }, 401);
+  }
+});
diff --git a/apps/api/src/auth/password.ts b/apps/api/src/auth/password.ts
new file mode 100644
index 0000000..10202d3
--- /dev/null
+++ b/apps/api/src/auth/password.ts
@@ -0,0 +1,9 @@
+import { compare, hash } from "bcryptjs";
+
+export async function hashPassword(password: string): Promise<string> {
+  return hash(password, 10);
+}
+
+export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
+  return compare(password, hashValue);
+}
diff --git a/apps/api/src/auth/routes.ts b/apps/api/src/auth/routes.ts
new file mode 100644
index 0000000..bac2728
--- /dev/null
+++ b/apps/api/src/auth/routes.ts
@@ -0,0 +1,75 @@
+import { Hono } from "hono";
+import { getCookie, setCookie, deleteCookie } from "hono/cookie";
+import { and, eq, isNull } from "drizzle-orm";
+import { db } from "../db/client.js";
+import { refreshTokens, users } from "../db/schema.js";
+import { verifyPassword } from "./password.js";
+import { authMiddleware, type AuthUser } from "./middleware.js";
+import { hashRefreshToken, newRefreshToken, signAccess } from "./tokens.js";
+
+const REFRESH_DAYS = 7;
+const auth = new Hono<{ Variables: { user: AuthUser } }>();
+
+function publicUser(u: typeof users.$inferSelect) {
+  return { id: u.id, email: u.email, name: u.name, role: u.role };
+}
+
+auth.post("/login", async (c) => {
+  const { email, password } = await c.req.json<{ email: string; password: string }>();
+  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
+  if (!user || !(await verifyPassword(password, user.passwordHash))) {
+    return c.json({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } }, 401);
+  }
+  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
+  const { token, tokenHash } = newRefreshToken();
+  await db.insert(refreshTokens).values({
+    userId: user.id,
+    tokenHash,
+    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
+  });
+  setCookie(c, "sg_refresh", token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
+  return c.json({ data: { accessToken, user: publicUser(user) } });
+});
+
+auth.post("/refresh", async (c) => {
+  const presented = getCookie(c, "sg_refresh");
+  if (!presented) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" } }, 401);
+  const [stored] = await db
+    .select()
+    .from(refreshTokens)
+    .where(and(eq(refreshTokens.tokenHash, hashRefreshToken(presented)), isNull(refreshTokens.revokedAt)))
+    .limit(1);
+  if (!stored || stored.expiresAt.getTime() < Date.now()) {
+    return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
+  }
+  const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
+  if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
+  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id));
+  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
+  const next = newRefreshToken();
+  await db.insert(refreshTokens).values({
+    userId: user.id,
+    tokenHash: next.tokenHash,
+    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
+  });
+  setCookie(c, "sg_refresh", next.token, { httpOnly: true, path: "/api/auth", maxAge: REFRESH_DAYS * 86400, sameSite: "Lax", secure: true });
+  return c.json({ data: { accessToken, user: publicUser(user) } });
+});
+
+auth.post("/logout", async (c) => {
+  const presented = getCookie(c, "sg_refresh");
+  if (presented) {
+    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)));
+  }
+  deleteCookie(c, "sg_refresh", { path: "/api/auth" });
+  return c.json({ data: { ok: true } });
+});
+
+auth.get("/me", authMiddleware, async (c) => {
+  const user = c.get("user");
+  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
+  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);
+  return c.json({ data: { user: publicUser(row) } });
+});
+
+export default auth;
diff --git a/apps/api/src/auth/tokens.ts b/apps/api/src/auth/tokens.ts
new file mode 100644
index 0000000..5d7530c
--- /dev/null
+++ b/apps/api/src/auth/tokens.ts
@@ -0,0 +1,33 @@
+import { createHash, randomBytes } from "node:crypto";
+import { sign, verify } from "hono/jwt";
+
+export interface AccessPayload {
+  sub: string;
+  email: string;
+  role: "student" | "lead" | "pm";
+}
+
+function secret(): string {
+  const s = process.env.JWT_SECRET;
+  if (!s || s.length < 32) throw new Error("JWT_SECRET must be at least 32 chars");
+  return s;
+}
+
+export async function signAccess(payload: AccessPayload): Promise<string> {
+  const now = Math.floor(Date.now() / 1000);
+  return sign({ ...payload, iat: now, exp: now + 15 * 60 }, secret(), "HS256");
+}
+
+export async function verifyAccess(token: string): Promise<AccessPayload> {
+  return (await verify(token, secret(), "HS256")) as unknown as AccessPayload;
+}
+
+export function newRefreshToken(): { token: string; tokenHash: string } {
+  const token = randomBytes(32).toString("hex");
+  const tokenHash = createHash("sha256").update(token).digest("hex");
+  return { token, tokenHash };
+}
+
+export function hashRefreshToken(token: string): string {
+  return createHash("sha256").update(token).digest("hex");
+}
diff --git a/apps/api/tests/auth.test.ts b/apps/api/tests/auth.test.ts
new file mode 100644
index 0000000..eb8ef98
--- /dev/null
+++ b/apps/api/tests/auth.test.ts
@@ -0,0 +1,22 @@
+import { describe, expect, it } from "vitest";
+import { createApp } from "../src/app.js";
+
+process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";
+
+describe("auth", () => {
+  it("rejects wrong credentials with 401", async () => {
+    const app = createApp();
+    const res = await app.request("/api/auth/login", {
+      method: "POST",
+      headers: { "Content-Type": "application/json" },
+      body: JSON.stringify({ email: "nobody@local.dev", password: "wrong" }),
+    });
+    expect(res.status).toBe(401);
+    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } });
+  });
+
+  it("rejects /api/auth/me without a token", async () => {
+    const res = await createApp().request("/api/auth/me");
+    expect(res.status).toBe(401);
+  });
+});
``
