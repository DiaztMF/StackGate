# Feature F4: Dashboard PM (Workload & Alerts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the PM Quality & Workload Dashboard (F4). Real-time calculations of team workload per state, stuck tickets detection (STUCK_AFTER_DAYS = 3), idle interns (0 active tickets), and overload interns (> 5 active tickets) on the Analytics Overview page.

**Architecture:** 
- Backend: Implement `GET /api/workspaces/:slug/pm-dashboard` in `apps/api/src/plane/workspaces.ts`, querying `tickets`, `states`, `users`, `ticketTransitions` in Neon Postgres.
- Frontend: Implement `PMDashboardOverview` component in `apps/web/core/components/analytics/overview/root.tsx` with metrics cards, workload matrix table, and stuck alerts panel.

**Tech Stack:** Hono, Drizzle ORM, Neon Postgres, React 19, Tailwind CSS, TypeScript, Vitest.

## Global Constraints
- Target branch: `master`.
- No placeholders (`TODO`, `TBD`).
- Quality gate: `check:types` exit 0, `check:lint` 0 errors, Vitest passing.
- Constants: `STUCK_AFTER_DAYS = 3`, `OVERLOAD_THRESHOLD = 5`.

---

### Task 1: PM Dashboard API Endpoint & Business Logic

**Files:**
- Modify: `apps/api/src/plane/workspaces.ts`
- Modify: `apps/api/tests/plane-workspaces.test.ts`

**Interfaces:**
- Consumes: Drizzle `tickets`, `states`, `users`, `ticketTransitions`, `projects`, `workspaces`
- Produces: `GET /:slug/pm-dashboard` returning `{ summary, workload, stuck_tickets }`

- [ ] **Step 1: Write failing test for PM Dashboard endpoint**

Add to `apps/api/tests/plane-workspaces.test.ts`:
```typescript
  it("GET /api/workspaces/stackgate/pm-dashboard returns summary, workload matrix, and stuck alerts", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lead@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const res = await app.request("/api/workspaces/stackgate/pm-dashboard", {
      headers: { Cookie: ck },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      summary: { total_tickets: number; stuck_tickets_count: number; idle_members_count: number };
      workload: Array<{ user: { name: string }; status: string; active_total: number }>;
      stuck_tickets: Array<{ title: string; days_in_state: number }>;
    };
    expect(typeof json.summary.total_tickets).toBe("number");
    expect(Array.isArray(json.workload)).toBe(true);
    expect(Array.isArray(json.stuck_tickets)).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter stackgate-api test -- tests/plane-workspaces.test.ts`
Expected: FAIL with 404 on `/api/workspaces/stackgate/pm-dashboard`.

- [ ] **Step 3: Implement `GET /:slug/pm-dashboard` in `workspaces.ts`**

In `apps/api/src/plane/workspaces.ts`:
1. Import `desc` from `drizzle-orm` and `ticketTransitions` from `../db/schema.js`.
2. Define constants:
   ```typescript
   const STUCK_AFTER_DAYS = 3;
   const OVERLOAD_THRESHOLD = 5;
   ```
3. Implement handler `planeWorkspaces.get("/:slug/pm-dashboard", async (c) => { ... })`:
   - Resolve user, verify workspace slug === `DEMO_WORKSPACE_SLUG`.
   - Fetch all `projects` in workspace.
   - Fetch all `states` and `tickets` for those projects.
   - Fetch all `users` in system.
   - For each user:
     - Count tickets by state key:
       - `backlog`: state.key === "backlog" && assigneeId === u.id
       - `in_development`: state.key === "in-development" && assigneeId === u.id
       - `review`: state.key === "review" && assigneeId === u.id
       - `ready`: state.key === "ready" && assigneeId === u.id
     - `active_total = in_development + review`
     - `status = active_total === 0 ? "IDLE" : active_total > OVERLOAD_THRESHOLD ? "OVERLOAD" : "NORMAL"`
   - For each ticket:
     - Skip if ticket state is `ready` or null.
     - Find latest transition date from `ticketTransitions` for this ticket, or fallback to `ticket.createdAt`.
     - Calculate `daysInState = Math.floor((Date.now() - new Date(lastTransitionDate).getTime()) / (1000 * 60 * 60 * 24))`.
     - If `daysInState >= STUCK_AFTER_DAYS`, include in `stuck_tickets` with `id`, `title`, `project_name`, `state_name`, `assignee`, `days_in_state`.
   - Calculate summary:
     - `total_tickets = tickets.length`
     - `active_tickets = tickets.filter(t => t.stateId !== readyStateId).length`
     - `stuck_tickets_count = stuck_tickets.length`
     - `idle_members_count = workload.filter(w => w.status === "IDLE").length`
     - `overload_members_count = workload.filter(w => w.status === "OVERLOAD").length`
   - Return `{ summary, workload, stuck_tickets }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter stackgate-api test -- tests/plane-workspaces.test.ts`
