import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { cleanupTracked, trackTicket } from "./cleanup.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

afterAll(cleanupTracked);

async function signIn(app: ReturnType<typeof createApp>, email: string): Promise<string> {
  const login = await app.request("/auth/sign-in/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password" }),
  });
  return login.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function firstProjectId(app: ReturnType<typeof createApp>, cookie: string): Promise<string> {
  const res = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: cookie } });
  const list = (await res.json()) as Array<{ id: string }>;
  return list[0].id;
}

describe("issue priority and dates", () => {
  it("round-trips priority, start_date and target_date through create, patch and list", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");
    const projectId = await firstProjectId(app, cookie);

    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Field Round Trip", priority: "urgent", target_date: "2026-12-24" }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; priority: string; target_date: string | null };
    trackTicket(created.id);
    expect(created.priority).toBe("urgent");
    expect(created.target_date).toBe("2026-12-24");

    const patchRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${created.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ priority: "low", start_date: "2026-12-01", target_date: null }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as {
      priority: string;
      start_date: string | null;
      target_date: string | null;
    };
    expect(patched.priority).toBe("low");
    expect(patched.start_date).toBe("2026-12-01");
    expect(patched.target_date).toBeNull();

    const listRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      headers: { Cookie: cookie },
    });
    const list = (await listRes.json()) as { results: Array<{ id: string; priority: string; start_date: string }> };
    const reread = list.results.find((i) => i.id === created.id)!;
    expect(reread.priority).toBe("low");
    expect(reread.start_date).toBe("2026-12-01");
  });

  it("ignores an unknown priority instead of writing it", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");
    const projectId = await firstProjectId(app, cookie);

    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Bad Priority", priority: "catastrophic" }),
    });
    const created = (await createRes.json()) as { id: string; priority: string };
    trackTicket(created.id);
    expect(created.priority).toBe("none");
  });

  it("answers a PATCH carrying no known field without erroring", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");
    const projectId = await firstProjectId(app, cookie);

    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Empty Patch" }),
    });
    const created = (await createRes.json()) as { id: string };
    trackTicket(created.id);

    const patchRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${created.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ label_ids: ["nope"] }),
    });
    expect(patchRes.status).toBe(200);
  });
});

describe("project creation guard", () => {
  it("rejects a student creating a project", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");

    const res = await app.request("/api/workspaces/stackgate/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Proyek Siswa" }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("reports a student as workspace guest but project member", async () => {
    const app = createApp();
    const cookie = await signIn(app, "siswa@local.dev");
    const projectId = await firstProjectId(app, cookie);

    const wsRes = await app.request("/api/workspaces/stackgate/workspace-members/me/", {
      headers: { Cookie: cookie },
    });
    const wsMember = (await wsRes.json()) as { role: number };
    expect(wsMember.role).toBe(5);

    const prjRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/project-members/me/`, {
      headers: { Cookie: cookie },
    });
    const prjMember = (await prjRes.json()) as { role: number };
    expect(prjMember.role).toBe(15);
  });
});
