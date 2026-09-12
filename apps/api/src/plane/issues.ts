import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  comments,
  gateCheckItems,
  projects,
  researchLinks,
  states,
  ticketTransitions,
  tickets,
  users,
} from "../db/schema.js";
import { invalidJson, readJson } from "../http.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, unauthorized } from "./routes.js";
import { checkTransition } from "../tickets/guard.js";

export const planeIssues = new Hono();

const DEFAULT_GATE_ITEMS = [
  "Kode berjalan sesuai acceptance tiket",
  "Tidak ada secret / API key ter-commit",
  "Mengikuti modul riset yang ditautkan",
  "Sudah self-test oleh pelaksana",
];

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

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/meta", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({
    project_id: c.req.param("projectId"),
    workspace_id: DEMO_WORKSPACE_SLUG,
  });
});

planeIssues.get("/:slug/projects/:projectId/issues/:issueId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const issueId = c.req.param("issueId");
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  return c.json(toBaseIssue(ticket, 1));
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

  const assigneeId = parsed.body.assignee_ids?.[0] ?? user.id;
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

  await Promise.all(
    DEFAULT_GATE_ITEMS.map((label) =>
      db.insert(gateCheckItems).values({ ticketId: row.id, label })
    )
  );

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
    research_required?: boolean;
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
  if (typeof parsed.body.research_required === "boolean") {
    updates.researchRequired = parsed.body.research_required;
  }

  if (parsed.body.state_id && parsed.body.state_id !== ticket.stateId) {
    const [targetState] = await db.select().from(states).where(eq(states.id, parsed.body.state_id)).limit(1);
    if (!targetState) {
      return c.json({ error: { code: "NOT_FOUND", message: "State tidak ditemukan" } }, 404);
    }
    // If ticket was just updated in the same request (e.g. researchRequired or assigneeId),
    // persist updates first before checking transitions, or update ticket record.
    if (Object.keys(updates).length > 0) {
      await db.update(tickets).set(updates).where(eq(tickets.id, issueId));
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

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/gate-checks", async (c) => {
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

  const rows = await db
    .select({
      id: gateCheckItems.id,
      ticketId: gateCheckItems.ticketId,
      label: gateCheckItems.label,
      checkedAt: gateCheckItems.checkedAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(gateCheckItems)
    .leftJoin(users, eq(gateCheckItems.checkedById, users.id))
    .where(eq(gateCheckItems.ticketId, issueId));

  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      ticket_id: r.ticketId,
      label: r.label,
      checked: !!r.checkedAt,
      checked_by: r.userId
        ? {
            id: r.userId,
            name: r.userName,
            email: r.userEmail,
          }
        : null,
      checked_at: r.checkedAt?.toISOString() ?? null,
    })),
  });
});

planeIssues.post("/:slug/projects/:projectId/issues/:issueId/gate-checks", async (c) => {
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

  if (user.role === "student") {
    return c.json(
      {
        error: {
          code: "FORBIDDEN_TRANSITION",
          message: "Hanya lead dan PM yang dapat menambah kriteria mutu",
        },
      },
      403
    );
  }

  const parsed = await readJson<{ label?: string }>(c);
  if (!parsed.ok) return invalidJson(c);

  const label = parsed.body.label?.trim();
  if (!label) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Label kriteria mutu wajib diisi" } }, 400);
  }

  const [created] = await db
    .insert(gateCheckItems)
    .values({
      ticketId: issueId,
      label,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      ticket_id: created.ticketId,
      label: created.label,
      checked: false,
      checked_by: null,
      checked_at: null,
    },
    201
  );
});

planeIssues.patch("/:slug/projects/:projectId/issues/:issueId/gate-checks/:checkId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }

  const issueId = c.req.param("issueId");
  const checkId = c.req.param("checkId");

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket) {
    return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  }

  const [checkItem] = await db
    .select()
    .from(gateCheckItems)
    .where(eq(gateCheckItems.id, checkId))
    .limit(1);
  if (!checkItem || checkItem.ticketId !== issueId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Kriteria mutu tidak ditemukan" } }, 404);
  }

  if (user.role !== "lead") {
    return c.json(
      {
        error: {
          code: "FORBIDDEN_TRANSITION",
          message: "Hanya lead developer yang dapat memvalidasi checklist mutu",
        },
      },
      403
    );
  }

  const parsed = await readJson<{ checked?: boolean }>(c);
  if (!parsed.ok || typeof parsed.body.checked !== "boolean") return invalidJson(c);

  const checked = parsed.body.checked;
  const [updated] = await db
    .update(gateCheckItems)
    .set({
      checkedById: checked ? user.id : null,
      checkedAt: checked ? new Date() : null,
    })
    .where(eq(gateCheckItems.id, checkId))
    .returning();

  return c.json({
    id: updated.id,
    ticket_id: updated.ticketId,
    label: updated.label,
    checked: !!updated.checkedAt,
    checked_by: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    checked_at: updated.checkedAt ? updated.checkedAt.toISOString() : null,
  });
});

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/history", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const activityType = c.req.query("activity_type") ?? "";
  if (activityType === "issue-comment" || activityType === "epic-comment") {
    const issueId = c.req.param("issueId");
    const rows = await db
      .select({ comment: comments, author: users })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.ticketId, issueId));
    return c.json(
      rows.map((r) =>
        toPlaneComment(r.comment, r.author ?? user, {
          slug: c.req.param("slug"),
          projectId: c.req.param("projectId"),
          issueId,
        }),
      ),
    );
  }
  return c.json([]);
});

