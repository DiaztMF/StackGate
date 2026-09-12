import { Hono } from "hono";
import type { Context } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projectMembers, projects, states, tickets, users, workspaceMembers, workspaces } from "../db/schema.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, toPlaneUser, unauthorized } from "./routes.js";

type UserRow = typeof users.$inferSelect;
type WorkspaceRow = typeof workspaces.$inferSelect;

function roleNumber(role: UserRow["role"]): number {
  return role === "pm" ? 20 : 15;
}

function identifierFor(name: string): string {
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length > 1) return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "PRJ";
}

async function resolveWorkspace(c: Context): Promise<WorkspaceRow | null> {
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) return null;
  const [ws] = await db.select().from(workspaces).limit(1);
  return ws ?? null;
}

function toPlaneWorkspace(ws: WorkspaceRow, owner: ReturnType<typeof toPlaneUser>) {
  const at = ws.createdAt.toISOString();
  return {
    id: ws.id,
    owner,
    created_at: at,
    updated_at: at,
    name: ws.name,
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

function emptyViewProps() {
  return { rich_filters: [], display_filters: undefined, display_properties: {} };
}

// Workspace-scoped Plane endpoints under /api/workspaces/:slug. Plane-shaped (no envelope).
export const planeWorkspaces = new Hono();

planeWorkspaces.get("/:slug", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json(toPlaneWorkspace(ws, toPlaneUser(user)));
});

planeWorkspaces.get("/:slug/workspace-members/me", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);
  const now = new Date().toISOString();
  return c.json({
    company_role: null,
    created_at: now,
    created_by: user.id,
    default_props: emptyViewProps(),
    id: membership?.id ?? `${ws.id}:${user.id}`,
    member: user.id,
    role: membership ? roleNumber(membership.role) : roleNumber(user.role),
    updated_at: now,
    updated_by: user.id,
    view_props: emptyViewProps(),
    workspace: ws.id,
    draft_issue_count: 0,
  });
});

function toPlaneProject(
  p: typeof projects.$inferSelect,
  wsId: string,
  memberRole: number | null,
  ownerId: string,
) {
  const at = p.createdAt.toISOString();
  return {
    id: p.id,
    name: p.name,
    identifier: identifierFor(p.name),
    sort_order: null,
    logo_props: { in_use: "emoji", emoji: { value: "📁" } },
    member_role: memberRole,
    archived_at: null,
    workspace: wsId,
    cycle_view: true,
    issue_views_view: true,
    module_view: true,
    page_view: true,
    inbox_view: true,
    guest_view_all_features: false,
    project_lead: null,
    network: 0,
    created_at: at,
    updated_at: at,
    created_by: ownerId,
    updated_by: ownerId,
    description: "",
    is_favorite: false,
    members: [],
  };
}

async function listPlaneProjects(user: UserRow, ws: WorkspaceRow, ownerId: string) {
  const rows = await db.select().from(projects).where(eq(projects.workspaceId, ws.id));
  const memberships = await db.select().from(projectMembers).where(eq(projectMembers.userId, user.id));
  const roleByProject = new Map(memberships.map((m) => [m.projectId, roleNumber(m.role)]));
  return rows.map((p) => toPlaneProject(p, ws.id, roleByProject.get(p.id) ?? roleNumber(user.role), ownerId));
}

planeWorkspaces.get("/:slug/projects", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json(await listPlaneProjects(user, ws, user.id));
});

planeWorkspaces.get("/:slug/projects/:projectId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const projectId = c.req.param("projectId");
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
    .limit(1);
  return c.json(toPlaneProject(project, ws.id, membership ? roleNumber(membership.role) : roleNumber(user.role), user.id));
});

planeWorkspaces.get("/:slug/projects/:projectId/project-members/me", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const projectId = c.req.param("projectId");
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
    .limit(1);
  return c.json({
    id: membership?.id ?? `${projectId}:${user.id}`,
    member: user.id,
    role: membership ? roleNumber(membership.role) : roleNumber(user.role),
    original_role: membership ? roleNumber(membership.role) : roleNumber(user.role),
    created_at: new Date().toISOString(),
  });
});

planeWorkspaces.get("/:slug/projects/:projectId/states", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const projectId = c.req.param("projectId");
  const stateRows = await db.select().from(states).where(eq(states.projectId, projectId));
  const out = stateRows.map((s, i) => {
    const style = STATE_STYLE[s.key] ?? { group: "unstarted", color: "#d9d9d9" };
    return {
      id: s.id,
      color: style.color,
      default: s.key === "backlog",
      description: "",
      group: style.group,
      name: s.name,
      project_id: projectId,
      sequence: i,
      workspace_id: ws.id,
      order: i,
    };
  });
  return c.json(out);
});

planeWorkspaces.get("/:slug/projects/:projectId/members", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const allUsers = await db.select().from(users);
  return c.json(
    allUsers.map((u) => ({
      id: u.id,
      member: {
        avatar_url: "",
        display_name: u.name,
        email: u.email,
        first_name: u.name,
        id: u.id,
        is_bot: false,
        last_name: "",
      },
      role: roleNumber(u.role),
    })),
  );
});

