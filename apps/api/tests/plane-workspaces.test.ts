import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat workspaces", () => {
  it("GET /api/workspaces/stackgate/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/workspace-members/me/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/workspace-members/me/");
    expect(res.status).toBe(401);
  });

  it("GET /api/users/me/workspaces/stackgate/project-roles/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/users/me/workspaces/stackgate/project-roles/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/projects/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/states/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/states/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/users/notifications/unread/ returns 401 without token", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/users/notifications/unread/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/home-preferences/ returns 401 without token", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/home-preferences/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/user-favorites/ returns 401 without token", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/user-favorites/?all=true");
    expect(res.status).toBe(401);
  });

  it("POST /api/workspaces/stackgate/projects/ creates a new project with default states", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lead@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const res = await app.request("/api/workspaces/stackgate/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ name: "Proyek Baru Uji Coba" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string; name: string };
    expect(json.name).toBe("Proyek Baru Uji Coba");
  });

  it("GET /api/workspaces/stackgate/projects/details/ returns 200 list (not 500 uuid error)", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lead@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const res = await app.request("/api/workspaces/stackgate/projects/details/", {
      headers: { Cookie: ck },
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(list)).toBe(true);
  });
});
