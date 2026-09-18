import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { invalidJson, readJson } from "../http.js";
import { requireSuperadmin } from "./guard.js";
import type { AuthUser } from "../auth/middleware.js";

const adminUsers = new Hono<{ Variables: { user: AuthUser } }>();

const VALID_ROLES = ["student", "lead", "pm", "superadmin"] as const;
type TAdminRole = (typeof VALID_ROLES)[number];

function isValidRole(value: unknown): value is TAdminRole {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

function publicUser(u: typeof users.$inferSelect) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive, createdAt: u.createdAt };
}

adminUsers.get("/users", requireSuperadmin, async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json({ data: { users: rows } });
});

adminUsers.post("/users", requireSuperadmin, async (c) => {
  const parsed = await readJson<{ email?: string; name?: string; password?: string; role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const email = parsed.body.email?.trim();
  const name = parsed.body.name?.trim();
  const password = parsed.body.password ?? "";
  if (!email || !name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email dan nama wajib diisi" } }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Password minimal 8 karakter" } }, 400);
  }
  if (!isValidRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email sudah terdaftar" } }, 400);
  }
  const [created] = await db
    .insert(users)
    .values({ email, name, role: parsed.body.role, passwordHash: await hashPassword(password) })
    .returning();
  return c.json({ data: { user: publicUser(created) } }, 201);
});

async function isLastActiveSuperadmin(userId: string): Promise<boolean> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "superadmin"), eq(users.isActive, true)));
  return admins.length <= 1 && admins.some((a) => a.id === userId);
}

adminUsers.patch("/users/:id", requireSuperadmin, async (c) => {
  const actor = c.get("user");
  const targetId = c.req.param("id");
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const parsed = await readJson<{ role?: string; isActive?: boolean; name?: string }>(c);
  if (!parsed.ok) return invalidJson(c);

  const updates: Partial<typeof users.$inferInsert> = {};
  if (parsed.body.role !== undefined) {
    if (!isValidRole(parsed.body.role)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
    }
    updates.role = parsed.body.role;
  }
  if (typeof parsed.body.isActive === "boolean") {
    updates.isActive = parsed.body.isActive;
  }
  if (parsed.body.name !== undefined) {
    const trimmed = parsed.body.name.trim();
    if (!trimmed) return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama tidak boleh kosong" } }, 400);
    updates.name = trimmed;
  }

  const losesSuperadmin = (updates.role !== undefined && updates.role !== "superadmin") || updates.isActive === false;
  if (targetId === actor.id && losesSuperadmin && (await isLastActiveSuperadmin(targetId))) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Tidak bisa menurunkan superadmin aktif terakhir" } },
      422,
    );
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ data: { user: publicUser(target) } });
  }
  const [updated] = await db.update(users).set(updates).where(eq(users.id, targetId)).returning();
  return c.json({ data: { user: publicUser(updated) } });
});

adminUsers.post("/users/:id/reset-password", requireSuperadmin, async (c) => {
  const targetId = c.req.param("id");
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const parsed = await readJson<{ password?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const password = parsed.body.password ?? "";
  if (password.length < 8) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Password minimal 8 karakter" } }, 400);
  }
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, targetId));
  return c.json({ data: { ok: true } });
});

export default adminUsers;