Expected: PASS (all 38 tests passing).

- [ ] **Step 5: Check types and lint**

Run: `pnpm --filter stackgate-api check:types && pnpm --filter stackgate-api check:lint`
Commit: `feat(api): add pm dashboard workload and stuck alerts endpoint`

---

### Task 2: Build PM Dashboard View Component (Frontend)

**Files:**
- Modify: `apps/web/core/components/analytics/overview/root.tsx`

**Interfaces:**
- Consumes: `API_BASE_URL` from `@plane/constants`, `useWorkspace` from `@/hooks/store/use-workspace`, SWR, axios
- Produces: `Overview` component with metrics, workload table, and stuck alerts list

- [ ] **Step 1: Replace `Overview` in `apps/web/core/components/analytics/overview/root.tsx`**

Implement `PMDashboardView`:
- Use `useWorkspace()` to get `currentWorkspace?.slug`.
- Fetch data with `useSWR`:
  ```typescript
  const { data, isLoading } = useSWR(
    workspaceSlug ? `PM_DASHBOARD_${workspaceSlug}` : null,
    async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/workspaces/${workspaceSlug}/pm-dashboard`,
        { withCredentials: true }
      );
      return res.data;
    }
  );
  ```
- Render 3 Main Sections:
  1. **Metric Cards (Grid 4 kolom):**
     - Total Tiket Aktif (`summary.active_tickets` dari `summary.total_tickets`)
     - Tiket Stuck > 3 Hari (Badge Merah/Amber jika > 0)
     - Anggota Tim Idle (`summary.idle_members_count`)
     - Anggota Overload (`summary.overload_members_count`)
  2. **Tabel Matriks Beban Kerja Tim (Team Workload Matrix):**
     - Columns: Anggota (Avatar + Nama + Email), Role, Backlog, In Development, Quality Review, Client Ready, Total Aktif, Status Badge (`NORMAL` hijau, `IDLE` biru/abu-abu, `OVERLOAD` merah).
  3. **Panel Peringatan Tiket Stuck (Stuck Tickets Alert):**
     - If `stuck_tickets.length === 0`:
       Tampilkan pesan sukses hijau: *"Semua tiket bergerak lancar, tidak ada tiket macet (>3 hari)."*
     - If ada:
       List card per tiket stuck: Judul tiket, Proyek, Status saat ini, Assignee, dan Badge durasi merah: `${t.days_in_state} Hari di State Ini`.

- [ ] **Step 2: Verify formatting, types, lint, and build**

Run:
`pnpm --filter web fix:format`
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter web build`
Commit: `feat(web): render pm workload matrix and stuck alerts on analytics overview`

---

### Task 3: Quality Gate & E2E Production Verification

- [ ] **Step 1: Run full test suite and push to master**
`pnpm --filter stackgate-api test`
Push to `master` and wait for GitHub Actions CI to pass.

- [ ] **Step 2: Verify in production browser**
- Navigate to `https://stackgate-web.vercel.app/stackgate/analytics/overview`
- Confirm metric cards render with real numbers.
- Confirm Workload Matrix lists members (`Siswa`, `Lead`, `PM`, `diaztmuhammadfirmansyah`).
- Confirm Stuck Alerts panel shows tickets that haven't transitioned in > 3 days.
- Check DevTools console: 0 network errors.
