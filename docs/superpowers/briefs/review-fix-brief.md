# Review-Fix Brief — Plan 01 final review findings (single fix wave)

Source: whole-branch reviewer verdict "merge With fixes" (Critical 2 + Important 5 + Minor terkait).
Branch: `plan-01-foundation` (base `48a7063`). Work from `D:\Project\Web Project\Enuma\StackGate`.

Database: `apps/api/.env` holds `DATABASE_URL`/`TEST_DATABASE_URL` (Neon branch, git-ignored) — use via env file only, never print or commit credentials.

## Binding rulings (follow exactly)

- Relative imports carry `.js` extensions; no bare dotenv side-effect imports.
- `oxlint --max-warnings=0` must stay green for `apps/api` (src + tests).
- `pnpm --filter @plane/services check:lint` budget is max 6, all pre-existing — new code must add zero warnings (use named `create` import, never `axios.create`).
- No new dependencies: `hono/cors` ships inside the `hono` package. No lockfile change.
- Never commit secrets. Stay on `plan-01-foundation`.

## F1 — CORS middleware (Critical)

In `apps/api/src/app.ts`, add before route mounting:

```typescript
import { cors } from "hono/cors";

const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  "*",
  cors({
    origin: origins,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  }),
);
```

In `apps/api/.env.example`, append:

```text
WEB_ORIGIN="http://localhost:3000"
COOKIE_CROSS_SITE="0"
```

## F2 — Cross-site refresh cookie (Critical)

In `apps/api/src/auth/routes.ts`, add once near the top:

```typescript
function refreshCookieOptions(): { httpOnly: true; path: "/api/auth"; maxAge: number; sameSite: "None" | "Lax"; secure: boolean } {
  const crossSite = process.env.COOKIE_CROSS_SITE === "1";
  return {
    httpOnly: true,
    path: "/api/auth",
    maxAge: REFRESH_DAYS * 86400,
    sameSite: crossSite ? "None" : "Lax",
    secure: crossSite ? true : false,
  };
}
```

Replace all three cookie calls: both `setCookie(c, "sg_refresh", token, {...})` become `setCookie(c, "sg_refresh", token, refreshCookieOptions())`, and `deleteCookie(c, "sg_refresh", { path: "/api/auth" })` becomes `deleteCookie(c, "sg_refresh", { path: "/api/auth", sameSite: refreshCookieOptions().sameSite, secure: refreshCookieOptions().secure })`. If the deleteCookie options shape fails typecheck, fall back to path-only and report it.

## F3 — Atomic refresh rotation (Important)

Replace the refresh handler's select-then-revoke-then-insert with a fail-closed atomic revoke. Add `gt` to the drizzle-orm import, then:

```typescript
auth.post("/refresh", async (c) => {
  const presented = getCookie(c, "sg_refresh");
  if (!presented) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" } }, 401);
  const [revoked] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.tokenHash, hashRefreshToken(presented)),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!revoked) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  }
  const [user] = await db.select().from(users).where(eq(users.id, revoked.userId)).limit(1);
  if (!user) return c.json({ error: { code: "UNAUTHORIZED", message: "Refresh token tidak valid" } }, 401);
  const accessToken = await signAccess({ sub: user.id, email: user.email, role: user.role });
  const next = newRefreshToken();
  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: next.tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400 * 1000),
  });
  setCookie(c, "sg_refresh", next.token, refreshCookieOptions());
  return c.json({ data: { accessToken, user: publicUser(user) } });
});
```

## F4 — JSON body validation (Important)

Add a helper in each routes file that parses JSON (or one shared helper in `apps/api/src/http.ts` — prefer the shared file to avoid duplication):

```typescript
// apps/api/src/http.ts
import type { Context } from "hono";

export async function readJson<T>(c: Context): Promise<{ ok: true; body: T } | { ok: false }> {
  try {
    return { ok: true, body: await c.req.json<T>() };
  } catch {
    return { ok: false };
  }
}

export function invalidJson(c: Context) {
  return c.json({ error: { code: "VALIDATION_ERROR", message: "Body JSON tidak valid" } }, 400);
}
```

Apply to: login (then require non-empty `email` + `password`, else 400 `VALIDATION_ERROR` "Email dan password wajib diisi"), transition (require non-empty `to_state`, else 400), gate-check create (require non-empty `label`), research-link create (keep existing url/label check), comment create (keep existing check), ticket create (keep existing title check). All `c.req.json` call sites must go through `readJson`.

## F5 — Explicit guard matrix (Important)

Replace `apps/api/src/tickets/guard.ts` `checkTransition` tail logic with the full matrix below (signature gains optional `note`). Keep the ticket/state lookups and the `ready` block exactly as-is:

```typescript
export async function checkTransition(
  ticketId: string,
  toKey: string,
  actor: AuthUser,
  note?: string,
): Promise<GuardOk | GuardFail> {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) return { ok: false, status: 404, code: "NOT_FOUND", message: "Tiket tidak ditemukan" };
  const projectStates = await db.select().from(states).where(eq(states.projectId, ticket.projectId));
  const toState = projectStates.find((s) => s.key === toKey);
  if (!toState) return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "State tujuan tidak dikenal" };
  const fromState = projectStates.find((s) => s.id === ticket.stateId);
  const fromKey = fromState?.key;

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

  if (toKey === "backlog" && fromKey !== "backlog") {
    if (actor.role === "student") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead atau PM yang boleh mengembalikan tiket" };
    }
    if (!note || note.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Alasan pengembalian wajib diisi" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "review" && toKey === "in-development") {
    if (actor.role !== "lead") {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Hanya lead yang boleh me-reject tiket" };
    }
    if (!note || note.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Catatan revisi wajib diisi" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "backlog" && toKey === "in-development") {
    if (!ticket.assigneeId) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Tiket harus punya assignee dulu" };
    }
    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
    }
    return { ok: true, toStateId: toState.id };
  }

  if (fromKey === "in-development" && toKey === "review") {
    if (actor.role === "student" && ticket.assigneeId !== actor.id) {
      return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Kamu bukan assignee tiket ini" };
    }
    if (!ticket.description || ticket.description.trim().length === 0) {
      return { ok: false, status: 422, code: "VALIDATION_ERROR", message: "Deskripsi tiket wajib diisi dulu" };
    }
    if (ticket.researchRequired) {
      const links = await db.select({ id: researchLinks.id }).from(researchLinks).where(eq(researchLinks.ticketId, ticket.id)).limit(1);
      if (links.length === 0) {
        return { ok: false, status: 422, code: "RESEARCH_LINK_REQUIRED", message: "Tautan modul riset wajib diisi dulu" };
      }
    }
    return { ok: true, toStateId: toState.id };
  }

  return { ok: false, status: 403, code: "FORBIDDEN_TRANSITION", message: "Transisi ini tidak diizinkan" };
}
```

In `tickets/routes.ts` transition handler: parse `{ to_state, note }` via `readJson`, require `to_state` (400 otherwise), pass `note` into `checkTransition`, then perform update + `ticketTransitions` insert inside `db.transaction`, with a null-check on the refetch (404 if the ticket vanished). Also add a project-existence check in ticket create: look up the project first, 404 `NOT_FOUND` "Proyek tidak ditemukan" if absent (fixes FK-500).

## F6 — Guard regression tests (Important)

Create `apps/api/tests/guard.test.ts` (DB-backed, self-contained: unique `probe-<Date.now()>` slugs/emails, reverse-order cleanup, no await-in-loop — use sequential awaits or `Promise.all`). Set `process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx"` at top. Build fixtures per test (or once with unique names): workspace → project → 4 states → student user + lead user (password via `hashPassword` from `../src/auth/password.js`) → ticket in backlog assigned to student.

Cover at minimum:
1. student backlog→in-development → 200 (happy path, login as student first via `/api/auth/login` to get a real Bearer token).
2. student →ready → 403 `FORBIDDEN_TRANSITION`.
3. lead →ready with unchecked gate items → 422 `GATE_INCOMPLETE` (seed 1 unchecked item on the ticket).
4. ticket with `researchRequired: true` and no links, student in-development→review → 422 `RESEARCH_LINK_REQUIRED` (set description non-empty first — note: no PATCH ticket endpoint exists, so create the ticket with description + researchRequired at creation, then move student backlog→indev→review).
5. lead reject review→in-development without note → 422; with note → 200.

Use real HTTP through `createApp().request` with `Authorization: Bearer <token>`. Keep the file lint-clean (`oxlint --max-warnings=0`).

## F7 — Adapter interceptor hardening (Important)

In `packages/services/src/stackgate/client.ts`: add single-flight refresh (module-level shared promise), skip refresh for `/api/auth/login` and `/api/auth/refresh` URLs (throw the mapped/server error immediately), wrap refresh in try/catch (on failure `setAccessToken(null)` and throw `new Error(toUserMessage("UNAUTHORIZED"))`), and prefer the server's message when present:

```typescript
const serverMessage = axiosError.response?.data?.error?.message as string | undefined;
const code = axiosError.response?.data?.error?.code as string | undefined;
throw new Error(serverMessage ?? (code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi"));
```

Keep `create({...})` (never `axios.create`), keep `process.env` sourcing, keep zero-new-warnings.

## Gates and commit

Run in order: `pnpm --filter stackgate-api test` (all files green), `check:types` exit 0, `check:lint` exit 0; `pnpm --filter @plane/services check:types` exit 0 and `check:lint` exactly 6 pre-existing warnings; `pnpm --filter web check:types` exit 0. CORS smoke: start local API and assert `curl -s -D - -o NUL -H "Origin: http://localhost:3000" http://localhost:8000/api/health` shows `access-control-allow-origin`. Commit exactly: `git add apps/api packages/services` then `git commit -m "fix(review): cors, cookie, guard matrix, interceptor, regression tests"`. Verify no secret/`.env` staged.