function toPlaneComment(
  row: typeof comments.$inferSelect,
  author: typeof users.$inferSelect,
  scope: { slug: string; projectId: string; issueId: string },
) {
  const at = row.createdAt.toISOString();
  return {
    id: row.id,
    workspace: scope.slug,
    workspace_detail: { name: "StackGate", slug: scope.slug, id: scope.slug },
    project: scope.projectId,
    project_detail: {
      id: scope.projectId,
      identifier: "",
      name: "",
      cover_image: "",
      description: null,
      emoji: null,
      icon_prop: null,
    },
    issue: scope.issueId,
    issue_detail: {
      id: scope.issueId,
      sequence_id: 0,
      sort_order: false,
      name: "",
      description_html: "",
      priority: "none",
      start_date: "",
      target_date: "",
      is_draft: false,
    },
    actor: author.id,
    actor_detail: {
      id: author.id,
      first_name: author.name,
      last_name: "",
      avatar_url: "",
      is_bot: false,
      display_name: author.name,
    },
    created_at: at,
    updated_at: at,
    created_by: row.authorId,
    updated_by: row.authorId,
    attachments: [],
    comment_reactions: [],
    comment_stripped: row.body,
    comment_html: `<p>${row.body}</p>`,
    comment_json: null,
    external_id: undefined,
    external_source: undefined,
    access: "DEFAULT",
  };
}

function extractCommentText(body: { comment_stripped?: string; comment_html?: string }): string {
  if (body.comment_stripped?.trim()) return body.comment_stripped.trim();
  const stripped = body.comment_html?.replace(/<[^>]*>/g, "").trim() ?? "";
  return stripped;
}

planeIssues.post("/:slug/projects/:projectId/issues/:issueId/comments", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const issueId = c.req.param("issueId");
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket || ticket.projectId !== projectId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  }
  const parsed = await readJson<{ comment_html?: string; comment_stripped?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const text = extractCommentText(parsed.body);
  if (!text) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
  }
  const [row] = await db.insert(comments).values({ ticketId: issueId, authorId: user.id, body: text }).returning();
  return c.json(toPlaneComment(row, user, { slug: c.req.param("slug"), projectId, issueId }), 201);
});

planeIssues.patch("/:slug/projects/:projectId/issues/:issueId/comments/:commentId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const issueId = c.req.param("issueId");
  const commentId = c.req.param("commentId");
  const [row] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!row || row.ticketId !== issueId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Komentar tidak ditemukan" } }, 404);
  }
  if (row.authorId !== user.id && user.role !== "lead" && user.role !== "pm") {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya penulis, lead, atau PM yang boleh mengubah komentar" } }, 403);
  }
  const parsed = await readJson<{ comment_html?: string; comment_stripped?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const text = extractCommentText(parsed.body);
  if (!text) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
  }
  const [updated] = await db.update(comments).set({ body: text }).where(eq(comments.id, commentId)).returning();
  return c.json(
    toPlaneComment(updated, user, { slug: c.req.param("slug"), projectId: c.req.param("projectId"), issueId }),
  );
});

planeIssues.delete("/:slug/projects/:projectId/issues/:issueId/comments/:commentId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const issueId = c.req.param("issueId");
  const commentId = c.req.param("commentId");
  const [row] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!row || row.ticketId !== issueId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Komentar tidak ditemukan" } }, 404);
  }
  if (row.authorId !== user.id && user.role !== "lead" && user.role !== "pm") {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya penulis, lead, atau PM yang boleh menghapus komentar" } }, 403);
  }
  await db.delete(comments).where(eq(comments.id, commentId));
  return c.json({ ok: true });
});

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/issue-relation", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/sub-issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeIssues.get("/:slug/projects/:projectId/work-items/:issueId/description-versions", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json([]);
});

planeIssues.get("/:slug/projects/:projectId/issues/:issueId/research-links", async (c) => {
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

  const rows = await db
    .select({
      id: researchLinks.id,
      ticketId: researchLinks.ticketId,
      label: researchLinks.label,
      url: researchLinks.url,
      required: researchLinks.required,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
    })
    .from(researchLinks)
    .leftJoin(users, eq(researchLinks.createdById, users.id))
    .where(eq(researchLinks.ticketId, issueId));

  return c.json({
    research_required: ticket.researchRequired,
    links: rows.map((r) => ({
      id: r.id,
      ticket_id: r.ticketId,
      label: r.label,
      url: r.url,
      required: r.required,
      created_by: r.userId
        ? {
            id: r.userId,
            name: r.userName,
            email: r.userEmail,
          }
        : null,
    })),
  });
});

planeIssues.post("/:slug/projects/:projectId/issues/:issueId/research-links", async (c) => {
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

  const parsed = await readJson<{ url?: string; label?: string; required?: boolean }>(c);
  if (!parsed.ok) return invalidJson(c);

  const url = parsed.body.url?.trim();
  const label = parsed.body.label?.trim();
  if (!url || !label) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "URL dan label tautan riset wajib diisi" } }, 400);
  }

  const [created] = await db
    .insert(researchLinks)
    .values({
      ticketId: issueId,
      url,
      label,
      required: !!parsed.body.required,
      createdById: user.id,
    })
    .returning();

  return c.json(
    {
      id: created.id,
      ticket_id: created.ticketId,
      label: created.label,
      url: created.url,
      required: created.required,
      created_by: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    201
  );
});

planeIssues.delete("/:slug/projects/:projectId/issues/:issueId/research-links/:linkId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }

  const issueId = c.req.param("issueId");
  const linkId = c.req.param("linkId");

  const [link] = await db.select().from(researchLinks).where(eq(researchLinks.id, linkId)).limit(1);
  if (!link || link.ticketId !== issueId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Tautan riset tidak ditemukan" } }, 404);
  }

  await db.delete(researchLinks).where(eq(researchLinks.id, linkId));
  return c.json({ ok: true });
});