planeWorkspaces.get("/:slug/projects/:projectId/issue-labels", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/projects/:projectId/user-properties", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({
    sort_order: 1,
    preferences: {
      pages: { block_display: true },
      navigation: { default_tab: "issues", hide_in_more_menu: [] },
    },
    rich_filters: [],
    display_filters: {},
    display_properties: {},
  });
});

planeWorkspaces.get("/:slug/projects/:projectId/views", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/projects/:projectId/cycles", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/projects/:projectId/modules", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/projects/:projectId/estimates", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/projects/:projectId/intake-state", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeWorkspaces.get("/:slug/modules", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

const STATE_STYLE: Record<string, { group: string; color: string }> = {
  backlog: { group: "backlog", color: "#d9d9d9" },
  "in-development": { group: "started", color: "#3f76ff" },
  review: { group: "started", color: "#ffbe33" },
  ready: { group: "completed", color: "#0e7c3e" },
};

planeWorkspaces.get("/:slug/states", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const projectRows = await db.select().from(projects).where(eq(projects.workspaceId, ws.id));
  const projectIds = new Set(projectRows.map((p) => p.id));
  const allStates = await db.select().from(states);
  const out: Array<{
    id: string;
    color: string;
    default: boolean;
    description: string;
    group: string;
    name: string;
    project_id: string;
    sequence: number;
    workspace_id: string;
    order: number;
  }> = [];
  for (const p of projectRows) {
    const stateRows = allStates.filter((s) => projectIds.has(s.projectId) && s.projectId === p.id);
    stateRows.forEach((s, i) => {
      const style = STATE_STYLE[s.key] ?? { group: "unstarted", color: "#d9d9d9" };
      out.push({
        id: s.id,
        color: style.color,
        default: s.key === "backlog",
        description: "",
        group: style.group,
        name: s.name,
        project_id: p.id,
        sequence: i,
        workspace_id: ws.id,
        order: i,
      });
    });
  }
  return c.json(out);
});

planeWorkspaces.get("/:slug/members", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const allUsers = await db.select().from(users);
  return c.json(
    allUsers.map((u) => ({
      id: u.id,
      member: {
        avatar_url: "",
        display_name: u.name,
        email: u.email,
        first_name: u.name,
        id: u.id,
        is_bot: false,
        last_name: "",
      },
      role: roleNumber(u.role),
    })),
  );
});

planeWorkspaces.get("/:slug/sidebar-preferences", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json({});
});

planeWorkspaces.get("/:slug/user-properties", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json({ rich_filters: [], display_filters: {}, display_properties: {} });
});

planeWorkspaces.get("/:slug/user-stats/:userId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const targetId = c.req.param("userId");
  const assigned = await db.select().from(tickets).where(eq(tickets.assigneeId, targetId));
  const created = await db.select().from(tickets).where(eq(tickets.reporterId, targetId));
  return c.json({
    assigned_issues: assigned.length,
    completed_issues: 0,
    created_issues: created.length,
    pending_issues: assigned.length,
    priority_distribution: [],
    state_distribution: [],
    subscribed_issues: 0,
  });
});

planeWorkspaces.get("/:slug/user-profile/:userId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const targetId = c.req.param("userId");
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!targetUser) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);
  return c.json({
    project_data: [],
    user_data: {
      avatar_url: "",
      cover_image_url: null,
      display_name: targetUser.name,
      first_name: targetUser.name,
      last_name: "",
      date_joined: targetUser.createdAt,
      user_timezone: "UTC",
    },
  });
});

planeWorkspaces.get("/:slug/user-activity/:userId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json({
    count: 0,
    extra_stats: null,
    next_cursor: "",
    next_page_results: false,
    prev_cursor: "",
    prev_page_results: false,
    results: [],
    total_pages: 1,
    total_results: 0,
  });
});

planeWorkspaces.get("/:slug/users/notifications/unread", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json({
    total_unread_notifications_count: 0,
    mention_unread_notifications_count: 0,
  });
});

planeWorkspaces.get("/:slug/home-preferences", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json([]);
});

planeWorkspaces.get("/:slug/user-favorites", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const ws = await resolveWorkspace(c);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  return c.json([]);
});

// Per-workspace project roles live under /api/users/me/workspaces/:slug.
export const planeUserWorkspaces = new Hono();

planeUserWorkspaces.get("/:slug/project-roles", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const projectRows = await db.select().from(projects).where(eq(projects.workspaceId, ws.id));
  const memberships = await db.select().from(projectMembers).where(eq(projectMembers.userId, user.id));
  const roleByProject = new Map(memberships.map((m) => [m.projectId, roleNumber(m.role)]));
  const out: Record<string, number> = {};
  for (const p of projectRows) out[p.id] = roleByProject.get(p.id) ?? roleNumber(user.role);
  return c.json(out);
});
