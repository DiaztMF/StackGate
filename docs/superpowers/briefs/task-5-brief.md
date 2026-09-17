# Task 5 Brief — Ticket lifecycle with transition guards

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 5.
Branch: `plan-01-foundation` (base now `d0c0124`). Work from `D:\Project\Web Project\Enuma\StackGate`.

Binding rulings (already applied in the code below): relative imports carry `.js` extensions; no bare dotenv side-effect imports.

Database: `apps/api/.env` holds `DATABASE_URL`/`TEST_DATABASE_URL` (Neon branch, git-ignored) — use via env file only, never print or commit credentials. Dev seed provides the `contoh-klien` project with 4 states, 3 users, 1 sample ticket with 4 unchecked gate items.

## Requirements

Create `apps/api/tests/tickets.test.ts` exactly (TDD RED first):

```typescript
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("transition guards (no token)", () => {
  it("rejects transition without token", async () => {
    const res = await createApp().request("/api/tickets/00000000-0000-0000-0000-000000000000/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_state: "ready" }),
    });
    expect(res.status).toBe(401);
  });
});
```

Run `pnpm --filter stackgate-api test tests/tickets.test.ts`, confirm FAIL with `expected 404 to be 401` (no ticket routes mounted yet).

Create `apps/api/src/tickets/guard.ts` exactly:

```typescript
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { gateCheckItems, researchLinks, states, tickets } from "../db/schema.js";
import type { AuthUser } from "../auth/middleware.js";

export type GuardOk = { ok: true; toStateId: string };
export type GuardFail = { ok: false; status: 403 | 422 | 404; code: string; message: string };

const STUDENT_FORWARD: Record<string, string> = {
  backlog: "in-development",
  "in-development": "review",
};

export async function checkTransition(ticketId: string, toKey: string, actor: AuthUser): Promise<GuardOk | GuardFail> {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
  const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
  const toState = projectStates.find((s) => s.key === toKey);
  if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
  const fromState = projectStates.find((s) => s.id === ticket.stateId);

  if (actor.role === "student") {
    const allowed = fromState && STUDENT_FORWARD[fromState.key] === toKey;
    if (!allowed) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Siswa hanya boleh maju ke Review" };
    }
    if (toKey === "review" && ticket.researchRequired) {
      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
      if (links.length === 0) {
        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
      }
    }
    return { ok: true, toStateId: toState.id };
  }

  if (toKey === "ready") {
    if (actor.role !== "lead") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh menutup tiket" };
    }
    const unchecked = await db
      .select({ id: gateCheckItems.id })
      .from(gateCheckItems)
      .where(and(eq(gateCheckItems.ticketId, ticket.id), isNull(gateCheckItems.checkedAt)))
      .limit(1);
    if (unchecked.length > 0) {
      return { ok: false, status: 422, code: "GATE_INCOMPLETE", message: "Checklist gerbang belum lengkap" };
    }
    const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
    if (ticket.researchRequired && links.length === 0) {
      return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (actor.role === "student") {
    return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Transisi ini di luar hak siswa" };
  }
  return { ok: true, toStateId: toState.id };
}
```

Create `apps/api/src/tickets/routes.ts` exactly:

```typescript
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { comments, gateCheckItems, researchLinks, states, ticketTransitions, tickets } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";
import { checkTransition } from "./guard.js";

const ticketsApi = new Hono();
ticketsApi.use("*", authMiddleware);

ticketsApi.get("/projects/:id/tickets", async (c) => {
  const rows = await db.select().from(tickets).where(eq(tickets.projectId, c.req.param("id")));
  return c.json({ data: { tickets: rows } });
});

ticketsApi.post("/projects/:id/tickets", async (c) => {
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

ticketsApi.get("/tickets/:id", async (c) => {
  const [row] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  if (!row) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);
  return c.json({ data: { ticket: row } });
});

ticketsApi.post("/tickets/:id/transition", async (c) => {
  const user = c.get("user");
  const { to_state } = await c.req.json<{ to_state: string }>();
  const result = await checkTransition(c.req.param("id"), to_state, user);
  if (!result.ok) return c.json({ error: { code: result.code, message: result.message } }, result.status);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, c.req.param("id"))).limit(1);
  const [updated] = await db.update(tickets).set({ stateId: result.toStateId }).where(eq(tickets.id, c.req.param("id"))).returning();
  await db.insert(ticketTransitions).values({ ticketId: updated.id, fromStateId: ticket.stateId, toStateId: result.toStateId, actorId: user.id });
  return c.json({ data: { ticket: updated } });
});

ticketsApi.get("/tickets/:id/research-links", async (c) => {
  const rows = await db.select().from(researchLinks).where(eq(researchLinks.ticketId, c.req.param("id")));
  return c.json({ data: { links: rows } });
});

ticketsApi.post("/tickets/:id/research-links", async (c) => {
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

ticketsApi.get("/tickets/:id/gate-checks", async (c) => {
  const rows = await db.select().from(gateCheckItems).where(eq(gateCheckItems.ticketId, c.req.param("id")));
  return c.json({ data: { items: rows } });
});

ticketsApi.post("/tickets/:id/gate-checks", async (c) => {
  const user = c.get("user");
  if (user.role === "student") {
    return c.json({ error: { code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang mengelola checklist" } }, 403);
  }
  const body = await c.req.json<{ label: string }>();
  const [row] = await db.insert(gateCheckItems).values({ ticketId: c.req.param("id"), label: body.label }).returning();
  return c.json({ data: { item: row } }, 201);
});

ticketsApi.get("/tickets/:id/comments", async (c) => {
  const rows = await db.select().from(comments).where(eq(comments.ticketId, c.req.param("id")));
  return c.json({ data: { comments: rows } });
});

ticketsApi.post("/tickets/:id/comments", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ body: string }>();
  if (!body.body || body.body.trim().length === 0) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Komentar tidak boleh kosong" } }, 400);
  }
  const [row] = await db.insert(comments).values({ ticketId: c.req.param("id"), authorId: user.id, body: body.body.trim() }).returning();
  return c.json({ data: { comment: row } }, 201);
});

export default ticketsApi;
```

Mount in `apps/api/src/app.ts` by adding:

```typescript
import ticketsApi from "./tickets/routes.js";

app.route("/api", ticketsApi);
```

The gate-check update endpoint (`PATCH /api/gate-checks/:id`, lead only) ships in Plan 02 with the checklist UI — do not build it here.

Gates: full `pnpm --filter stackgate-api test` green; `check:types` exit 0; `check:lint` exit 0. Known lint-sensitive spots in this code: none expected beyond what the rulings cover, but if oxlint flags anything, fix minimally without changing behavior and report it. Commit exactly: `git add apps/api/src/tickets apps/api/src/app.ts apps/api/tests/tickets.test.ts` then `git commit -m "feat(api): ticket lifecycle with transition guards"`.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets (no `.env`). Never print credentials.
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- Exported contracts Task 6 relies on: ticket list/detail/transition endpoints with `{data: ...}` shapes and the documented error codes.
