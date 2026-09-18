import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projectMembers, projects, workspaces } from "../db/schema.js";
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

export default adminProjects;
