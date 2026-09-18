# Superadmin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth role (`superadmin`) with a dedicated panel to manage all users (role, active status, password reset) and all projects (create, rename, archive, membership) workspace-wide, without joining Plane's generic invitation-based members system.

**Architecture:** New StackGate-native `/api/admin/*` Hono route family guarded by a `requireSuperadmin` middleware (cookie-session-based, mirrors `resolvePlaneUser`); new frontend route `/settings/superadmin` with its own components, service, and nav-visibility check keyed on the real `role` string (not Plane's generic ADMIN/MEMBER/GUEST numeric levels, which cannot distinguish `pm` from `superadmin`).

**Tech Stack:** Hono, Drizzle ORM, Postgres (Neon), React 19, React Router 8, MobX-free (SWR), `@plane/ui`/`@plane/propel` component primitives.

**Spec:** `docs/superpowers/specs/2026-09-18-superadmin-design.md`

## Global Constraints

- All HTTP access from web components goes through an `APIService` subclass in `packages/services` — no direct `axios`/`fetch` in components.
- Service methods unwrap with `.then((response) => response?.data?.data)` (axios envelope + this API's own `{data: ...}` envelope) and rethrow with `.catch((error) => { throw error?.response; })`.
- No new dependencies. Icons from `lucide-react` or `@makeplane/propel/icons` (matches sibling files) — never emoji/image files.
- `apps/web` has no unit test runner — verify with `pnpm check:types`, `pnpm check:lint`, `pnpm check:format`, and a production build only.
- `apps/api` uses Vitest — every task touching `apps/api` runs `pnpm test` before being considered done. Tests that create rows register them via `trackTicket`/`trackProject` from `apps/api/tests/cleanup.ts`, or delete directly (existing precedent in `plane-auth.test.ts`) for rows those helpers don't cover (users).
- Migrations run against the same Neon database used by local dev and production (`apps/api/.env` `DATABASE_URL`) — additive only (new enum value, new nullable/defaulted columns), never destructive.
- Match existing code conventions exactly: `import type` for type-only imports, explicit descriptive parameter names, license header comment block on new files (copy from a sibling file in the same directory).

---

## File Structure

```
apps/api/src/
  admin/
    guard.ts        # requireSuperadmin middleware
    users.ts         # GET/POST /api/admin/users, PATCH /:id, POST /:id/reset-password
    projects.ts       # GET/POST /api/admin/projects, PATCH /:id, member sub-routes
  db/schema.ts        # + superadmin enum value, users.is_active, projects.archived_at
  auth/middleware.ts   # AuthUser.role widened
  auth/tokens.ts        # AccessPayload.role widened
  plane/routes.ts        # workspaceRoleNumber maps superadmin -> 20
  plane/workspaces.ts      # roleNumber maps superadmin -> 20; export createDefaultProjectStates; toPlaneProject uses real archived_at
  app.ts                    # mount /api/admin
apps/api/tests/admin.test.ts  # new

packages/services/src/admin/
  admin.service.ts    # AdminService extends APIService
  index.ts

packages/types/src/settings.ts        # TWorkspaceSettingsTabs + "superadmin"
packages/constants/src/settings/workspace.ts  # WORKSPACE_SETTINGS["superadmin"]

apps/web/core/components/settings/workspace/sidebar/
  item-icon.tsx        # + superadmin: ShieldOutline
  item-categories.tsx  # + superadmin-only visibility filter

apps/web/app/routes/core.ts   # + route registration

apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/
  page.tsx
  header.tsx

apps/web/core/components/admin/
  users-table.tsx
  create-user-modal.tsx
  reset-password-modal.tsx
  projects-table.tsx
  create-project-modal.tsx
  project-members-modal.tsx
```

---

### Task 1: Schema — superadmin role, users.is_active, projects.archived_at

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Generated: `apps/api/drizzle/0002_*.sql` (via `db:generate`)

**Interfaces:**
- Produces: `roleEnum` now accepts `"superadmin"`; `users.$inferSelect.isActive: boolean`; `projects.$inferSelect.archivedAt: Date | null`. Every later task reads these via `typeof users.$inferSelect` / `typeof projects.$inferSelect` — no manual type re-declaration needed elsewhere.

- [ ] **Step 1: Edit the schema**

In `apps/api/src/db/schema.ts`, change:

```ts
export const roleEnum = pgEnum("role", ["student", "lead", "pm"]);
```

to:

```ts
export const roleEnum = pgEnum("role", ["student", "lead", "pm", "superadmin"]);
```

Then in the `users` table, add `isActive` right after `passwordHash`:

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Then in the `projects` table, add `archivedAt` right after `slug`:

```ts
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Generate the migration**

Run (from `apps/api`): `pnpm db:generate`

Expected: a new file `apps/api/drizzle/0002_*.sql` containing roughly:

```sql
ALTER TYPE "public"."role" ADD VALUE 'superadmin';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "archived_at" timestamp;
```

Read the generated file and confirm it matches this shape (column names, types) before proceeding — drizzle-kit sometimes orders columns differently than written; that's fine, only the statements themselves matter.

- [ ] **Step 3: Apply the migration**

Run (from `apps/api`): `pnpm db:migrate`

Expected: `[✓] migrations applied successfully!`

- [ ] **Step 4: Verify types compile**

Run (from `apps/api`): `pnpm check:types`

Expected: no errors (schema-only change, nothing consumes the new fields yet).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(api): add superadmin role, users.is_active, projects.archived_at"
```

---

### Task 2: Widen auth role types

**Files:**
- Modify: `apps/api/src/auth/middleware.ts`
- Modify: `apps/api/src/auth/tokens.ts`

**Interfaces:**
- Consumes: `roleEnum` from Task 1 (informational only — these are hand-written literal unions, not auto-inferred).
- Produces: `AuthUser.role` and `AccessPayload.role` both accept `"superadmin"`. Task 3's guard imports `AuthUser` from `./middleware.js` (well, `../auth/middleware.js`) and relies on this.

- [ ] **Step 1: Widen `AuthUser`**

In `apps/api/src/auth/middleware.ts`, change:

```ts
export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "lead" | "pm";
}
```

to:

```ts
export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "lead" | "pm" | "superadmin";
}
```

- [ ] **Step 2: Widen `AccessPayload`**

In `apps/api/src/auth/tokens.ts`, change:

```ts
export interface AccessPayload {
  sub: string;
  email: string;
  role: "student" | "lead" | "pm";
}
```

to:

```ts
export interface AccessPayload {
  sub: string;
  email: string;
  role: "student" | "lead" | "pm" | "superadmin";
}
```

- [ ] **Step 3: Verify types compile**

Run (from `apps/api`): `pnpm check:types`

Expected: no errors.

- [ ] **Step 4: Run existing tests**

Run (from `apps/api`): `pnpm test`

Expected: all existing tests still pass (widening a union is backward compatible).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/middleware.ts apps/api/src/auth/tokens.ts
git commit -m "feat(api): widen auth role types to include superadmin"
```

---

### Task 3: Superadmin guard + GET /api/admin/users (first vertical slice)

**Files:**
- Create: `apps/api/src/admin/guard.ts`
- Create: `apps/api/src/admin/users.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/admin.test.ts`

**Interfaces:**
- Consumes: `resolvePlaneUser`, `unauthorized` from `../plane/routes.js`; `AuthUser` from `../auth/middleware.js`; `db`, `users` from `../db/client.js` / `../db/schema.js`.
- Produces: `requireSuperadmin` middleware (exported from `guard.ts`) — every later admin route uses it. Response envelope `{ data: { users: [...] } }` / `{ error: { code, message } }` — every later admin endpoint matches this shape so the frontend service (Task 10) has one unwrap pattern.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/admin.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { users } from "../src/db/schema.js";
import { hashPassword } from "../src/auth/password.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

const createdUserIds: string[] = [];

afterAll(async () => {
  await Promise.all(createdUserIds.map((id) => db.delete(users).where(eq(users.id, id))));
});

async function signIn(app: ReturnType<typeof createApp>, email: string, password = "password"): Promise<string> {
  const login = await app.request("/auth/sign-in/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function createSuperadminAndSignIn(app: ReturnType<typeof createApp>): Promise<string> {
  const email = `admin-test-${Date.now()}@local.dev`;
  const [row] = await db
    .insert(users)
    .values({ email, name: "Test Superadmin", role: "superadmin", passwordHash: await hashPassword("password123") })
    .returning();
  createdUserIds.push(row.id);
  return signIn(app, email, "password123");
}

describe("requireSuperadmin guard", () => {
  it("GET /api/admin/users rejects an unauthenticated request", async () => {
    const res = await createApp().request("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/users rejects a student", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");
    const res = await app.request("/api/admin/users", { headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("GET /api/admin/users rejects a pm", async () => {
    const app = createApp();
    const cookie = await signIn(app, "pm@local.dev");
    const res = await app.request("/api/admin/users", { headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/users returns a user list for a superadmin, without password hashes", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const res = await app.request("/api/admin/users", { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { users: Array<Record<string, unknown>> } };
    expect(Array.isArray(body.data.users)).toBe(true);
    expect(body.data.users.length).toBeGreaterThan(0);
    expect(body.data.users[0]).not.toHaveProperty("passwordHash");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: FAIL — `/api/admin/users` doesn't exist yet (404, not 401/403/200).

- [ ] **Step 3: Write the guard**

Create `apps/api/src/admin/guard.ts`. No files under `apps/api/src` carry a
license header (that convention is `apps/web`/`packages/*` only — this is
original StackGate backend code, not derived from Plane) — match the rest
of `apps/api/src`, which starts straight at the imports:

```ts
import { createMiddleware } from "hono/factory";
import type { AuthUser } from "../auth/middleware.js";
import { resolvePlaneUser, unauthorized } from "../plane/routes.js";

// Admin routes are called from the browser with the same cookie session as
// every other /api/workspaces/* endpoint, never a Bearer token — so this
// guard resolves the user the same way resolvePlaneUser does (Bearer header
// first, falling back to the sg_refresh cookie), not via the Bearer-only
// authMiddleware used by the older /api/tickets/* API.
export const requireSuperadmin = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (user.role !== "superadmin") {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya superadmin yang boleh mengakses ini" } }, 403);
  }
  c.set("user", { id: user.id, email: user.email, role: user.role });
  await next();
});
```

- [ ] **Step 4: Write the users route (list only, for now)**

Create `apps/api/src/admin/users.ts` (no header — same reason as `guard.ts`
above). Give the router the `AuthUser` variable generic up front, matching
`tickets/routes.ts`'s convention, even though this first GET handler doesn't
call `c.get("user")` yet — Task 4's POST/PATCH handlers do:

```ts
import { Hono } from "hono";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { requireSuperadmin } from "./guard.js";
import type { AuthUser } from "../auth/middleware.js";

const adminUsers = new Hono<{ Variables: { user: AuthUser } }>();

adminUsers.get("/users", requireSuperadmin, async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json({ data: { users: rows } });
});

export default adminUsers;
```

- [ ] **Step 5: Mount the router**

In `apps/api/src/app.ts`, add the import near the other route imports:

```ts
import adminUsers from "./admin/users.js";
```

and add the mount line near the other `app.route(...)` calls (after `app.route("/api", ticketsApi);`):

```ts
app.route("/api/admin", adminUsers);
```

- [ ] **Step 6: Run the test to verify it passes**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: PASS (all 4 tests).

- [ ] **Step 7: Run full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/admin/ apps/api/src/app.ts apps/api/tests/admin.test.ts
git commit -m "feat(api): add requireSuperadmin guard and GET /api/admin/users"
```

---

### Task 4: User management — create, update, reset password, self-lockout guard

**Files:**
- Modify: `apps/api/src/admin/users.ts`
- Modify: `apps/api/tests/admin.test.ts`

**Interfaces:**
- Consumes: `hashPassword` from `../auth/password.js`; `readJson`, `invalidJson` from `../http.js`; `and`, `eq` from `drizzle-orm`.
- Produces: `POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password`. Frontend `AdminService.createUser`/`updateUser`/`resetPassword` (Task 10) call these exact paths and bodies.

- [ ] **Step 1: Write the failing tests**

Append to `apps/api/tests/admin.test.ts` (inside a new `describe` block, after the existing one):

```ts
describe("admin user management", () => {
  it("creates a user with a valid role", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const email = `created-${Date.now()}@local.dev`;
    const res = await app.request("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ email, name: "Created User", password: "password123", role: "lead" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { user: { id: string; role: string } } };
    expect(body.data.user.role).toBe("lead");
    expect(body.data.user).not.toHaveProperty("passwordHash");
    createdUserIds.push(body.data.user.id);
  });

  it("rejects creating a user with an invalid role", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const res = await app.request("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ email: `bad-${Date.now()}@local.dev`, name: "Bad", password: "password123", role: "owner" }),
    });
    expect(res.status).toBe(400);
  });

  it("updates a user's role", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const createRes = await app.request("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ email: `patch-${Date.now()}@local.dev`, name: "Patch Target", password: "password123", role: "student" }),
    });
    const created = (await createRes.json()) as { data: { user: { id: string } } };
    createdUserIds.push(created.data.user.id);

    const patchRes = await app.request(`/api/admin/users/${created.data.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ role: "lead" }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { data: { user: { role: string } } };
    expect(patched.data.user.role).toBe("lead");
  });

  it("resets a user's password and the new password logs in", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const email = `reset-${Date.now()}@local.dev`;
    const createRes = await app.request("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ email, name: "Reset Target", password: "originalpass", role: "student" }),
    });
    const created = (await createRes.json()) as { data: { user: { id: string } } };
    createdUserIds.push(created.data.user.id);

    const resetRes = await app.request(`/api/admin/users/${created.data.user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ password: "brandnewpass" }),
    });
    expect(resetRes.status).toBe(200);

    const loginRes = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "brandnewpass" }),
    });
    expect(loginRes.status).toBe(200);
  });

  it("refuses to let the only active superadmin demote themselves", async () => {
    const app = createApp();
    const email = `lonely-admin-${Date.now()}@local.dev`;
    const [row] = await db
      .insert(users)
      .values({ email, name: "Lonely Admin", role: "superadmin", passwordHash: await hashPassword("password123") })
      .returning();
    createdUserIds.push(row.id);
    const cookie = await signIn(app, email, "password123");

    // Demote every OTHER superadmin so this one really is the last, deterministically.
    const otherAdmins = await db.select({ id: users.id }).from(users).where(eq(users.role, "superadmin"));
    const others = otherAdmins.filter((u) => u.id !== row.id);
    await Promise.all(others.map((u) => db.update(users).set({ role: "pm" }).where(eq(users.id, u.id))));

    const res = await app.request(`/api/admin/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ role: "pm" }),
    });
    expect(res.status).toBe(422);

    // Restore the other superadmins so this test doesn't corrupt shared seed data.
    await Promise.all(others.map((u) => db.update(users).set({ role: "superadmin" }).where(eq(users.id, u.id))));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: FAIL — `POST /users`, `PATCH /users/:id`, `POST /users/:id/reset-password` don't exist yet.

- [ ] **Step 3: Implement create, update, reset-password**

Replace the whole content of `apps/api/src/admin/users.ts` with (no header
— same reason as Task 3's `guard.ts`):

```ts
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { invalidJson, readJson } from "../http.js";
import { requireSuperadmin } from "./guard.js";
import type { AuthUser } from "../auth/middleware.js";

const adminUsers = new Hono<{ Variables: { user: AuthUser } }>();

const VALID_ROLES = ["student", "lead", "pm", "superadmin"] as const;
type TAdminRole = (typeof VALID_ROLES)[number];

function isValidRole(value: unknown): value is TAdminRole {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

function publicUser(u: typeof users.$inferSelect) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive, createdAt: u.createdAt };
}

adminUsers.get("/users", requireSuperadmin, async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json({ data: { users: rows } });
});

adminUsers.post("/users", requireSuperadmin, async (c) => {
  const parsed = await readJson<{ email?: string; name?: string; password?: string; role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const email = parsed.body.email?.trim();
  const name = parsed.body.name?.trim();
  const password = parsed.body.password ?? "";
  if (!email || !name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email dan nama wajib diisi" } }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Password minimal 8 karakter" } }, 400);
  }
  if (!isValidRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Email sudah terdaftar" } }, 400);
  }
  const [created] = await db
    .insert(users)
    .values({ email, name, role: parsed.body.role, passwordHash: await hashPassword(password) })
    .returning();
  return c.json({ data: { user: publicUser(created) } }, 201);
});

async function isLastActiveSuperadmin(userId: string): Promise<boolean> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "superadmin"), eq(users.isActive, true)));
  return admins.length <= 1 && admins.some((a) => a.id === userId);
}

adminUsers.patch("/users/:id", requireSuperadmin, async (c) => {
  const actor = c.get("user");
  const targetId = c.req.param("id");
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const parsed = await readJson<{ role?: string; isActive?: boolean; name?: string }>(c);
  if (!parsed.ok) return invalidJson(c);

  const updates: Partial<typeof users.$inferInsert> = {};
  if (parsed.body.role !== undefined) {
    if (!isValidRole(parsed.body.role)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
    }
    updates.role = parsed.body.role;
  }
  if (typeof parsed.body.isActive === "boolean") {
    updates.isActive = parsed.body.isActive;
  }
  if (parsed.body.name !== undefined) {
    const trimmed = parsed.body.name.trim();
    if (!trimmed) return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama tidak boleh kosong" } }, 400);
    updates.name = trimmed;
  }

  const losesSuperadmin = (updates.role !== undefined && updates.role !== "superadmin") || updates.isActive === false;
  if (targetId === actor.id && losesSuperadmin && (await isLastActiveSuperadmin(targetId))) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Tidak bisa menurunkan superadmin aktif terakhir" } },
      422,
    );
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ data: { user: publicUser(target) } });
  }
  const [updated] = await db.update(users).set(updates).where(eq(users.id, targetId)).returning();
  return c.json({ data: { user: publicUser(updated) } });
});

adminUsers.post("/users/:id/reset-password", requireSuperadmin, async (c) => {
  const targetId = c.req.param("id");
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const parsed = await readJson<{ password?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const password = parsed.body.password ?? "";
  if (password.length < 8) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Password minimal 8 karakter" } }, 400);
  }
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, targetId));
  return c.json({ data: { ok: true } });
});

export default adminUsers;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: PASS (all tests in both `describe` blocks).

- [ ] **Step 5: Full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/admin/users.ts apps/api/tests/admin.test.ts
git commit -m "feat(api): add user create/update/reset-password with self-lockout guard"
```

---

### Task 5: Project management — extract default-states helper, create/list projects

**Files:**
- Modify: `apps/api/src/plane/workspaces.ts` (export `createDefaultProjectStates`)
- Create: `apps/api/src/admin/projects.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/tests/admin.test.ts`

**Interfaces:**
- Consumes: `createDefaultProjectStates(projectId: string): Promise<void>` (new export from `plane/workspaces.ts`); `workspaces`, `projects`, `projectMembers`, `states` from `../db/schema.js`.
- Produces: `GET /api/admin/projects`, `POST /api/admin/projects`. Task 6/7 extend this same router.

- [ ] **Step 1: Extract the shared helper in `plane/workspaces.ts`**

In `apps/api/src/plane/workspaces.ts`, find this block inside `planeWorkspaces.post("/:slug/projects", ...)`:

```ts
  // Otomatis buat 4 state default untuk proyek baru
  const defaultStates = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Quality Gate Review", position: "2" },
    { key: "ready", name: "Client Ready", position: "3" },
  ];

  await Promise.all(
    defaultStates.map((s) =>
      db.insert(states).values({
        projectId: newProject.id,
        key: s.key,
        name: s.name,
        position: s.position,
      })
    )
  );
```

Replace it with:

```ts
  await createDefaultProjectStates(newProject.id);
```

Then, above the `planeWorkspaces.post("/:slug/projects", ...)` handler (right after the `identifierFor` function), add the extracted, exported helper:

```ts
// Every new project starts with these 4 fixed states — used both by the
// Plane-compat project-creation endpoint above and by the admin panel's
// own project-creation endpoint (apps/api/src/admin/projects.ts).
export async function createDefaultProjectStates(projectId: string): Promise<void> {
  const defaultStates = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Quality Gate Review", position: "2" },
    { key: "ready", name: "Client Ready", position: "3" },
  ];
  await Promise.all(
    defaultStates.map((s) =>
      db.insert(states).values({ projectId, key: s.key, name: s.name, position: s.position })
    )
  );
}
```

- [ ] **Step 2: Run existing tests to confirm the extraction didn't break anything**

Run (from `apps/api`): `pnpm test`

Expected: all existing tests (especially `plane-workspaces.test.ts` project-creation tests) still pass.

- [ ] **Step 3: Write the failing tests for the new endpoints**

First, add `trackProject` to the existing `import { afterAll, describe, expect, it } from "vitest";` block's neighboring import at the top of `apps/api/tests/admin.test.ts` — change:

```ts
import { hashPassword } from "../src/auth/password.js";
```

to:

```ts
import { hashPassword } from "../src/auth/password.js";
import { trackProject } from "./cleanup.js";
```

Then append the new test block to the end of the file:

```ts
describe("admin project management", () => {
  it("creates a project with default states and lists it", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const res = await app.request("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: `Admin Created ${Date.now()}` }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { project: { id: string; name: string; archivedAt: string | null } } };
    expect(body.data.project.archivedAt).toBeNull();
    trackProject(body.data.project.id);

    const listRes = await app.request("/api/admin/projects", { headers: { Cookie: cookie } });
    const list = (await listRes.json()) as { data: { projects: Array<{ id: string; memberCount: number }> } };
    const found = list.data.projects.find((p) => p.id === body.data.project.id);
    expect(found).toBeDefined();
    expect(found?.memberCount).toBe(0);
  });

  it("rejects creating a project with an empty name", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const res = await app.request("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "  " }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: FAIL — `/api/admin/projects` doesn't exist yet.

- [ ] **Step 5: Implement the route**

Create `apps/api/src/admin/projects.ts` (no header — same reason as Task 3's
`guard.ts`):

```ts
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { projectMembers, projects, workspaces } from "../db/schema.js";
import { invalidJson, readJson } from "../http.js";
import { createDefaultProjectStates } from "../plane/workspaces.js";
import { requireSuperadmin } from "./guard.js";

const adminProjects = new Hono();

function publicProject(p: typeof projects.$inferSelect, memberCount: number) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    memberCount,
  };
}

adminProjects.get("/projects", requireSuperadmin, async (c) => {
  const [rows, memberRows] = await Promise.all([
    db.select().from(projects),
    db.select({ projectId: projectMembers.projectId }).from(projectMembers),
  ]);
  const countByProject = new Map<string, number>();
  for (const m of memberRows) countByProject.set(m.projectId, (countByProject.get(m.projectId) ?? 0) + 1);
  return c.json({ data: { projects: rows.map((p) => publicProject(p, countByProject.get(p.id) ?? 0)) } });
});

adminProjects.post("/projects", requireSuperadmin, async (c) => {
  const parsed = await readJson<{ name?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  const name = parsed.body.name?.trim();
  if (!name) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama proyek wajib diisi" } }, 400);
  }
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return c.json({ error: { code: "NOT_FOUND", message: "Workspace belum ada" } }, 404);

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `project-${Date.now()}`;

  const [created] = await db.insert(projects).values({ workspaceId: ws.id, name, slug }).returning();
  await createDefaultProjectStates(created.id);
  // Superadmin manages every project without needing to be a member of it —
  // no projectMembers row is created here, unlike the Plane-compat endpoint.
  return c.json({ data: { project: publicProject(created, 0) } }, 201);
});

export default adminProjects;
```

- [ ] **Step 6: Mount the router**

In `apps/api/src/app.ts`, add the import:

```ts
import adminProjects from "./admin/projects.js";
```

and the mount line, right after `app.route("/api/admin", adminUsers);`:

```ts
app.route("/api/admin", adminProjects);
```

- [ ] **Step 7: Run the tests to verify they pass**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: PASS.

- [ ] **Step 8: Full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/plane/workspaces.ts apps/api/src/admin/projects.ts apps/api/src/app.ts apps/api/tests/admin.test.ts
git commit -m "feat(api): add admin project create/list, extract default-states helper"
```

---

### Task 6: Rename & archive a project

**Files:**
- Modify: `apps/api/src/admin/projects.ts`
- Modify: `apps/api/tests/admin.test.ts`

**Interfaces:**
- Produces: `PATCH /api/admin/projects/:id`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe("admin project management", ...)` block in `apps/api/tests/admin.test.ts`:

```ts
  it("renames and archives, then unarchives a project", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const createRes = await app.request("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: `Archive Test ${Date.now()}` }),
    });
    const created = (await createRes.json()) as { data: { project: { id: string } } };
    trackProject(created.data.project.id);

    const renameRes = await app.request(`/api/admin/projects/${created.data.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Renamed Project" }),
    });
    expect(renameRes.status).toBe(200);
    const renamed = (await renameRes.json()) as { data: { project: { name: string } } };
    expect(renamed.data.project.name).toBe("Renamed Project");

    const archiveRes = await app.request(`/api/admin/projects/${created.data.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ archived: true }),
    });
    const archived = (await archiveRes.json()) as { data: { project: { archivedAt: string | null } } };
    expect(archived.data.project.archivedAt).not.toBeNull();

    const unarchiveRes = await app.request(`/api/admin/projects/${created.data.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ archived: false }),
    });
    const unarchived = (await unarchiveRes.json()) as { data: { project: { archivedAt: string | null } } };
    expect(unarchived.data.project.archivedAt).toBeNull();
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: FAIL — `PATCH /api/admin/projects/:id` doesn't exist yet.

- [ ] **Step 3: Implement the route**

In `apps/api/src/admin/projects.ts`, add this handler right after `adminProjects.post("/projects", ...)`:

```ts
adminProjects.patch("/projects/:id", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!existing) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);

  const parsed = await readJson<{ name?: string; archived?: boolean }>(c);
  if (!parsed.ok) return invalidJson(c);

  const updates: Partial<typeof projects.$inferInsert> = {};
  if (parsed.body.name !== undefined) {
    const trimmed = parsed.body.name.trim();
    if (!trimmed) return c.json({ error: { code: "VALIDATION_ERROR", message: "Nama proyek tidak boleh kosong" } }, 400);
    updates.name = trimmed;
  }
  if (typeof parsed.body.archived === "boolean") {
    updates.archivedAt = parsed.body.archived ? new Date() : null;
  }

  if (Object.keys(updates).length === 0) {
    const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    return c.json({ data: { project: publicProject(existing, memberRows.length) } });
  }
  const [updated] = await db.update(projects).set(updates).where(eq(projects.id, projectId)).returning();
  const memberRows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
  return c.json({ data: { project: publicProject(updated, memberRows.length) } });
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: PASS.

- [ ] **Step 5: Full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/admin/projects.ts apps/api/tests/admin.test.ts
git commit -m "feat(api): add project rename/archive endpoint"
```

---

### Task 7: Project membership management

**Files:**
- Modify: `apps/api/src/admin/projects.ts`
- Modify: `apps/api/tests/admin.test.ts`

**Interfaces:**
- Produces: `GET/POST /api/admin/projects/:id/members`, `PATCH/DELETE /api/admin/projects/:id/members/:userId`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe("admin project management", ...)`:

```ts
  it("manages project membership: add, list, change role, remove", async () => {
    const app = createApp();
    const cookie = await createSuperadminAndSignIn(app);
    const projectRes = await app.request("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: `Membership Test ${Date.now()}` }),
    });
    const project = (await projectRes.json()) as { data: { project: { id: string } } };
    trackProject(project.data.project.id);

    const [student] = await db.select().from(users).where(eq(users.email, "siswa@local.dev")).limit(1);

    const addRes = await app.request(`/api/admin/projects/${project.data.project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ userId: student.id, role: "student" }),
    });
    expect(addRes.status).toBe(201);

    const listRes = await app.request(`/api/admin/projects/${project.data.project.id}/members`, {
      headers: { Cookie: cookie },
    });
    const list = (await listRes.json()) as { data: { members: Array<{ userId: string; role: string }> } };
    expect(list.data.members.some((m) => m.userId === student.id)).toBe(true);

    const dupRes = await app.request(`/api/admin/projects/${project.data.project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ userId: student.id, role: "student" }),
    });
    expect(dupRes.status).toBe(400);

    const patchRes = await app.request(`/api/admin/projects/${project.data.project.id}/members/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ role: "lead" }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { data: { member: { role: string } } };
    expect(patched.data.member.role).toBe("lead");

    const deleteRes = await app.request(`/api/admin/projects/${project.data.project.id}/members/${student.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(200);

    const listAfterRes = await app.request(`/api/admin/projects/${project.data.project.id}/members`, {
      headers: { Cookie: cookie },
    });
    const listAfter = (await listAfterRes.json()) as { data: { members: Array<{ userId: string }> } };
    expect(listAfter.data.members.some((m) => m.userId === student.id)).toBe(false);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: FAIL — member sub-routes don't exist yet.

- [ ] **Step 3: Implement the routes**

In `apps/api/src/admin/projects.ts`:

Change the import line to include `users`:

```ts
import { projectMembers, projects, users, workspaces } from "../db/schema.js";
```

Add `and` to the drizzle-orm import:

```ts
import { and, eq } from "drizzle-orm";
```

Then add these handlers at the end of the file, before `export default adminProjects;`:

```ts
const VALID_MEMBER_ROLES = ["student", "lead", "pm", "superadmin"] as const;
type TMemberRole = (typeof VALID_MEMBER_ROLES)[number];

function isValidMemberRole(value: unknown): value is TMemberRole {
  return typeof value === "string" && (VALID_MEMBER_ROLES as readonly string[]).includes(value);
}

adminProjects.get("/projects/:id/members", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const rows = await db
    .select({ id: projectMembers.id, userId: projectMembers.userId, role: projectMembers.role })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const allUsers = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);
  const userById = new Map(allUsers.map((u) => [u.id, u]));
  return c.json({
    data: {
      members: rows.map((r) => ({
        userId: r.userId,
        role: r.role,
        email: userById.get(r.userId)?.email ?? "",
        name: userById.get(r.userId)?.name ?? "",
      })),
    },
  });
});

adminProjects.post("/projects/:id/members", requireSuperadmin, async (c) => {
  const projectId = c.req.param("id");
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return c.json({ error: { code: "NOT_FOUND", message: "Proyek tidak ditemukan" } }, 404);

  const parsed = await readJson<{ userId?: string; role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  if (!parsed.body.userId || !isValidMemberRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "userId dan role wajib diisi dengan benar" } }, 400);
  }
  const [targetUser] = await db.select().from(users).where(eq(users.id, parsed.body.userId)).limit(1);
  if (!targetUser) return c.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, 404);

  const [existingMembership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, parsed.body.userId)))
    .limit(1);
  if (existingMembership) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Sudah menjadi anggota proyek ini" } }, 400);
  }

  await db.insert(projectMembers).values({ projectId, userId: parsed.body.userId, role: parsed.body.role });
  return c.json(
    { data: { member: { userId: targetUser.id, role: parsed.body.role, email: targetUser.email, name: targetUser.name } } },
    201,
  );
});

adminProjects.patch("/projects/:id/members/:userId", requireSuperadmin, async (c) => {
  const { id: projectId, userId } = c.req.param();
  const [membership] = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  if (!membership) return c.json({ error: { code: "NOT_FOUND", message: "Keanggotaan tidak ditemukan" } }, 404);

  const parsed = await readJson<{ role?: string }>(c);
  if (!parsed.ok) return invalidJson(c);
  if (!isValidMemberRole(parsed.body.role)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Role tidak dikenal" } }, 400);
  }
  await db.update(projectMembers).set({ role: parsed.body.role }).where(eq(projectMembers.id, membership.id));
  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return c.json({ data: { member: { userId, role: parsed.body.role, email: targetUser?.email ?? "", name: targetUser?.name ?? "" } } });
});

adminProjects.delete("/projects/:id/members/:userId", requireSuperadmin, async (c) => {
  const { id: projectId, userId } = c.req.param();
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  return c.json({ data: { ok: true } });
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `apps/api`): `npx vitest run tests/admin.test.ts`

Expected: PASS.

- [ ] **Step 5: Full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/admin/projects.ts apps/api/tests/admin.test.ts
git commit -m "feat(api): add project membership management endpoints"
```

---

### Task 8: Wire superadmin into Plane-compat role numbers and archived_at

**Files:**
- Modify: `apps/api/src/plane/routes.ts`
- Modify: `apps/api/src/plane/workspaces.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `workspaceRoleNumber("superadmin") === 20`; `roleNumber("superadmin") === 20`; `toPlaneProject` reflects the real `archivedAt` instead of a hardcoded `null`.

- [ ] **Step 1: Update `workspaceRoleNumber` in `plane/routes.ts`**

Change:

```ts
export function workspaceRoleNumber(role: UserRow["role"]): number {
  if (role === "pm") return 20;
  return role === "lead" ? 15 : 5;
}
```

to:

```ts
export function workspaceRoleNumber(role: UserRow["role"]): number {
  if (role === "pm" || role === "superadmin") return 20;
  return role === "lead" ? 15 : 5;
}
```

- [ ] **Step 2: Update `roleNumber` in `plane/workspaces.ts`**

Change:

```ts
function roleNumber(role: UserRow["role"]): number {
  return role === "pm" ? 20 : 15;
}
```

to:

```ts
function roleNumber(role: UserRow["role"]): number {
  return role === "pm" || role === "superadmin" ? 20 : 15;
}
```

- [ ] **Step 3: Fix `toPlaneProject`'s hardcoded `archived_at`**

In `apps/api/src/plane/workspaces.ts`, find `function toPlaneProject(...)` and change:

```ts
    archived_at: null,
```

to:

```ts
    archived_at: p.archivedAt ? p.archivedAt.toISOString() : null,
```

- [ ] **Step 4: Run full suite, types, lint**

Run (from `apps/api`): `pnpm check:types && pnpm check:lint && pnpm test`

Expected: all green — existing `plane-workspaces.test.ts` tests still pass (they don't assert `archived_at`'s exact value beyond it being present, and role-number tests were pm/lead/student only, unaffected by the added `superadmin` branch).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/plane/routes.ts apps/api/src/plane/workspaces.ts
git commit -m "feat(api): map superadmin to admin role number, surface real archived_at"
```

---

### Task 9: Bootstrap — promote the first superadmin

**Files:** none (one-off data change against Neon, not a code change)

**Interfaces:** none.

- [ ] **Step 1: Promote the account**

Run from the repo root (uses the same `apps/api/.env` `DATABASE_URL` as every other command in this plan):

```bash
node -e "
const { Client } = require('./apps/api/node_modules/pg');
require('./apps/api/node_modules/dotenv').config({path:'./apps/api/.env'});
const c = new Client({connectionString: process.env.DATABASE_URL});
c.connect().then(async ()=>{
  await c.query(\"update users set role = 'superadmin' where email = 'diaztmuhammadfirmansyah@gmail.com'\");
  const after = await c.query(\"select email, role, is_active from users where email = 'diaztmuhammadfirmansyah@gmail.com'\");
  console.log('after:', after.rows);
  await c.end();
});
"
```

Expected output: `after: [ { email: 'diaztmuhammadfirmansyah@gmail.com', role: 'superadmin', is_active: true } ]`

Note: this account's `workspace_members`/`project_members` rows stay `role: 'pm'` (set in the earlier session) — that's fine, those tables only drive project-level permissions (`roleNumber`), and `pm` already maps to the same `20` as `superadmin` there. The panel's own access check reads `users.role` directly, not these join-table rows.

- [ ] **Step 2: Verify via the API**

With the API dev server running (`pnpm dev` from `apps/api`), sign in as `diaztmuhammadfirmansyah@gmail.com` through the web app and confirm `GET /api/admin/users` returns `200` (not `403`) — this will only fully work once Task 3 is deployed, but the DB state is correct regardless of deploy order.

(No commit — this step only changes data, not code.)

---

### Task 10: AdminService (frontend HTTP client)

**Files:**
- Create: `packages/services/src/admin/admin.service.ts`
- Create: `packages/services/src/admin/index.ts`
- Modify: `packages/services/src/index.ts`

**Interfaces:**
- Consumes: `APIService` from `../api.service.js`; `API_BASE_URL` from `@plane/constants`.
- Produces: `AdminService` class with methods `listUsers`, `createUser`, `updateUser`, `resetPassword`, `listProjects`, `createProject`, `updateProject`, `listProjectMembers`, `addProjectMember`, `updateProjectMember`, `removeProjectMember`, and the `TAdminUser` / `TAdminProject` / `TAdminProjectMember` types every frontend component in Tasks 12–14 imports from `@plane/services`.

- [ ] **Step 1: Write the service**

Create `packages/services/src/admin/admin.service.ts`:

```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "../api.service";

export type TAdminRole = "student" | "lead" | "pm" | "superadmin";

export type TAdminUser = {
  id: string;
  email: string;
  name: string;
  role: TAdminRole;
  isActive: boolean;
  createdAt: string;
};

export type TAdminProject = {
  id: string;
  name: string;
  slug: string;
  archivedAt: string | null;
  createdAt: string;
  memberCount: number;
};

export type TAdminProjectMember = {
  userId: string;
  role: TAdminRole;
  email: string;
  name: string;
};

/**
 * Service class for the superadmin panel: user and project management
 * endpoints under /api/admin/*. StackGate-native — does not follow Plane's
 * generic member/invitation shapes.
 * @extends {APIService}
 */
export class AdminService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async listUsers(): Promise<TAdminUser[]> {
    return this.get("/api/admin/users")
      .then((response) => response?.data?.data?.users as TAdminUser[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async createUser(data: { email: string; name: string; password: string; role: TAdminRole }): Promise<TAdminUser> {
    return this.post("/api/admin/users", data)
      .then((response) => response?.data?.data?.user as TAdminUser)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateUser(userId: string, data: { role?: TAdminRole; isActive?: boolean; name?: string }): Promise<TAdminUser> {
    return this.patch(`/api/admin/users/${userId}`, data)
      .then((response) => response?.data?.data?.user as TAdminUser)
      .catch((error) => {
        throw error?.response;
      });
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    return this.post(`/api/admin/users/${userId}/reset-password`, { password })
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listProjects(): Promise<TAdminProject[]> {
    return this.get("/api/admin/projects")
      .then((response) => response?.data?.data?.projects as TAdminProject[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async createProject(name: string): Promise<TAdminProject> {
    return this.post("/api/admin/projects", { name })
      .then((response) => response?.data?.data?.project as TAdminProject)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProject(projectId: string, data: { name?: string; archived?: boolean }): Promise<TAdminProject> {
    return this.patch(`/api/admin/projects/${projectId}`, data)
      .then((response) => response?.data?.data?.project as TAdminProject)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listProjectMembers(projectId: string): Promise<TAdminProjectMember[]> {
    return this.get(`/api/admin/projects/${projectId}/members`)
      .then((response) => response?.data?.data?.members as TAdminProjectMember[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async addProjectMember(projectId: string, userId: string, role: TAdminRole): Promise<TAdminProjectMember> {
    return this.post(`/api/admin/projects/${projectId}/members`, { userId, role })
      .then((response) => response?.data?.data?.member as TAdminProjectMember)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectMember(projectId: string, userId: string, role: TAdminRole): Promise<TAdminProjectMember> {
    return this.patch(`/api/admin/projects/${projectId}/members/${userId}`, { role })
      .then((response) => response?.data?.data?.member as TAdminProjectMember)
      .catch((error) => {
        throw error?.response;
      });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return this.delete(`/api/admin/projects/${projectId}/members/${userId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }
}
```

- [ ] **Step 2: Export it**

Create `packages/services/src/admin/index.ts`:

```ts
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export * from "./admin.service";
```

In `packages/services/src/index.ts`, add (alphabetically among the other `export * from "./..."` lines):

```ts
export * from "./admin";
```

- [ ] **Step 3: Build and typecheck the package**

Run (from `packages/services`): `pnpm build && pnpm check:types`

Expected: build succeeds, no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/services/src/admin/ packages/services/src/index.ts
git commit -m "feat(services): add AdminService for the superadmin panel"
```

---

### Task 11: Settings type, constants, icon, and superadmin-only nav visibility

**Files:**
- Modify: `packages/types/src/settings.ts`
- Modify: `packages/constants/src/settings/workspace.ts`
- Modify: `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx`
- Modify: `apps/web/core/components/settings/workspace/sidebar/item-categories.tsx`
- Modify: `packages/i18n/src/locales/en/workspace-settings.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `WORKSPACE_SETTINGS.superadmin` (used by Task 12's `header.tsx`); the sidebar link only renders for `currentUser.role === "superadmin"`.

- [ ] **Step 1: Widen the settings tab type**

In `packages/types/src/settings.ts`, change:

```ts
export type TWorkspaceSettingsTabs = "general" | "members" | "billing-and-plans" | "export" | "webhooks";
```

to:

```ts
export type TWorkspaceSettingsTabs = "general" | "members" | "billing-and-plans" | "export" | "webhooks" | "superadmin";
```

- [ ] **Step 2: Add the settings entry**

In `packages/constants/src/settings/workspace.ts`, add a new entry to the `WORKSPACE_SETTINGS` record, right after `members`:

```ts
  superadmin: {
    key: "superadmin",
    i18n_label: "workspace_settings.settings.superadmin.title",
    href: `/settings/superadmin`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/superadmin/`,
  },
```

Then add it to the administration category, right after `WORKSPACE_SETTINGS["members"]`:

```ts
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: [
    WORKSPACE_SETTINGS["general"],
    WORKSPACE_SETTINGS["members"],
    WORKSPACE_SETTINGS["superadmin"],
    WORKSPACE_SETTINGS["billing-and-plans"],
    WORKSPACE_SETTINGS["export"],
  ],
```

- [ ] **Step 3: Add the sidebar icon**

In `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx`, add `ShieldOutline` to the import:

```ts
import {
  BillingsOutline,
  BuildingOutline,
  ExportOutline,
  MembersOutline,
  ShieldOutline,
  WebhooksOutline,
} from "@makeplane/propel/icons";
```

and add the entry to the record:

```ts
export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: BuildingOutline,
  members: MembersOutline,
  superadmin: ShieldOutline,
  export: ExportOutline,
  "billing-and-plans": BillingsOutline,
  webhooks: WebhooksOutline,
};
```

- [ ] **Step 4: Gate visibility to real superadmins**

In `apps/web/core/components/settings/workspace/sidebar/item-categories.tsx`, add the import:

```ts
import { useUser } from "@/hooks/store/user";
```

Add the hook call next to the existing store hooks:

```ts
  const { data: currentUser } = useUser();
```

Change:

```ts
        const accessibleItems = categoryItems.filter((item) =>
          allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug)
        );
```

to:

```ts
        const accessibleItems = categoryItems.filter((item) => {
          if (item.key === "superadmin") return currentUser?.role === "superadmin";
          return allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug);
        });
```

- [ ] **Step 5: Add the English translation key**

In `packages/i18n/src/locales/en/workspace-settings.json`, inside `workspace_settings.settings`, add a new `"superadmin"` sibling key next to `"members"`:

```json
    "superadmin": {
      "title": "Superadmin"
    },
```

- [ ] **Step 6: Typecheck**

Run (from `packages/types`): `pnpm check:types`
Run (from `packages/constants`): `pnpm build && pnpm check:types`
Run (from `apps/web`): `pnpm check:types`

Expected: no errors. (The `Record<TWorkspaceSettingsTabs, ...>` in `item-icon.tsx` would fail to compile if the `superadmin` key were missing — this confirms Step 3 was necessary, not optional.)

- [ ] **Step 7: Commit**

```bash
git add packages/types/src/settings.ts packages/constants/src/settings/workspace.ts apps/web/core/components/settings/workspace/sidebar/item-icon.tsx apps/web/core/components/settings/workspace/sidebar/item-categories.tsx packages/i18n/src/locales/en/workspace-settings.json
git commit -m "feat(web): add superadmin settings entry, gated to the real role"
```

---

### Task 12: Route skeleton — `/settings/superadmin` with Users/Projects tabs

**Files:**
- Modify: `apps/web/app/routes/core.ts`
- Create: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/header.tsx`
- Create: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/page.tsx`

**Interfaces:**
- Consumes: `WORKSPACE_SETTINGS.superadmin` (Task 11); `NotAuthorizedView`, `SettingsContentWrapper`, `PageHead` (existing, same imports as sibling `members/page.tsx`).
- Produces: the page shell that Tasks 13–14 fill with `<UsersTable />` and `<ProjectsTable />`.

- [ ] **Step 1: Register the route**

In `apps/web/app/routes/core.ts`, find:

```ts
          route(
            ":workspaceSlug/settings/members",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"
          ),
```

and add, right after it:

```ts
          route(
            ":workspaceSlug/settings/superadmin",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/page.tsx"
          ),
```

- [ ] **Step 2: Write the header**

Create `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/header.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

export const SuperadminWorkspaceSettingsHeader = observer(function SuperadminWorkspaceSettingsHeader() {
  const { t } = useTranslation();
  const settingsDetails = WORKSPACE_SETTINGS.superadmin;
  const Icon = WORKSPACE_SETTINGS_ICONS.superadmin;

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t(settingsDetails.i18n_label)}
                  icon={<Icon className="size-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
```

- [ ] **Step 3: Write the page shell**

Create `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/page.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { UsersTable } from "@/components/admin/users-table";
import { ProjectsTable } from "@/components/admin/projects-table";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { SuperadminWorkspaceSettingsHeader } from "./header";

type TTab = "users" | "projects";

const SuperadminSettingsPage = observer(function SuperadminSettingsPage() {
  const [tab, setTab] = useState<TTab>("users");
  const { data: currentUser } = useUser();

  if (currentUser && currentUser.role !== "superadmin") {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<SuperadminWorkspaceSettingsHeader />} hugging>
      <PageHead title="Superadmin" />
      <div className="flex items-center gap-1 border-b border-subtle pb-2">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`rounded-md px-3 py-1.5 text-body-sm-medium ${tab === "users" ? "bg-layer-2 text-primary" : "text-tertiary"}`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab("projects")}
          className={`rounded-md px-3 py-1.5 text-body-sm-medium ${tab === "projects" ? "bg-layer-2 text-primary" : "text-tertiary"}`}
        >
          Projects
        </button>
      </div>
      <div className="pt-4">{tab === "users" ? <UsersTable /> : <ProjectsTable />}</div>
    </SettingsContentWrapper>
  );
});

export default SuperadminSettingsPage;
```

Note: `UsersTable`/`ProjectsTable` don't exist yet — Tasks 13/14 create them. This is expected; the next step's typecheck will fail until then, which is why this task's own verification step only confirms the route resolves and renders the tab shell (via `check:types` failing on the two missing imports is acceptable to note but not required to pass here) — however, to keep every task's `check:types` genuinely green per the Global Constraints, create minimal placeholder components now and let Tasks 13/14 replace their bodies.

- [ ] **Step 4: Create minimal placeholders so this task typechecks green on its own**

Create `apps/web/core/components/admin/users-table.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function UsersTable() {
  return <div className="text-tertiary">Loading users…</div>;
}
```

Create `apps/web/core/components/admin/projects-table.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function ProjectsTable() {
  return <div className="text-tertiary">Loading projects…</div>;
}
```

(Tasks 13 and 14 replace these two files' full contents — this is scaffolding the page needs to compile, not a placeholder left unfinished, per the plan's own file structure.)

- [ ] **Step 5: Typecheck and build**

Run (from `apps/web`): `pnpm check:types`

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/routes/core.ts "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/superadmin/" apps/web/core/components/admin/
git commit -m "feat(web): add /settings/superadmin route shell with tab scaffolding"
```

---

### Task 13: Users tab — table, create-user modal, reset-password modal

**Files:**
- Modify: `apps/web/core/components/admin/users-table.tsx` (replace placeholder)
- Create: `apps/web/core/components/admin/create-user-modal.tsx`
- Create: `apps/web/core/components/admin/reset-password-modal.tsx`

**Interfaces:**
- Consumes: `AdminService`, `TAdminUser`, `TAdminRole` from `@plane/services` (Task 10).
- Produces: `<UsersTable />`, consumed by Task 12's `page.tsx` (already wired).

- [ ] **Step 1: Write the create-user modal**

Create `apps/web/core/components/admin/create-user-modal.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminRole, TAdminUser } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (user: TAdminUser) => void;
};

const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

export function CreateUserModal(props: Props) {
  const { isOpen, onClose, onCreated } = props;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TAdminRole>("student");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail("");
    setName("");
    setPassword("");
    setRole("student");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = await adminService.createUser({ email, name, password, role });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Akun ${user.email} dibuat` });
      onCreated(user);
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal membuat akun" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Buat Akun Baru</h3>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Password (min. 8 karakter)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TAdminRole)}
          className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2.5 py-1.5 text-13"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!email || !name || password.length < 8}
            onClick={handleSubmit}
          >
            Buat
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
```

- [ ] **Step 2: Write the reset-password modal**

Create `apps/web/core/components/admin/reset-password-modal.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  userId: string | null;
  userEmail: string;
  onClose: () => void;
};

export function ResetPasswordModal(props: Props) {
  const { isOpen, userId, userEmail, onClose } = props;
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await adminService.resetPassword(userId, password);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Password ${userEmail} diperbarui` });
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal reset password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Reset Password — {userEmail}</h3>
        <Input
          placeholder="Password baru (min. 8 karakter)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={submitting} disabled={password.length < 8} onClick={handleSubmit}>
            Reset
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
```

- [ ] **Step 3: Replace the users table placeholder**

Replace the full content of `apps/web/core/components/admin/users-table.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminRole, TAdminUser } from "@plane/services";
import { AdminService } from "@plane/services";
import { CreateUserModal } from "./create-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";

const adminService = new AdminService();
const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

export function UsersTable() {
  const { data: users, mutate } = useSWR<TAdminUser[]>("admin-users", () => adminService.listUsers());
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<TAdminUser | null>(null);

  const handleRoleChange = async (user: TAdminUser, role: TAdminRole) => {
    try {
      await adminService.updateUser(user.id, { role });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah role" });
    }
  };

  const handleToggleActive = async (user: TAdminUser) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah status" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          Buat Akun
        </Button>
      </div>
      <table className="w-full text-body-sm-regular">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="py-2">Nama</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user.id} className="border-b border-subtle">
              <td className="py-2">{user.name}</td>
              <td className="py-2">{user.email}</td>
              <td className="py-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value as TAdminRole)}
                  className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 py-1 text-12"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2">
                <Button variant={user.isActive ? "ghost" : "danger"} size="sm" onClick={() => handleToggleActive(user)}>
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </Button>
              </td>
              <td className="py-2">
                <Button variant="ghost" size="sm" onClick={() => setResetTarget(user)}>
                  Reset Password
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => mutate()} />
      <ResetPasswordModal
        isOpen={!!resetTarget}
        userId={resetTarget?.id ?? null}
        userEmail={resetTarget?.email ?? ""}
        onClose={() => setResetTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run (from `apps/web`): `pnpm check:types`

Expected: no errors. If `Button`'s `variant` prop doesn't accept `"danger"`, check `packages/propel/src/button/helper.tsx`'s `buttonVariants` options and swap to whichever destructive variant name exists there (e.g. it may be spelled differently) — read that file before making the substitution.

- [ ] **Step 5: Format and lint**

Run (from `apps/web`): `pnpm check:format` — if it reports issues, run `pnpm fix:format`, then re-run `pnpm check:types`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/core/components/admin/users-table.tsx apps/web/core/components/admin/create-user-modal.tsx apps/web/core/components/admin/reset-password-modal.tsx
git commit -m "feat(web): add users tab — table, create-user and reset-password modals"
```

---

### Task 14: Projects tab — table, create-project modal, membership modal

**Files:**
- Modify: `apps/web/core/components/admin/projects-table.tsx` (replace placeholder)
- Create: `apps/web/core/components/admin/create-project-modal.tsx`
- Create: `apps/web/core/components/admin/project-members-modal.tsx`

**Interfaces:**
- Consumes: `AdminService`, `TAdminProject`, `TAdminProjectMember`, `TAdminRole` from `@plane/services` (Task 10).
- Produces: `<ProjectsTable />`, consumed by Task 12's `page.tsx` (already wired).

- [ ] **Step 1: Write the create-project modal**

Create `apps/web/core/components/admin/create-project-modal.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProject } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: TAdminProject) => void;
};

export function CreateProjectModal(props: Props) {
  const { isOpen, onClose, onCreated } = props;
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const project = await adminService.createProject(name);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Berhasil", message: `Proyek ${project.name} dibuat` });
      onCreated(project);
      handleClose();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal membuat proyek" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Buat Proyek Baru</h3>
        <Input placeholder="Nama proyek" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Batal
          </Button>
          <Button variant="primary" size="sm" loading={submitting} disabled={!name.trim()} onClick={handleSubmit}>
            Buat
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
```

- [ ] **Step 2: Write the project-members modal**

Create `apps/web/core/components/admin/project-members-modal.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProjectMember, TAdminRole } from "@plane/services";
import { AdminService } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const adminService = new AdminService();
const ROLE_OPTIONS: TAdminRole[] = ["student", "lead", "pm", "superadmin"];

type Props = {
  isOpen: boolean;
  projectId: string | null;
  projectName: string;
  onClose: () => void;
  onChanged: () => void;
};

export function ProjectMembersModal(props: Props) {
  const { isOpen, projectId, projectName, onClose, onChanged } = props;
  const { data: members, mutate } = useSWR<TAdminProjectMember[]>(
    projectId ? `admin-project-members-${projectId}` : null,
    () => adminService.listProjectMembers(projectId as string)
  );
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<TAdminRole>("student");

  const refresh = async () => {
    await mutate();
    onChanged();
  };

  const handleAdd = async () => {
    if (!projectId || !newUserId.trim()) return;
    try {
      await adminService.addProjectMember(projectId, newUserId.trim(), newRole);
      setNewUserId("");
      await refresh();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal menambah anggota" });
    }
  };

  const handleRoleChange = async (userId: string, role: TAdminRole) => {
    if (!projectId) return;
    await adminService.updateProjectMember(projectId, userId, role);
    await refresh();
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) return;
    await adminService.removeProjectMember(projectId, userId);
    await refresh();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-h4-medium">Anggota — {projectName}</h3>
        <table className="w-full text-body-sm-regular">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="py-2">Nama</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.userId} className="border-b border-subtle">
                <td className="py-2">{member.name}</td>
                <td className="py-2">{member.email}</td>
                <td className="py-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as TAdminRole)}
                    className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 py-1 text-12"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(member.userId)}>
                    Keluarkan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-end gap-2 border-t border-subtle pt-3">
          <Input placeholder="User ID" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as TAdminRole)}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2.5 py-1.5 text-13"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            Tambah
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
```

Note: adding by raw User ID is deliberately minimal (YAGNI) — the Users tab (Task 13) is where an admin looks up a user's id via the table; a search-by-email combobox would duplicate `MemberOptions`-style dropdown machinery this plan otherwise avoids. Upgrade to a search dropdown only if the raw-ID flow proves too rough in practice.

- [ ] **Step 3: Replace the projects table placeholder**

Replace the full content of `apps/web/core/components/admin/projects-table.tsx`:

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAdminProject } from "@plane/services";
import { AdminService } from "@plane/services";
import { renderFormattedDate } from "@plane/utils";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectMembersModal } from "./project-members-modal";

const adminService = new AdminService();

export function ProjectsTable() {
  const { data: projects, mutate } = useSWR<TAdminProject[]>("admin-projects", () => adminService.listProjects());
  const [createOpen, setCreateOpen] = useState(false);
  const [membersTarget, setMembersTarget] = useState<TAdminProject | null>(null);

  const handleToggleArchive = async (project: TAdminProject) => {
    try {
      await adminService.updateProject(project.id, { archived: !project.archivedAt });
      await mutate();
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } } | undefined)?.error?.message;
      setToast({ type: TOAST_TYPE.ERROR, title: "Gagal", message: message ?? "Gagal mengubah status arsip" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          Buat Proyek
        </Button>
      </div>
      <table className="w-full text-body-sm-regular">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="py-2">Nama</th>
            <th className="py-2">Anggota</th>
            <th className="py-2">Dibuat</th>
            <th className="py-2">Status</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {projects?.map((project) => (
            <tr key={project.id} className="border-b border-subtle">
              <td className="py-2">{project.name}</td>
              <td className="py-2">{project.memberCount}</td>
              <td className="py-2">{renderFormattedDate(project.createdAt)}</td>
              <td className="py-2">
                <Button variant={project.archivedAt ? "danger" : "ghost"} size="sm" onClick={() => handleToggleArchive(project)}>
                  {project.archivedAt ? "Diarsipkan" : "Aktif"}
                </Button>
              </td>
              <td className="py-2">
                <Button variant="ghost" size="sm" onClick={() => setMembersTarget(project)}>
                  Kelola Anggota
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => mutate()} />
      <ProjectMembersModal
        isOpen={!!membersTarget}
        projectId={membersTarget?.id ?? null}
        projectName={membersTarget?.name ?? ""}
        onClose={() => setMembersTarget(null)}
        onChanged={() => mutate()}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run (from `apps/web`): `pnpm check:types`

Expected: no errors. Same caveat as Task 13 Step 4 regarding the `Button` `variant="danger"` name — verify against `packages/propel/src/button/helper.tsx` and adjust if the actual variant is named differently.

- [ ] **Step 5: Format, lint, and production build**

Run (from `apps/web`): `pnpm check:format` (or `pnpm fix:format` then re-check), `pnpm check:lint`, then `pnpm build`.

Expected: all pass. The production build is the final end-to-end confidence check for this whole feature on the frontend, per the Global Constraints (`apps/web` has no unit test runner).

- [ ] **Step 6: Commit**

```bash
git add apps/web/core/components/admin/projects-table.tsx apps/web/core/components/admin/create-project-modal.tsx apps/web/core/components/admin/project-members-modal.tsx
git commit -m "feat(web): add projects tab — table, create-project and membership modals"
```

---

## Manual Verification (after all tasks)

1. Start both dev servers (`pnpm dev` in `apps/api`, `pnpm dev` in `apps/web`).
2. Sign in as `pm@local.dev` — confirm **no** "Superadmin" entry appears in Settings → Administration.
3. Sign in as `diaztmuhammadfirmansyah@gmail.com` (now `superadmin` after Task 9) — confirm the entry appears, the page loads, both tabs render.
4. Create a test user, change its role, reset its password, sign in as it with the new password.
5. Create a test project, rename it, archive it (confirm it still lists, marked archived), add the test user as a member, change their project role, remove them.
6. Confirm `pnpm test` in `apps/api` is fully green and `pnpm check:types && pnpm check:lint && pnpm check:format && pnpm build` in `apps/web` is fully green.
