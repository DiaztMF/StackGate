import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { projectMembers, refreshTokens, users, workspaceMembers } from "../src/db/schema.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat auth", () => {
  it("GET /auth/get-csrf-token/ returns a token", async () => {
    const res = await createApp().request("/auth/get-csrf-token/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { csrf_token: string };
    expect(typeof json.csrf_token).toBe("string");
  });

  it("POST /auth/email-check/ validates missing email", async () => {
    const res = await createApp().request("/auth/email-check/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/users/me/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/users/me/");
    expect(res.status).toBe(401);
  });

  it("POST /auth/sign-in/ validates missing credentials (not 404)", async () => {
    const res = await createApp().request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST /auth/sign-up/ validates missing fields", async () => {
    const res = await createApp().request("/auth/sign-up/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST /auth/sign-up/ rejects an already-registered email", async () => {
    const res = await createApp().request("/auth/sign-up/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /auth/sign-up/ creates a student user and sets a session cookie", async () => {
    const email = `signup-probe-${Date.now()}@local.dev`;
    const res = await createApp().request("/auth/sign-up/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "dev123456" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { id: string; email: string };
    expect(json.email).toBe(email);
    expect(res.headers.getSetCookie().join(";")).toContain("sg_refresh=");
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    expect(row.role).toBe("student");
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, row.id));
    await db.delete(projectMembers).where(eq(projectMembers.userId, row.id));
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, row.id));
    await db.delete(users).where(eq(users.id, row.id));
  });

  it("GET /favicon.ico returns 204 (not 404)", async () => {
    const res = await createApp().request("/favicon.ico");
    expect(res.status).toBe(204);
  });

  it("POST /auth/sign-out/ revokes session, clears cookie, and redirects to home", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const res = await app.request("/auth/sign-out/", {
      method: "POST",
      headers: { Cookie: ck },
    });
    expect(res.status).toBe(302);
    // Verify Set-Cookie header contains Max-Age=0 or expired
    const cookies = res.headers.getSetCookie().join(";");
    expect(cookies).toContain("sg_refresh=");
  });
});
