import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { refreshTokens, users } from "../db/schema.js";
import { verifyPassword } from "../auth/password.js";
import { hashRefreshToken, newRefreshToken, verifyAccess } from "../auth/tokens.js";
import { invalidJson, readJson } from "../http.js";

const REFRESH_DAYS = 7;
const DEMO_WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_WORKSPACE_SLUG = "stackgate";

type UserRow = typeof users.$inferSelect;

function refreshCookieOptions(): {
  httpOnly: true;
  path: string;
  maxAge: number;
  sameSite: "None" | "Lax";
  secure: boolean;
} {
  const crossSite = process.env.COOKIE_CROSS_SITE === "1";
  return {
    httpOnly: true,
    path: "/",
    maxAge: REFRESH_DAYS * 86400,
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite,
  };
}

function toPlaneUser(u: UserRow) {
  const username = u.email.includes("@") ? u.email.split("@")[0] : u.email;
  return {
    id: u.id,
    email: u.email,
    first_name: u.name,
    last_name: "",
    display_name: u.name,
    avatar_url: "",
    is_bot: false,
    cover_image_url: null,
    date_joined: u.createdAt.toISOString(),
    is_active: true,
    is_email_verified: true,
    is_password_autoset: false,
    is_tour_completed: true,
    mobile_number: null,
    last_workspace_id: DEMO_WORKSPACE_ID,
    user_timezone: "UTC",
    username,
    last_login_medium: "email",
    theme: { theme: "system" },
  };
}

function demoWorkspace(owner: ReturnType<typeof toPlaneUser>) {
  const now = new Date().toISOString();
  return {
    id: DEMO_WORKSPACE_ID,
    owner,
    created_at: now,
    updated_at: now,
    name: "StackGate",
    url: "",
    logo_url: null,
    total_members: 1,
    slug: DEMO_WORKSPACE_SLUG,
    created_by: owner.id,
    updated_by: owner.id,
    organization_size: "1-10",
    role: 20,
    timezone: "UTC",
  };
}

async function resolvePlaneUser(c: Context): Promise<UserRow | null> {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = await verifyAccess(token);
      const [row] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      if (row) return row;
    } catch {
      // fall through to cookie
    }
  }
  const presented = getCookie(c, "sg_refresh");
  if (!presented) return null;
  const [link] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hashRefreshToken(presented)),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!link) return null;
  const [row] = await db.select().from(users).where(eq(users.id, link.userId)).limit(1);
  return row ?? null;
}

function unauthorized(c: Context) {
  return c.json({ error: { code: "UNAUTHORIZED", message: "Sesi berakhir, silakan login kembali" } }, 401);
}

// Plane web calls /auth/* without the /api prefix (Django layout).
// Responses here are Plane-shaped (no {data} envelope).
export const planeAuth = new Hono();

planeAuth.get("/get-csrf-token", (c) => c.json({ csrf_token: "stackgate" }));

planeAuth.post("/email-check", async (c) => {
  const parsed = await readJson<{ email?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const email = parsed.body.email?.trim() ?? "";
  if (!email) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email wajib diisi" } }, 400);
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return c.json({ existing: !!user, status: "CREDENTIAL", is_password_autoset: false });
});

planeAuth.post("/magic-generate", (c) =>
  c.json({ error: { code: "VALIDATION_ERROR", message: "Login kode unik belum didukung" } }, 400),
);

planeAuth.post("/forgot-password", (c) =>
  c.json({ error: { code: "VALIDATION_ERROR", message: "Reset password belum didukung" } }, 400),
);

planeAuth.post("/set-password", (c) =>
  c.json({ error: { code: "VALIDATION_ERROR", message: "Reset password belum didukung" } }, 400),
);

planeAuth.post("/sign-up", (c) =>
  c.json({ error: { code: "VALIDATION_ERROR", message: "Pendaftaran akun baru dimatikan, hubungi admin" } }, 403),
);

planeAuth.post("/sign-in", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  let email = "";
  let password = "";
  let nextPath = "";
  let wantsJson = false;
  if (contentType.includes("application/json")) {
    wantsJson = true;
    const parsed = await readJson<{ email?: string; password?: string; next_path?: string }>(c);
    if (!parsed.ok) return invalidJson(c);
    email = parsed.body.email?.trim() ?? "";
    password = parsed.body.password ?? "";
    nextPath = parsed.body.next_path ?? "";
  } else {
    const body = await c.req.parseBody();
    email = String(body["email"] ?? "").trim();
    password = String(body["password"] ?? "");
    nextPath = String(body["next_path"] ?? "");
  }
  if (!email || !password) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email dan password wajib diisi" } }, 400);
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } }, 401);
  }
  const { token, tokenHash } = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
  });
  setCookie(c, "sg_refresh", token, refreshCookieOptions());
  if (wantsJson) return c.json(toPlaneUser(user));
  const base = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",")[0].trim();
  const target = nextPath.startsWith("/") ? `${base}${nextPath}` : base;
  return c.redirect(target, 302);
});

// Plane web identity endpoints under /api/users/me/*. Plane-shaped (no envelope).
export const planeUsers = new Hono();

planeUsers.get("/me", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json(toPlaneUser(user));
});

planeUsers.get("/me/profile", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const now = new Date().toISOString();
  return c.json({
    id: user.id,
    user: user.id,
    role: user.role,
    last_workspace_id: DEMO_WORKSPACE_ID,
    theme: { theme: "system" },
    onboarding_step: {
      profile_complete: true,
      workspace_create: true,
      workspace_invite: true,
      workspace_join: true,
    },
    is_onboarded: true,
    is_tour_completed: true,
    language: "en",
    created_at: now,
    updated_at: now,
    start_of_the_week: 1,
  });
});

planeUsers.get("/me/settings", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({
    id: user.id,
    email: user.email,
    workspace: {
      last_workspace_id: DEMO_WORKSPACE_ID,
      last_workspace_slug: DEMO_WORKSPACE_SLUG,
      last_workspace_name: "StackGate",
      fallback_workspace_id: DEMO_WORKSPACE_ID,
      fallback_workspace_slug: DEMO_WORKSPACE_SLUG,
      invites: 0,
    },
  });
});

planeUsers.get("/me/workspaces", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([demoWorkspace(toPlaneUser(user))]);
});

planeUsers.get("/me/accounts", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeUsers.get("/me/instance-admin", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({ is_instance_admin: user.role === "pm" });
});

planeUsers.patch("/me/onboard", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({ is_onboarded: true });
});

planeUsers.patch("/me/tour-completed", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({ is_tour_completed: true });
});
