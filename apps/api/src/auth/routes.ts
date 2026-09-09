import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { refreshTokens, users } from "../db/schema.js";
import { verifyPassword } from "./password.js";
import { authMiddleware, type AuthUser } from "./middleware.js";
import { hashRefreshToken, newRefreshToken, signAccess } from "./tokens.js";
import { invalidJson, readJson } from "../http.js";

const REFRESH_DAYS = 7;
const auth = new Hono<{ Variables: { user: AuthUser } }>();

function refreshCookieOptions(): { httpOnly: true; path: "/api/auth"; maxAge: number; sameSite: "None" | "Lax"; secure: boolean } {
  const crossSite = process.env.COOKIE_CROSS_SITE === "1";
  return {
    httpOnly: true,
    path: "/api/auth",
    maxAge: REFRESH_DAYS * 86400,
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite ? true : false,
  };
}

function publicUser(u: typeof users.$inferSelect) {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

auth.post("/login", async (c) => {
  const parsed = await readJson<{ email: string; password: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const { email, password } = parsed.body;
  if (!email || email.trim().length === 0 || !password || password.length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email dan password wajib diisi" } }, 400);
  }
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
  setCookie(c, "sg_refresh", token, refreshCookieOptions());
  return c.json({ data: { accessToken, user: publicUser(user) } });
});

auth.post("/refresh", async (c) => {
  const presented = getCookie(c, "sg_refresh");
  if (!presented) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" } }, 401);
  const [revoked] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.tokenHash, hashRefreshToken(presented)),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!revoked) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  }
  const [user] = await db.select().from(users).where(eq(users.id, revoked.userId)).limit(1);
  if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
  const next = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: next.tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
  });
  setCookie(c, "sg_refresh", next.token, refreshCookieOptions());
  return c.json({ data: { accessToken, user: publicUser(user) } });
});

auth.post("/logout", async (c) => {
  const presented = getCookie(c, "sg_refresh");
  if (presented) {
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)));
  }
  deleteCookie(c, "sg_refresh", { path: "/api/auth", sameSite: refreshCookieOptions().sameSite, secure: refreshCookieOptions().secure });
  return c.json({ data: { ok: true } });
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);
  return c.json({ data: { user: publicUser(row) } });
});

export default auth;
