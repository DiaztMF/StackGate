import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projects, tickets } from "../db/schema.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, unauthorized } from "./routes.js";

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
