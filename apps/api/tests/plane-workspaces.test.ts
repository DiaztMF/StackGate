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
});
