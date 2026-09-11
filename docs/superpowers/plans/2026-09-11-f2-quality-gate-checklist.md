# Feature F2: Quality Gate Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Quality Gate Checklist (F2) on both Backend and Frontend. Tickets automatically receive 4 standard quality criteria, Lead developers validate items with audit trails, Student developers have read-only visibility, and transitions to `Client Ready` strictly require all criteria to be met.

**Architecture:** 
- Backend: Update `apps/api/src/plane/issues.ts` with gate check endpoints (`GET`, `POST`, `PATCH`), seed 4 default criteria upon ticket creation, and enforce permissions (only `lead` can toggle `checked`).
- Frontend: Create a `QualityGateWidget` component in `apps/web/core/components/issues/issue-detail/quality-gate-widget.tsx` and integrate it into `IssueMainContent` (`apps/web/core/components/issues/issue-detail/main-content.tsx`).

**Tech Stack:** Hono, Drizzle ORM, Neon Postgres, React 19, Tailwind CSS, TypeScript, Vitest.

## Global Constraints
- Target branch: `master`.
- No placeholders (`TODO`, `TBD`).
- Quality gate: `check:types` exit 0, `check:lint` 0 errors, Vitest passing.
- Roles: `student`, `lead`, `pm`.

---

### Task 1: Auto-Seed 4 Quality Criteria on Ticket Creation & GET/POST/PATCH Gate Check Endpoints

