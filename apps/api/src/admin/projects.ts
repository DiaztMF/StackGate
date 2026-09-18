import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projectMembers, projects, users, workspaces } from "../db/schema.js";
import { invalidJson, readJson } from "../http.js";
import { createDefaultProjectStates } from "../plane/workspaces.js";
import { requireSuperadmin } from "./guard.js";

const adminProjects = new Hono();

function publicProject(p: typeof projects.$inferSelect, memberCount: number) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    memberCount,
  };
}

adminProjects.get("/projects", requireSuperadmin, async (c) => {
  const [rows, memberRows] = await Promise.all([
    db.select().from(projects),
    db.select({ projectId: projectMembers.projectId }).from(projectMembers),
  ]);
  const countByProject = new Map<string, number>();
  for (const m of memberRows) countByProject.set(m.projectId, (countByProject.get(m.projectId) ?? 0) + 1);
  return c.json({ data: { projects: rows.map((p) => publicProject(p, countByProject.get(p.id) ?? 0)) } });
});

adminProjects.post("/projects", requireSuperadmin, async (c) => {
  const parsed = await readJson<{ name?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const name = parsed.body.name?.trim();
  if (!name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama proyek wajib diisi" } }, 400);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace belum ada" } }, 404);

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `project-${Date.now()}`;

  const [created] = await db.insert(projects).values({ workspaceId: ws.id, name, slug }).returning();
  await createDefaultProjectStates(created.id);
  // Superadmin manages every project without needing to be a member of it —
  // no projectMembers row is created here, unlike the Plane-compat endpoint.
  return c.json({ data: { project: publicProject(created, 0) } }, 201);
});

adminProjects.patch("/projects/:id", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!existing) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);

  const parsed = await readJson<{ name?: string; archived?: boolean }>(c);
  if (!parsed.ok) return invalidJson(c);

  const updates: Partial<typeof projects.$inferInsert> = {};
  if (parsed.body.name !== undefined) {
    const trimmed = parsed.body.name.trim();
    if (!trimmed) return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama proyek tidak boleh kosong" } }, 400);
    updates.name = trimmed;
  }
  if (typeof parsed.body.archived === "boolean") {
    updates.archivedAt = parsed.body.archived ? new Date() : null;
  }

  if (Object.keys(updates).length === 0) {
    const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    return c.json({ data: { project: publicProject(existing, memberRows.length) } });
  }
  const [updated] = await db.update(projects).set(updates).where(eq(projects.id, projectId)).returning();
  const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
  return c.json({ data: { project: publicProject(updated, memberRows.length) } });
});

const VALID_MEMBER_ROLES = ["student", "lead", "pm", "superadmin"] as const;
type TMemberRole = (typeof VALID_MEMBER_ROLES)[number];

function isValidMemberRole(value: unknown): value is TMemberRole {
  return typeof value === "string" && (VALID_MEMBER_ROLES as readonly string[]).includes(value);
}

adminProjects.get("/projects/:id/members", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const rows = await db
    .select({ id: projectMembers.id, userId: projectMembers.userId, role: projectMembers.role })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const allUsers = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);
  const userById = new Map(allUsers.map((u) => [u.id, u]));
  return c.json({
    data: {
      members: rows.map((r) => ({
        userId: r.userId,
        role: r.role,
        email: userById.get(r.userId)?.email ?? "",
        name: userById.get(r.userId)?.name ?? "",
      })),
    },
  });
});

adminProjects.post("/projects/:id/members", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);

  const parsed = await readJson<{ userId?: string; role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  if (!parsed.body.userId || !isValidMemberRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "userId dan role wajib diisi dengan benar" } }, 400);
  }
  const [targetUser] = await db.select().from(users).where(eq(users.id, parsed.body.userId)).limit(1);
  if (!targetUser) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const [existingMembership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, parsed.body.userId)))
    .limit(1);
  if (existingMembership) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Sudah menjadi anggota proyek ini" } }, 400);
  }

  await db.insert(projectMembers).values({ projectId, userId: parsed.body.userId, role: parsed.body.role });
  return c.json(
    { data: { member: { userId: targetUser.id, role: parsed.body.role, email: targetUser.email, name: targetUser.name } } },
    201,
  );
});

adminProjects.patch("/projects/:id/members/:userId", requireSuperadmin, async (c) => {
  const { id: projectId, userId } = c.req.param();
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  if (!membership) return c.json({ error: { code: "NOT_FOUND", message: "Keanggotaan tidak ditemukan" } }, 404);

  const parsed = await readJson<{ role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  if (!isValidMemberRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
  }
  await db.update(projectMembers).set({ role: parsed.body.role }).where(eq(projectMembers.id, membership.id));
  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return c.json({ data: { member: { userId, role: parsed.body.role, email: targetUser?.email ?? "", name: targetUser?.name ?? "" } } });
});

adminProjects.delete("/projects/:id/members/:userId", requireSuperadmin, async (c) => {
  const { id: projectId, userId } = c.req.param();
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return c.json({ data: { ok: true } });
});

export default adminProjects;
