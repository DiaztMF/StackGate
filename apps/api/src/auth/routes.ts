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