**Files:**
- Modify: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/tests/plane-issues.test.ts`

**Interfaces:**
- Consumes: Drizzle `gateCheckItems`, `users`, `tickets`, `resolvePlaneUser`, `unauthorized`, `readJson`, `invalidJson`
- Produces: 
  - `GET /:slug/projects/:projectId/issues/:issueId/gate-checks`
  - `POST /:slug/projects/:projectId/issues/:issueId/gate-checks`
  - `PATCH /:slug/projects/:projectId/issues/:issueId/gate-checks/:checkId`

- [ ] **Step 1: Write failing tests for gate checks endpoints and permissions**

Add to `apps/api/tests/plane-issues.test.ts`:
```typescript
  it("auto-creates 4 gate check items and verifies role permissions", async () => {
    const app = createApp();
    // 1. Login as Student
    const studentLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const studentCk = studentLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    // 2. Login as Lead
    const leadLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lead@local.dev", password: "dev123456" }),
    });
    const leadCk = leadLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: studentCk } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    // 3. Create ticket -> should have 4 auto-created criteria
    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ name: "Quality Gate Auto-Seed Test" }),
    });
    const ticket = (await createRes.json()) as { id: string };

    // 4. GET gate-checks
    const getRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/gate-checks/`, {
      headers: { Cookie: studentCk },
    });
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as { items: Array<{ id: string; label: string; checked: boolean }> };
    expect(getJson.items.length).toBe(4);
    expect(getJson.items[0].checked).toBe(false);

    const firstCheckId = getJson.items[0].id;

    // 5. Student tries to check item -> should be rejected with 403
    const studentCheckRes = await app.request(
      `/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/gate-checks/${firstCheckId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: studentCk },
        body: JSON.stringify({ checked: true }),
      }
    );
    expect(studentCheckRes.status).toBe(403);

    // 6. Lead checks item -> should succeed with 200
    const leadCheckRes = await app.request(
      `/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/gate-checks/${firstCheckId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: leadCk },
        body: JSON.stringify({ checked: true }),
      }
    );
    expect(leadCheckRes.status).toBe(200);
    const leadJson = (await leadCheckRes.json()) as { checked: boolean; checked_by: { email: string } };
    expect(leadJson.checked).toBe(true);
    expect(leadJson.checked_by.email).toBe("lead@local.dev");
  }, 30000);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL with 404 on gate-checks endpoints.

- [ ] **Step 3: Implement auto-seed and gate check routes**

In `apps/api/src/plane/issues.ts`:
1. Define constant `DEFAULT_GATE_ITEMS`:
```typescript
const DEFAULT_GATE_ITEMS = [
  "Kode berjalan sesuai acceptance tiket",
  "Tidak ada secret / API key ter-commit",
  "Mengikuti modul riset yang ditautkan",
  "Sudah self-test oleh pelaksana",
];
```
2. In `planeIssues.post("/:slug/projects/:projectId/issues")`, immediately after creating the ticket:
```typescript
await Promise.all(
  DEFAULT_GATE_ITEMS.map((label) =>
    db.insert(gateCheckItems).values({ ticketId: row.id, label })
  )
);
```
3. Implement `GET /:slug/projects/:projectId/issues/:issueId/gate-checks`:
   - Join `gateCheckItems` with `users` on `checkedById`.
   - Return `{ items: rows.map(r => ({ id: r.id, ticket_id: r.ticketId, label: r.label, checked: !!r.checkedAt, checked_by: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null, checked_at: r.checkedAt?.toISOString() ?? null })) }`.
4. Implement `POST /:slug/projects/:projectId/issues/:issueId/gate-checks`:
   - If `user.role === "student"`, return 403 `FORBIDDEN_TRANSITION`.
   - Validate `label`. Insert into `gateCheckItems`. Return 201.
5. Implement `PATCH /:slug/projects/:projectId/issues/:issueId/gate-checks/:checkId`:
   - If `user.role !== "lead"`, return 403 `FORBIDDEN_TRANSITION` ("Hanya lead developer yang dapat memvalidasi checklist mutu").
   - Parse `{ checked: boolean }`.
   - Update `checkedById = checked ? user.id : null` and `checkedAt = checked ? new Date() : null`.
   - Return updated item with `checked_by`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Typecheck & lint**

Run: `pnpm --filter stackgate-api check:types && pnpm --filter stackgate-api check:lint`
Commit: `feat(api): add gate checks endpoints with role guard and ticket auto-seed`

---

### Task 2: Build QualityGateWidget Component (Frontend)

**Files:**
- Create: `apps/web/core/components/issues/issue-detail/quality-gate-widget.tsx`
- Modify: `apps/web/core/components/issues/issue-detail/main-content.tsx:162-166`

**Interfaces:**
- Consumes: `useUser`, `API_BASE_URL` from `@plane/constants`, SWR / axios with credentials
- Produces: `QualityGateWidget` React component

- [ ] **Step 1: Create `quality-gate-widget.tsx`**

Implement `QualityGateWidget`:
- Fetch items via SWR: `GET ${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/gate-checks`
- Display header:
  - Title: **Quality Gate Checklist**
  - Progress badge: `${checkedCount}/${totalCount} Kriteria Terpenuhi` (Hijau jika 100%, Amber/Kuning jika <100%)
  - Progress bar visual
- Render list of criteria:
  - Checkbox per item.
  - Disabled if `currentUser.role !== "lead"`.
  - Helper note for student: *"Hanya Lead developer yang dapat memvalidasi checklist mutu ini."*
  - If checked, show *"Diverifikasi oleh [Name] • [Formatted Date]"*.
  - When Lead clicks checkbox, send optimistic update and `PATCH` to `/gate-checks/:checkId`.
  - If Lead, provide inline input `+ Tambah Kriteria` to POST new item.

- [ ] **Step 2: Mount `QualityGateWidget` in `main-content.tsx`**

In `apps/web/core/components/issues/issue-detail/main-content.tsx`:
Import `QualityGateWidget` and insert right above `<IssueDetailWidgets>`:
```tsx
<QualityGateWidget
  workspaceSlug={workspaceSlug}
  projectId={projectId}
  issueId={issueId}
/>
```

- [ ] **Step 3: Verify types, lint, and build**

Run:
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter web build`
Commit: `feat(web): add quality gate checklist widget to ticket detail panel`

---

### Task 3: Quality Gate & E2E Production Verification

- [ ] **Step 1: Run full test suite and CI verification**
`pnpm --filter stackgate-api test`
Push to `master` and wait for GitHub Actions CI to pass.

- [ ] **Step 2: Verify in browser on production**
- Open `https://stackgate-web.vercel.app/stackgate/browse/CK-1/` as Siswa:
  - Quality Gate Checklist appears with 4 criteria.
  - Checkboxes are disabled with helper message.
- Switch to Lead (`lead@local.dev`):
  - Checkboxes are clickable.
  - Check all 4 items.
  - Ticket can now transition to `Client Ready`.
