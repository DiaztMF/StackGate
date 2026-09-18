import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { refreshTokens, users } from "../src/db/schema.js";
import { hashPassword } from "../src/auth/password.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

const createdUserIds: string[] = [];

afterAll(async () => {
  // signIn() issues a refresh token row for each created user; delete it
  // first (same order as tests/plane-auth.test.ts) to satisfy the
  // refresh_tokens -> users FK before deleting the user.
  await Promise.all(
    createdUserIds.map(async (id) => {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, id));
      await db.delete(users).where(eq(users.id, id));
    }),
  );
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
