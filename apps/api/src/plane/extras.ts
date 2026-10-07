import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, workspaceInvitations, workspaceMembers, workspaces } from "../db/schema.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, toPlaneUser, unauthorized, workspaceRoleNumber } from "./routes.js";
import { invalidJson, readJson } from "../http.js";

type UserRow = typeof users.$inferSelect;

function roleFromNumber(value: unknown): UserRow["role"] {
  if (value === 20 || value === "admin") return "pm";
  if (value === 15 || value === "member") return "lead";
  return "student";
}

async function viewerWorkspaceRole(user: UserRow, workspaceId: string): Promise<number> {
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);
  return workspaceRoleNumber(membership ? membership.role : user.role);
}

function toPlaneInvitation(
  row: typeof workspaceInvitations.$inferSelect,
  ws: { id: string; name: string },
) {
  const base = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",")[0].trim();
  return {
    accepted: row.accepted,
    email: row.email,
    id: row.id,
    message: "",
    responded_at: row.respondedAt ? row.respondedAt.toISOString() : null,
    role: workspaceRoleNumber(row.role),
    token: row.token,
    invite_link: `${base}/invitations/`,
    workspace: { id: ws.id, logo_url: "", name: ws.name, slug: DEMO_WORKSPACE_SLUG },
  };
}

async function processInvite(
  workspaceId: string,
  workspaceName: string,
  inviterId: string,
  item: { email: string; role: UserRow["role"] },
) {
  const scope = { id: workspaceId, name: workspaceName };
  const [existingUser] = await db.select().from(users).where(eq(users.email, item.email)).limit(1);
  if (existingUser) {
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, existingUser.id)))
      .limit(1);
    if (!membership) {
      await db.insert(workspaceMembers).values({ workspaceId, userId: existingUser.id, role: item.role });
    }
    return {
      accepted: true,
      email: item.email,
      id: membership?.id ?? existingUser.id,
      message: "",
      responded_at: new Date().toISOString(),
      role: workspaceRoleNumber(item.role),
      token: "",
      invite_link: "",
      workspace: { id: scope.id, logo_url: "", name: scope.name, slug: DEMO_WORKSPACE_SLUG },
    };
  }
  const [pending] = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.email, item.email),
        eq(workspaceInvitations.accepted, false),
      ),
    )
    .limit(1);
  if (pending) {
    const [updated] = await db
      .update(workspaceInvitations)
      .set({ role: item.role })
      .where(eq(workspaceInvitations.id, pending.id))
      .returning();
    return toPlaneInvitation(updated, scope);
  }
  const [row] = await db
    .insert(workspaceInvitations)
    .values({
      workspaceId,
      email: item.email,
      role: item.role,
      token: randomBytes(24).toString("hex"),
      createdById: inviterId,
    })
    .returning();
  return toPlaneInvitation(row, scope);
}

export const workspaceExtras = new Hono();

workspaceExtras.get("/:slug/invitations", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.workspaceId, ws.id), eq(workspaceInvitations.accepted, false)));
  return c.json(rows.map((r) => toPlaneInvitation(r, ws)));
});

