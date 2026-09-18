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
