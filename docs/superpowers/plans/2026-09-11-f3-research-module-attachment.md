# Feature F3: Research Module Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Research Module Attachment feature (F3). Tickets with `research_required` enforce attaching research documentation before transitioning to Review. Provides GET/POST/DELETE research-links API and a dedicated `ResearchModuleWidget` UI component.

**Architecture:** 
- Backend: Update `apps/api/src/plane/issues.ts` with research-links routes, handle `research_required` on issue updates, and enforce transition guards via `checkTransition`.
- Frontend: Create `apps/web/core/components/issues/issue-detail/research-module-widget.tsx` and mount it in `main-content.tsx` and `peek-overview/issue-detail.tsx`.

**Tech Stack:** Hono, Drizzle ORM, Neon Postgres, React 19, Tailwind CSS, TypeScript, Vitest.

## Global Constraints
- Target branch: `master`.
- No placeholders (`TODO`, `TBD`).
- Quality gate: `check:types` exit 0, `check:lint` 0 errors, Vitest passing.
- Roles: `student`, `lead`, `pm`.

---

### Task 1: Research Links Endpoints & Transition Guard Enforcement

**Files:**
- Modify: `apps/api/src/plane/issues.ts`
- Modify: `apps/api/tests/plane-issues.test.ts`

**Interfaces:**
- Consumes: Drizzle `researchLinks`, `tickets`, `users`, `checkTransition`, `resolvePlaneUser`, `readJson`, `invalidJson`
- Produces:
  - `GET /:slug/projects/:projectId/issues/:issueId/research-links`
  - `POST /:slug/projects/:projectId/issues/:issueId/research-links`
  - `DELETE /:slug/projects/:projectId/issues/:issueId/research-links/:linkId`
  - Support `research_required` boolean on `PATCH /:slug/projects/:projectId/issues/:issueId`

- [ ] **Step 1: Write failing tests for research links and review transition guard**

Add to `apps/api/tests/plane-issues.test.ts`:
```typescript
  it("enforces research link requirement when moving to review state", async () => {
    const app = createApp();
    const studentLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const studentCk = studentLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: studentCk } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const statesRes = await app.request("/api/workspaces/stackgate/states/", { headers: { Cookie: studentCk } });
    const statesList = (await statesRes.json()) as Array<{ id: string; name: string }>;
    const inDevState = statesList.find((s) => s.name === "In Development")!;
    const reviewState = statesList.find((s) => s.name === "Quality Gate Review")!;

    // 1. Create ticket with research_required
    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ name: "Research Guard Test", description_html: "<p>Deskripsi tugas</p>" }),
    });
    const ticket = (await createRes.json()) as { id: string };

    // Move to in-development
    await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: inDevState.id, research_required: true }),
    });

    // 2. Try move to review without research link -> should 422 RESEARCH_LINK_REQUIRED
    const failReviewRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: reviewState.id }),
    });
    expect(failReviewRes.status).toBe(422);
    const failJson = (await failReviewRes.json()) as { error: { code: string } };
    expect(failJson.error.code).toBe("RESEARCH_LINK_REQUIRED");

    // 3. Add research link
    const addLinkRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/research-links/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ label: "Modul Auth Spesifikasi", url: "https://docs.stackgate.dev/auth" }),
    });
    expect(addLinkRes.status).toBe(201);

    // 4. GET research links
    const getLinksRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/research-links/`, {
      headers: { Cookie: studentCk },
    });
    expect(getLinksRes.status).toBe(200);
    const getLinksJson = (await getLinksRes.json()) as { research_required: boolean; links: Array<{ label: string }> };
    expect(getLinksJson.research_required).toBe(true);
    expect(getLinksJson.links.length).toBe(1);

    // 5. Try move to review again -> should succeed with 200
    const successReviewRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: reviewState.id }),
    });
    expect(successReviewRes.status).toBe(200);
  }, 30000);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: FAIL on missing research-links routes or research_required handling.

- [ ] **Step 3: Implement research-links endpoints and patch support in `issues.ts`**

In `apps/api/src/plane/issues.ts`:
1. Import `researchLinks` from `../db/schema.js`.
2. In `planeIssues.patch("/:slug/projects/:projectId/issues/:issueId")`:
   - Accept `research_required?: boolean` in `parsed.body`.
   - If `parsed.body.research_required !== undefined`:
     - Allow if `user.role === "lead" || user.role === "pm" || user.role === "student"`.
     - Update `updates.researchRequired = parsed.body.research_required`.
