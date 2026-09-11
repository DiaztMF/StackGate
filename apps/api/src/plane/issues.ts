import { Hono } from "hono";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, unauthorized } from "./routes.js";

export const planeIssues = new Hono();

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
