import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { comments, gateCheckItems, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
import { authMiddleware, type AuthUser } from "../auth/middleware.js";
import { checkTransition } from "./guard.js";

const ticketsApi = new Hono<{ Variables: { user: AuthUser } }>();

ticketsApi.get("/projects/:id/tickets", authMiddleware, async (c) => {
  const rows = await db.select().from(tickets).where(eq(tickets.projectId, c.req.param("id")));
  return c.json({ data: { tickets: rows } });
});

ticketsApi.post("/projects/:id/tickets", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ title: string; description?: string; assigneeId?: string; researchRequired?: boolean }>();
  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
  }
  const projectStates = await db.select().from(states).where(eq(states.projectId, c.req.param("id")));
  const backlog = projectStates.find((s) => s.key === "backlog");
  if (!backlog) return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog belum ada" } }, 400);
  const [row] = await db
    .insert(tickets)
    .values({
      projectId: c.req.param("id"),
      stateId: backlog.id,
      title: body.title.trim(),
      description: body.description ?? "",
      assigneeId: body.assigneeId ?? null,
      reporterId: user.id,
      researchRequired: body.researchRequired ?? false,
    })
    .returning();
  await db.insert(ticketTransitions).values({ ticketId: row.id, fromStateId: null, toStateId: backlog.id, actorId: user.id });
  return c.json({ data: { ticket: row } }, 201);
});

ticketsApi.get("/tickets/:id", authMiddleware, async (c) => {
  const [row] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  return c.json({ data: { ticket: row } });
});

ticketsApi.post("/tickets/:id/transition", authMiddleware, async (c) => {
  const user = c.get("user");
  const { to_state } = await c.req.json<{ to_state: string }>();
  const result = await checkTransition(c.req.param("id"), to_state, user);
  if (!result.ok) return c.json({ error: { code: result.code, message: result.message } }, result.status);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  const [updated] = await db.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
  await db.insert(ticketTransitions).values({ ticketId: updated.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
  return c.json({ data: { ticket: updated } });
});

ticketsApi.get("/tickets/:id/research-links", authMiddleware, async (c) => {
  const rows = await db.select().from(researchLinks).where(eq(researchLinks.ticketId, c.req.param("id")));
  return c.json({ data: { links: rows } });
});

ticketsApi.post("/tickets/:id/research-links", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ url: string; label: string; required?: boolean }>();
  if (!body.url || !body.label) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "URL dan label wajib diisi" } }, 400);
  }
  const [row] = await db
    .insert(researchLinks)
    .values({ ticketId: c.req.param("id"), url: body.url, label: body.label, required: body.required ?? false, createdById: user.id })
    .returning();
  return c.json({ data: { link: row } }, 201);
});

ticketsApi.get("/tickets/:id/gate-checks", authMiddleware, async (c) => {
  const rows = await db.select().from(gateCheckItems).where(eq(gateCheckItems.ticketId, c.req.param("id")));
  return c.json({ data: { items: rows } });
});

ticketsApi.post("/tickets/:id/gate-checks", authMiddleware, async (c) => {
  const user = c.get("user");
  if (user.role === "student") {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang mengelola checklist" } }, 403);
  }
  const body = await c.req.json<{ label: string }>();
  const [row] = await db.insert(gateCheckItems).values({ ticketId: c.req.param("id"), label: body.label }).returning();
  return c.json({ data: { item: row } }, 201);
});

ticketsApi.get("/tickets/:id/comments", authMiddleware, async (c) => {
  const rows = await db.select().from(comments).where(eq(comments.ticketId, c.req.param("id")));
  return c.json({ data: { comments: rows } });
});

ticketsApi.post("/tickets/:id/comments", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ body: string }>();
  if (!body.body || body.body.trim().length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
  }
  const [row] = await db.insert(comments).values({ ticketId: c.req.param("id"), authorId: user.id, body: body.body.trim() }).returning();
  return c.json({ data: { comment: row } }, 201);
});

export default ticketsApi;