3. Implement `GET /:slug/projects/:projectId/issues/:issueId/research-links`:
   - Resolve user, check slug, check ticket.
   - Query `researchLinks` left join `users` on `researchLinks.createdById === users.id` where `eq(researchLinks.ticketId, issueId)`.
   - Return `{ research_required: ticket.researchRequired, links: rows.map(r => ({ id: r.id, ticket_id: r.ticketId, label: r.label, url: r.url, required: r.required, created_by: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null })) }`.
4. Implement `POST /:slug/projects/:projectId/issues/:issueId/research-links`:
   - Parse `{ url?: string; label?: string; required?: boolean }`.
   - Validate `url` and `label`. If empty, return 400.
   - Insert into `researchLinks`: `{ ticketId: issueId, url, label, required: !!required, createdById: user.id }`.
   - Return 201 with created item.
5. Implement `DELETE /:slug/projects/:projectId/issues/:issueId/research-links/:linkId`:
   - Query link by `linkId`. If none or different ticket, 404.
   - Delete link: `db.delete(researchLinks).where(eq(researchLinks.id, linkId))`.
   - Return `{ ok: true }` (200).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-issues.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Check types and lint**

Run: `pnpm --filter stackgate-api check:types && pnpm --filter stackgate-api check:lint`
Commit: `feat(api): add research links endpoints and transition guard support`

---

### Task 2: Build ResearchModuleWidget Component (Frontend)

**Files:**
- Create: `apps/web/core/components/issues/issue-detail/research-module-widget.tsx`
- Modify: `apps/web/core/components/issues/issue-detail/main-content.tsx`
- Modify: `apps/web/core/components/issues/peek-overview/issue-detail.tsx`

**Interfaces:**
- Consumes: `API_BASE_URL` from `@plane/constants`, `useUser` from `@/hooks/store/user`, SWR, axios
- Produces: `ResearchModuleWidget` React component

- [ ] **Step 1: Create `research-module-widget.tsx`**

Implement `ResearchModuleWidget`:
- Fetch via SWR: `GET ${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/research-links`
- Type `ResearchLink`:
  ```typescript
  export type ResearchLink = {
    id: string;
    ticket_id: string;
    label: string;
    url: string;
    required: boolean;
    created_by: { id: string; name: string; email: string } | null;
  };
  ```
- Header:
  - Title: **Modul Riset Terkait** (dengan ikon Link / Book).
  - Toggle / Pill: **Riset Wajib (Required)** — jika role `lead` atau `pm`, tombol toggle interaktif. Jika `student`, badge statis.
  - Alert banner jika `research_required` aktif dan `links.length === 0`:
    *"Tiket ini mewajibkan modul riset. Siswa tidak dapat mengajukan review sebelum menautkan modul riset."*
- List Links:
  - Card per tautan riset: Label tebal, URL biru yang bisa diklik (target `_blank`), dan nama penaut.
  - Tombol ikon hapus (trash) untuk menghapus link riset via `DELETE /research-links/:linkId`.
- Form Tambah:
  - Input `Label Modul` + Input `URL Riset` + Tombol `+ Tautkan Modul`.
  - Submit memanggil `POST /research-links` dan me-refresh data via `mutate()`.

- [ ] **Step 2: Mount `ResearchModuleWidget` in `main-content.tsx` and `peek-overview/issue-detail.tsx`**

Place right after `<QualityGateWidget>`:
```tsx
<ResearchModuleWidget
  workspaceSlug={workspaceSlug}
  projectId={projectId}
  issueId={issueId}
/>
```

- [ ] **Step 3: Verify formatting, types, lint, and build**

Run:
`pnpm --filter web fix:format`
`pnpm --filter web check:format`
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter web build`
Commit: `feat(web): add research module widget to ticket detail panels`

---

### Task 3: Quality Gate & E2E Production Verification

- [ ] **Step 1: Run full test suite and CI verification**
`pnpm --filter stackgate-api test`
Push to `master` and wait for GitHub Actions CI to pass.

- [ ] **Step 2: Verify in browser on production**
- Open ticket detail in browser at `https://stackgate-web.vercel.app/`
- Verify `ResearchModuleWidget` appears below `QualityGateWidget`.
- Add a research module link (e.g. `Label: Dokumen Arsitektur Auth`, `URL: https://docs.stackgate.dev`).
- Verify link is clickable and listed properly.
