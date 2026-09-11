# F1 Kanban Board (Plane-Compat) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Plane-compatible issue endpoints to activate the Kanban Board (F1) on Plane UI, enabling ticket listing, creation, and drag-and-drop state transitions with role-based guard enforcement.

**Architecture:** Add Plane-compatible REST routes in `apps/api/src/plane/issues.ts` mounted at `/api/workspaces` in `apps/api/src/app.ts`. The endpoints query Neon Postgres via Drizzle (`tickets`, `states`, `users`) and enforce role transitions using `checkTransition` from `apps/api/src/tickets/guard.ts`.

**Tech Stack:** Hono, Drizzle ORM, PostgreSQL (Neon), TypeScript, Vitest.

## Global Constraints
- Deploy branch: `master`.
- No placeholders (`TODO`, `TBD`).
- Quality gate: `check:types` exit 0, `check:lint` 0 warnings/errors, all vitest tests pass.
- Role permissions: `student`, `lead`, `pm`.

---

### Task 1: Test Suite & Display Properties

**Files:**
- Create: `apps/api/tests/plane-issues.test.ts`
- Create: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `resolvePlaneUser`, `unauthorized`, `DEMO_WORKSPACE_SLUG` from `apps/api/src/plane/routes.ts`
- Produces: `planeIssues` Hono app mounted at `/api/workspaces`

- [ ] **Step 1: Write the failing test for issue display properties & 401 guard**

In `apps/api/tests/plane-issues.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat issues", () => {
  it("GET /api/workspaces/stackgate/projects/test/issue-display-properties/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issue-display-properties/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/projects/test/issues/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issues/");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL with 404 (routes not implemented yet).

- [ ] **Step 3: Create minimal planeIssues router and mount it**

In `apps/api/src/plane/issues.ts`:
```typescript
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
```

In `apps/api/src/app.ts`, import `planeIssues` and mount:
```typescript
app.route("/api/workspaces", planeIssues);
```

- [ ] **Step 4: Run test to verify display properties passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: display properties passes (200/401), issues route still 404.

---

### Task 2: List Project Issues (GET /issues)

**Files:**
- Modify: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/tests/plane-issues.test.ts`

**Interfaces:**
- Consumes: Drizzle tables `tickets`, `projects`, `users`, `states`
- Produces: `TIssuesResponse` JSON shape with `results: TBaseIssue[]`

- [ ] **Step 1: Write the failing test for listing project issues**

Add to `apps/api/tests/plane-issues.test.ts`:
```typescript
  it("GET /api/workspaces/stackgate/projects/:id/issues/ returns TIssuesResponse for authenticated user", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const res = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      headers: { Cookie: ck },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { results: unknown[]; total_count: number };
    expect(Array.isArray(json.results)).toBe(true);
    expect(typeof json.total_count).toBe("number");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL with 404.

- [ ] **Step 3: Implement GET issues handler**

Add to `apps/api/src/plane/issues.ts`:
```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projects, tickets } from "../db/schema.js";

function toBaseIssue(t: typeof tickets.$inferSelect, seq: number) {
  const at = t.createdAt.toISOString();
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
    created_at: at,
    updated_at: at,
    start_date: null,
    target_date: null,
    completed_at: null,
    archived_at: null,
    created_by: t.reporterId ?? "",
    updated_by: t.reporterId ?? "",
    is_draft: false,
    description_html: `<p>${t.description || ""}</p>`,
  };
}

