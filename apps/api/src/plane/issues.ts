import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projects, states, ticketTransitions, tickets } from "../db/schema.js";
import { invalidJson, readJson } from "../http.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, unauthorized } from "./routes.js";
import { checkTransition } from "../tickets/guard.js";

export const planeIssues = new Hono();

export function toBaseIssue(t: typeof tickets.$inferSelect, seq: number) {
  return {
    id: t.id,
    sequence_id: seq,
    name: t.title,
    sort_order: 65535,
    state_id: t.stateId,
    priority: "none",
    label_ids: [],
    assignee_ids: t.assigneeId ? [t.assigneeId] : [],
    estimate_point: null,
    sub_issues_count: 0,
    attachment_count: 0,
    link_count: 0,
    project_id: t.projectId,
    parent_id: null,
    cycle_id: null,
    module_ids: [],
    type_id: null,
    created_at: t.createdAt.toISOString(),
    updated_at: t.createdAt.toISOString(),
    start_date: null,
    target_date: null,
    completed_at: null,
    archived_at: null,
    created_by: t.reporterId ?? "",
    updated_by: t.reporterId ?? "",
    is_draft: false,
    description_html: "<p>" + (t.description || "") + "</p>",
  };
}

planeIssues.get("/:slug/projects/:projectId/issue-display-properties", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  return c.json({
    properties: {
      assignee: true,
      start_date: true,
      due_date: true,
      labels: true,
      key: true,
      priority: true,
      state: true,
      sub_issue_count: false,
      attachment_count: false,
      link_count: false,
      estimate: false,
    },
  });
});

planeIssues.get("/:slug/projects/:projectId/issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return c.json({ error: { code: "NOT_FOUND", message: "Project tidak ditemukan" } }, 404);
  }
  const ticketRows = await db.select().from(tickets).where(eq(tickets.projectId, projectId));
  const results = ticketRows.map((t, idx) => toBaseIssue(t, idx + 1));
  return c.json({
    results,
    total_results: results.length,
    total_count: results.length,
    count: results.length,
    grouped_by: null,
    next_cursor: "",
    prev_cursor: "",
    next_page_results: false,
    prev_page_results: false,
    total_pages: 1,
    extra_stats: null,
  });
});

planeIssues.post("/:slug/projects/:projectId/issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }

  const parsed = await readJson<{ name?: string; description_html?: string; assignee_ids?: string[] }>(c);
  if (!parsed.ok) return invalidJson(c);

  const name = parsed.body.name?.trim();
  if (!name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
  }

  const projectId = c.req.param("projectId");
  const projectStates = await db.select().from(states).where(eq(states.projectId, projectId));
  const backlog = projectStates.find((s) => s.key === "backlog");
  if (!backlog) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog tidak ditemukan" } }, 400);
  }

  const assigneeId = parsed.body.assignee_ids?.[0] ?? null;
  const description = parsed.body.description_html?.replace(/<[^>]*>/g, "").trim() ?? "";

  const [row] = await db
    .insert(tickets)
    .values({
      projectId,
      stateId: backlog.id,
      title: name,
      description,
      assigneeId,
      reporterId: user.id,
      researchRequired: false,
    })
    .returning();

  await db.insert(ticketTransitions).values({
    ticketId: row.id,
    fromStateId: null,
    toStateId: backlog.id,
    actorId: user.id,
  });

  return c.json(toBaseIssue(row, 1), 201);
});

planeIssues.patch("/:slug/projects/:projectId/issues/:issueId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }

  const issueId = c.req.param("issueId");
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket) {
    return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  }

  const parsed = await readJson<{
    state_id?: string;
    name?: string;
    description_html?: string;
    assignee_ids?: string[];
  }>(c);
  if (!parsed.ok) return invalidJson(c);

  const updates: Partial<typeof tickets.$inferInsert> = {};
  if (parsed.body.name) updates.title = parsed.body.name.trim();
  if (parsed.body.description_html !== undefined) {
    updates.description = parsed.body.description_html.replace(/<[^>]*>/g, "").trim();
  }
  if (parsed.body.assignee_ids !== undefined) {
    updates.assigneeId = parsed.body.assignee_ids[0] ?? null;
  }

  if (parsed.body.state_id && parsed.body.state_id !== ticket.stateId) {
    const [targetState] = await db.select().from(states).where(eq(states.id, parsed.body.state_id)).limit(1);
    if (!targetState) {
      return c.json({ error: { code: "NOT_FOUND", message: "State tidak ditemukan" } }, 404);
    }
    const guardResult = await checkTransition(ticket.id, targetState.key, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    if (!guardResult.ok) {
      return c.json({ error: { code: guardResult.code, message: guardResult.message } }, guardResult.status);
    }
    updates.stateId = targetState.id;
    await db.insert(ticketTransitions).values({
      ticketId: ticket.id,
      fromStateId: ticket.stateId,
      toStateId: targetState.id,
      actorId: user.id,
    });
  }

  const [updated] = await db.update(tickets).set(updates).where(eq(tickets.id, issueId)).returning();
  return c.json(toBaseIssue(updated, 1));
});