workspaceExtras.post("/:slug/invitations", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  if ((await viewerWorkspaceRole(user, ws.id)) < 15) {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya anggota workspace yang boleh mengundang" } }, 403);
  }
  const parsed = await readJson<{ emails?: Array<{ email?: string; role?: number | string }> }>(c);
  if (!parsed.ok) return invalidJson(c);
  const entries = parsed.body.emails ?? [];
  if (entries.length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Daftar email undangan wajib diisi" } }, 400);
  }
  const normalized = entries.map((entry) => ({
    email: entry.email?.trim().toLowerCase() ?? "",
    role: roleFromNumber(entry.role),
    raw: entry.email ?? "",
  }));
  const invalid = normalized.find((e) => !e.email || !e.email.includes("@"));
  if (invalid) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Email tidak valid: ${invalid.raw}` } }, 400);
  }
  const created = await Promise.all(normalized.map((item) => processInvite(ws.id, ws.name, user.id, item)));
  return c.json(created, 201);
});

workspaceExtras.delete("/:slug/invitations/:invitationId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  if ((await viewerWorkspaceRole(user, ws.id)) < 15) {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya anggota workspace yang boleh membatalkan undangan" } }, 403);
  }
  const [row] = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.id, c.req.param("invitationId")))
    .limit(1);
  if (!row || row.workspaceId !== ws.id) {
    return c.json({ error: { code: "NOT_FOUND", message: "Undangan tidak ditemukan" } }, 404);
  }
  await db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, row.id));
  return c.json({ ok: true });
});
export const inviteAcceptApi = new Hono();

inviteAcceptApi.get("/", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json([]);
  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, ws.id),
        eq(workspaceInvitations.email, user.email.toLowerCase()),
        eq(workspaceInvitations.accepted, false)
      )
    );
  return c.json(rows.map((r) => toPlaneInvitation(r, ws)));
});

inviteAcceptApi.post("/", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  const parsed = await readJson<{ invitations?: string[] }>(c);
  if (!parsed.ok) return invalidJson(c);
  const ids = parsed.body.invitations ?? [];
  if (ids.length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Pilih minimal satu undangan" } }, 400);
  }
  const accepted = await Promise.all(
    ids.map(async (id) => {
      const [row] = await db.select().from(workspaceInvitations).where(eq(workspaceInvitations.id, id)).limit(1);
      if (!row || row.accepted || row.email.toLowerCase() !== user.email.toLowerCase()) return null;
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, user.id)))
        .limit(1);
      if (!membership) {
        await db.insert(workspaceMembers).values({ workspaceId: ws.id, userId: user.id, role: row.role });
      }
      const [done] = await db
        .update(workspaceInvitations)
        .set({ accepted: true, respondedAt: new Date() })
        .where(eq(workspaceInvitations.id, row.id))
        .returning();
      return toPlaneInvitation(done, ws);
    })
  );
  return c.json(accepted.filter((a) => a !== null));
});

workspaceExtras.patch("/:slug", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  if ((await viewerWorkspaceRole(user, ws.id)) < 20) {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya admin workspace yang boleh mengubah pengaturan" } }, 403);
  }
  const parsed = await readJson<{ name?: string; timezone?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const name = parsed.body.name?.trim() ?? "";
  if (!name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama workspace wajib diisi" } }, 400);
  }
  const timezone = parsed.body.timezone?.trim() || ws.timezone;
  const [updated] = await db
    .update(workspaces)
    .set({ name, timezone })
    .where(eq(workspaces.id, ws.id))
    .returning();
  const at = updated.createdAt.toISOString();
  return c.json({
    id: updated.id,
    owner: toPlaneUser(user),
    created_at: at,
    updated_at: at,
    name: updated.name,
    url: "",
    logo_url: null,
    total_members: 1,
    slug: DEMO_WORKSPACE_SLUG,
    created_by: user.id,
    updated_by: user.id,
    organization_size: "1-10",
    role: workspaceRoleNumber(user.role),
    timezone: updated.timezone,
  });
});

function emptyList(c: { json: (body: unknown) => Response }) {
  return c.json([]);
}

workspaceExtras.get("/:slug/labels", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return emptyList(c);
});

workspaceExtras.get("/:slug/cycles", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return emptyList(c);
});

workspaceExtras.get("/:slug/estimates", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return emptyList(c);
});

workspaceExtras.get("/:slug/draft-issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  return c.json({
    results: [],
    total_results: 0,
    total_count: 0,
    count: 0,
    grouped_by: null,
    sub_grouped_by: null,
    next_cursor: "",
    prev_cursor: "",
    next_page_results: false,
    prev_page_results: false,
    total_pages: 1,
    extra_stats: null,
  });
});

function timezoneOffsetParts(timeZone: string, at = new Date()): { utc: string; gmt: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });
  const tzName = fmt.formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tzName);
  if (!match) return { utc: "+00:00", gmt: "GMT" };
  const sign = match[1];
  const hours = match[2].padStart(2, "0");
  const minutes = match[3] ?? "00";
  return { utc: `${sign}${hours}:${minutes}`, gmt: `GMT${sign}${parseInt(match[2], 10)}` };
}

export const miscApi = new Hono();

miscApi.get("/timezones", (c) =>
  c.json({
    timezones: Intl.supportedValuesOf("timeZone")
      .map((value) => {
        const { utc, gmt } = timezoneOffsetParts(value);
        return {
          utc_offset: utc,
          gmt_offset: gmt,
          label: value.replace(/_/g, " "),
          value,
        };
      })
      .toSorted((a, b) => {
        if (a.value === "Asia/Jakarta") return -1;
        if (b.value === "Asia/Jakarta") return 1;
        return a.value.localeCompare(b.value);
      }),
  }),
);

miscApi.get("/unsplash", (c) => c.json({ results: [] }));
