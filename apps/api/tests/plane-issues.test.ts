import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat issues", () => {
  it("GET /api/workspaces/stackgate/projects/test/issue-display-properties/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issue-display-properties/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/projects/test/issues/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issues/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/projects/:id/issues/ returns TIssuesResponse for authenticated user", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const res = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      headers: { Cookie: ck },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { results: unknown[]; total_count: number };
    expect(Array.isArray(json.results)).toBe(true);
    expect(typeof json.total_count).toBe("number");
  });

  it("POST /api/workspaces/stackgate/projects/:id/issues/ creates ticket in backlog", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const res = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ name: "Tiket Baru Test", description_html: "<p>Deskripsi</p>" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string; name: string };
    expect(json.name).toBe("Tiket Baru Test");
  });

  it("PATCH /api/workspaces/stackgate/projects/:id/issues/:issueId/ rejects student moving to ready", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    // Get ready state ID
    const statesRes = await app.request("/api/workspaces/stackgate/states/", { headers: { Cookie: ck } });
    const statesList = (await statesRes.json()) as Array<{ id: string; group: string }>;
    const readyState = statesList.find((s) => s.group === "completed")!;

    // Create ticket
    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ name: "Guard Test" }),
    });
    const ticket = (await createRes.json()) as { id: string };

    // Move to ready as student -> should 403
    const patchRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ state_id: readyState.id }),
    });
    expect(patchRes.status).toBe(403);
  }, 30000);

  it("auto-creates 4 gate check items and verifies role permissions", async () => {
    const app = createApp();
    const studentLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const studentCk = studentLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const leadLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "lead@local.dev", password: "dev123456" }),
    });
    const leadCk = leadLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: studentCk } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ name: "Quality Gate Auto-Seed Test" }),
    });
    const ticket = (await createRes.json()) as { id: string };

    const getRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/gate-checks/`, {
      headers: { Cookie: studentCk },
    });
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as { items: Array<{ id: string; label: string; checked: boolean }> };
    expect(getJson.items.length).toBe(4);
    expect(getJson.items[0].checked).toBe(false);

    const firstCheckId = getJson.items[0].id;

    // Student tries to check -> 403
    const studentCheckRes = await app.request(
      `/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/gate-checks/${firstCheckId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: studentCk },
        body: JSON.stringify({ checked: true }),
      }
    );
    expect(studentCheckRes.status).toBe(403);

    // Lead checks -> 200
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
});