planeIssues.get("/:slug/projects/:projectId/issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);

  const rows = await db.select().from(tickets).where(eq(tickets.projectId, projectId));
  const results = rows.map((t, idx) => toBaseIssue(t, idx + 1));
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: PASS.

---

### Task 3: Create Issue (POST /issues)

**Files:**
- Modify: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/tests/plane-issues.test.ts`

**Interfaces:**
- Consumes: `readJson`, `invalidJson`, Drizzle `tickets`, `states`
- Produces: `POST /:slug/projects/:projectId/issues` returning `TIssue`

- [ ] **Step 1: Write failing test for issue creation**

Add to `apps/api/tests/plane-issues.test.ts`:
```typescript
  it("POST /api/workspaces/stackgate/projects/:id/issues/ creates ticket in backlog", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const res = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ name: "Tiket Baru Test", description_html: "<p>Deskripsi</p>" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string; name: string };
    expect(json.name).toBe("Tiket Baru Test");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL with 404.

- [ ] **Step 3: Implement POST issues handler**

Add to `apps/api/src/plane/issues.ts`:
```typescript
import { invalidJson, readJson } from "../http.js";
import { states, ticketTransitions } from "../db/schema.js";

planeIssues.post("/:slug/projects/:projectId/issues", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const projectId = c.req.param("projectId");
  const parsed = await readJson<{ name?: string; description_html?: string; assignee_ids?: string[] }>(c);
  if (!parsed.ok) return invalidJson(c);
  const name = parsed.body.name?.trim() ?? "";
  if (!name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Judul tiket wajib diisi" } }, 400);
  }

  const projectStates = await db.select().from(states).where(eq(states.projectId, projectId));
  const backlog = projectStates.find((s) => s.key === "backlog");
  if (!backlog) return c.json({ error: { code: "VALIDATION_ERROR", message: "State backlog belum ada" } }, 400);

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: PASS.

---

### Task 4: Drag & Drop State Transition with Guard (PATCH /issues/:id)

**Files:**
- Modify: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/tests/plane-issues.test.ts`

**Interfaces:**
- Consumes: `checkTransition` from `apps/api/src/tickets/guard.js`, `tickets`, `states`
- Produces: `PATCH /:slug/projects/:projectId/issues/:issueId` validating state moves

- [ ] **Step 1: Write failing test for state transition guard**

Add to `apps/api/tests/plane-issues.test.ts`:
```typescript
  it("PATCH /api/workspaces/stackgate/projects/:id/issues/:issueId/ rejects student moving to ready", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    // Get ready state ID
    const statesRes = await app.request("/api/workspaces/stackgate/states/", { headers: { Cookie: ck } });
    const statesList = (await statesRes.json()) as Array<{ id: string; group: string }>;
    const readyState = statesList.find((s) => s.group === "completed")!;

    // Create ticket
    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ name: "Guard Test" }),
    });
    const ticket = (await createRes.json()) as { id: string };

    // Move to ready as student -> should 403
    const patchRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ state_id: readyState.id }),
    });
    expect(patchRes.status).toBe(403);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL with 404.

- [ ] **Step 3: Implement PATCH issues handler with checkTransition**

Add to `apps/api/src/plane/issues.ts`:
```typescript
import { checkTransition } from "../tickets/guard.js";

planeIssues.patch("/:slug/projects/:projectId/issues/:issueId", async (c) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (c.req.param("slug") !== DEMO_WORKSPACE_SLUG) {
    return c.json({ error: { code: "NOT_FOUND", message: "Workspace tidak ditemukan" } }, 404);
  }
  const issueId = c.req.param("issueId");
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, issueId)).limit(1);
  if (!ticket) return c.json({ error: { code: "NOT_FOUND", message: "Tiket tidak ditemukan" } }, 404);

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
    const targetStateId = parsed.body.state_id;
    const [targetState] = await db.select().from(states).where(eq(states.id, targetStateId)).limit(1);
    if (!targetState) return c.json({ error: { code: "NOT_FOUND", message: "State tidak ditemukan" } }, 404);

    const guardResult = await checkTransition(ticket.id, targetState.key, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    if (!guardResult.ok) {
      return c.json({ error: { code: guardResult.code, message: guardResult.message } }, guardResult.status);
    }
    updates.stateId = targetStateId;
    await db.insert(ticketTransitions).values({
      ticketId: ticket.id,
      fromStateId: ticket.stateId,
      toStateId: targetStateId,
      actorId: user.id,
    });
  }

  const [updated] = await db.update(tickets).set(updates).where(eq(tickets.id, issueId)).returning();
  return c.json(toBaseIssue(updated, 1));
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: PASS.

---

### Task 5: Quality Gate & E2E Production Verification

**Files:**
- Clean/verify entire codebase.

- [ ] **Step 1: Run type checking**
Run: `pnpm --filter stackgate-api check:types`
Expected: exit 0.

- [ ] **Step 2: Run linter**
Run: `pnpm --filter stackgate-api check:lint`
Expected: 0 warnings, 0 errors.

- [ ] **Step 3: Run full test suite**
Run: `pnpm --filter stackgate-api test`
Expected: All test files pass.

- [ ] **Step 4: Commit and push to master**
```bash
rtk git add apps/api/src/plane/issues.ts apps/api/src/app.ts apps/api/tests/plane-issues.test.ts
rtk git commit -m "feat(api): plane-compat kanban board issues and guard transitions"
rtk git push origin master
```

- [ ] **Step 5: Verify in production browser**
Navigate to `https://stackgate-web.vercel.app/stackgate/` and open projects board to confirm cards render and drag-and-drop triggers backend response.
