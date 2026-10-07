import { Hono } from "hono";
import { del, get, put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { ticketAttachments, tickets } from "../db/schema.js";
import { DEMO_WORKSPACE_SLUG, resolvePlaneUser, unauthorized } from "./routes.js";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ALLOWED_PREFIXES = ["image/", "text/plain", "text/markdown", "application/pdf", "application/zip"];

function sanitizeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 120) || "file";
}

function apiOrigin(c: { req: { url: string } }): string {
  return new URL(c.req.url).origin;
}

function toPlaneAttachment(
  row: typeof ticketAttachments.$inferSelect,
  scope: { slug: string; projectId: string; issueId: string; apiBase: string },
) {
  return {
    id: row.id,
    attributes: { name: row.filename, size: row.size },
    asset_url: `${scope.apiBase}/api/workspaces/${scope.slug}/projects/${scope.projectId}/issues/${scope.issueId}/attachments/${row.id}/file`,
    issue_id: row.ticketId,
    updated_at: row.createdAt.toISOString(),
    updated_by: row.uploadedById ?? "",
    created_by: row.uploadedById ?? "",
  };
}

async function loadTicket(projectId: string, issueId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket || ticket.projectId !== projectId) return null;
  return ticket;
}

export const ticketAttachmentsApi = new Hono();

ticketAttachmentsApi.get("/:slug/projects/:projectId/issues/:issueId/attachments", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const issueId = c.req.param("issueId");
  const ticket = await loadTicket(projectId, issueId);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  const rows = await db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, issueId));
  const scope = { slug: c.req.param("slug"), projectId, issueId, apiBase: apiOrigin(c) };
  return c.json(rows.map((r) => toPlaneAttachment(r, scope)));
});

ticketAttachmentsApi.post("/:slug/projects/:projectId/issues/:issueId/attachments", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const issueId = c.req.param("issueId");
  const ticket = await loadTicket(projectId, issueId);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL) {
    return c.json({ error: { code: "STORAGE_NOT_CONFIGURED", message: "Upload belum dikonfigurasi di server ini" } }, 500);
  }
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!(file instanceof File)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Field file wajib diisi (multipart form-data)" } }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Ukuran file maksimal 4MB" } }, 400);
  }
  const contentType = file.type || "application/octet-stream";
  const allowed = ALLOWED_PREFIXES.some((p) => (p.endsWith("/") ? contentType.startsWith(p) : contentType === p));
  if (!allowed) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Tipe file tidak didukung (gambar, PDF, teks, atau ZIP)" } }, 400);
  }
  const pathname = `tickets/${ticket.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
  let stored;
  try {
    stored = await put(pathname, file, { access: "private", contentType, addRandomSuffix: true });
  } catch {
    return c.json({ error: { code: "STORAGE_ERROR", message: "Gagal menyimpan file ke penyimpanan" } }, 500);
  }
  const [row] = await db
    .insert(ticketAttachments)
    .values({
      ticketId: ticket.id,
      blobUrl: stored.url,
      pathname: stored.pathname,
      filename: file.name.slice(0, 200),
      contentType,
      size: file.size,
      uploadedById: user.id,
    })
    .returning();
  const scope = { slug: c.req.param("slug"), projectId, issueId, apiBase: apiOrigin(c) };
  return c.json(toPlaneAttachment(row, scope), 201);
});

ticketAttachmentsApi.get("/:slug/projects/:projectId/issues/:issueId/attachments/:attachmentId/file", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const issueId = c.req.param("issueId");
  const ticket = await loadTicket(projectId, issueId);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  const [row] = await db
    .select()
    .from(ticketAttachments)
    .where(and(eq(ticketAttachments.id, c.req.param("attachmentId")), eq(ticketAttachments.ticketId, issueId)))
    .limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Lampiran tidak ditemukan" } }, 404);
  let result;
  try {
    result = await get(row.pathname, { access: "private" });
  } catch {
    return c.json({ error: { code: "STORAGE_ERROR", message: "Gagal membaca file dari penyimpanan" } }, 500);
  }
  if (!result || result.statusCode !== 200) {
    return c.json({ error: { code: "NOT_FOUND", message: "File tidak ditemukan di penyimpanan" } }, 404);
  }
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || row.contentType,
      "Content-Length": String(row.size),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${encodeURIComponent(row.filename)}"`,
    },
  });
});

ticketAttachmentsApi.delete("/:slug/projects/:projectId/issues/:issueId/attachments/:attachmentId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const issueId = c.req.param("issueId");
  const ticket = await loadTicket(projectId, issueId);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  const [row] = await db
    .select()
    .from(ticketAttachments)
    .where(and(eq(ticketAttachments.id, c.req.param("attachmentId")), eq(ticketAttachments.ticketId, issueId)))
    .limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Lampiran tidak ditemukan" } }, 404);
  const canDelete = row.uploadedById === user.id || user.role === "lead" || user.role === "pm" || user.role === "superadmin";
  if (!canDelete) {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya pengunggah, lead, atau PM yang boleh menghapus lampiran" } }, 403);
  }
  try {
    await del(row.blobUrl);
  } catch {
    return c.json({ error: { code: "STORAGE_ERROR", message: "Gagal menghapus file dari penyimpanan" } }, 500);
  }
  await db.delete(ticketAttachments).where(eq(ticketAttachments.id, row.id));
  return c.json({ ok: true });
});
