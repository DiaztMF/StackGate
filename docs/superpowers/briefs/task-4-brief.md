# Task 4 Brief — Auth endpoints with JWT rotation

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 4.
Branch: `plan-01-foundation` (base now `d490026`). Work from `D:\Project\Web Project\Enuma\StackGate`.

Binding rulings (already applied in the code below): relative imports carry `.js` extensions; no bare dotenv side-effect imports.

Database: `apps/api/.env` holds `DATABASE_URL`/`TEST_DATABASE_URL` (Neon branch, git-ignored) — use via env file only, never print or commit credentials. Dev seed from Task 3 provides `pm@local.dev`, `lead@local.dev`, `siswa@local.dev` (password `dev123456`).

## Requirements

Create `apps/api/tests/auth.test.ts` exactly (TDD RED first):

```typescript
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

Run with `$env:DATABASE_URL` set (login queries `users`): `pnpm --filter stackgate-api test tests/auth.test.ts`, confirm FAIL (404, no `/api/auth` routes mounted yet).

Create `apps/api/src/auth/password.ts` exactly:

```typescript
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

Create `apps/api/src/auth/tokens.ts` exactly:

```typescript
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
  return sign({ ...payload, iat: now, exp: now + 15 * 60 }, secret());
}

export async function verifyAccess(token: string): Promise<AccessPayload> {
  return (await verify(token, secret())) as unknown as AccessPayload;
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

Create `apps/api/src/auth/middleware.ts` exactly:

```typescript
import { createMiddleware } from "hono/factory";
import { verifyAccess } from "./tokens.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "lead" | "pm";
}

export const authMiddleware = createMiddleware(async (c, next) => {
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

Create `apps/api/src/auth/routes.ts` exactly:

```typescript
import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { refreshTokens, users } from "../db/schema.js";
import { verifyPassword } from "./password.js";
import { authMiddleware } from "./middleware.js";
import { hashRefreshToken, newRefreshToken, signAccess } from "./tokens.js";

const REFRESH_DAYS = 7;
const auth = new Hono();

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

Gates: `pnpm --filter stackgate-api test tests/auth.test.ts` → 2 passed (with DATABASE_URL set); full `pnpm --filter stackgate-api test` green; `check:types` exit 0; `check:lint` exit 0 (note: `bcrypt.hash`/`bcrypt.compare` as member access is fine — only named-import-as-default was flagged before; default import `bcrypt` from `bcryptjs` with member calls is the file's pinned form, keep it byte-exact).

Wait — correction: the earlier lint finding was `no-named-as-default-member` on `bcrypt.hash` in seed.ts, which used `import bcrypt from "bcryptjs"`. The same pattern appears here in password.ts. It WILL trip lint again. Do not keep it byte-exact — use named imports: `import { compare, hash } from "bcryptjs";` with `hash(password, 10)` and `compare(password, hash)`. Brief-owner call: deviate from plan's password.ts block accordingly and note it in the report. (The plan file will be amended by the controller afterwards.)

Commit exactly: `git add apps/api/src/auth apps/api/src/app.ts apps/api/tests/auth.test.ts` then `git commit -m "feat(api): jwt auth with refresh rotation"`.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets (no `.env`). Never print credentials.
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- Exported contracts later tasks rely on: `authMiddleware` + `AuthUser` from `src/auth/middleware.ts`; default `auth` router from `src/auth/routes.ts`.
