import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { cleanupTracked, trackTicket } from "./cleanup.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

afterAll(cleanupTracked);

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
    trackTicket(json.id);
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
    trackTicket(ticket.id);

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
    trackTicket(ticket.id);

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

  it("enforces research link requirement when moving to review state", async () => {
    const app = createApp();
    const studentLogin = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const studentCk = studentLogin.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: studentCk } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const statesRes = await app.request("/api/workspaces/stackgate/states/", { headers: { Cookie: studentCk } });
    const statesList = (await statesRes.json()) as Array<{ id: string; name: string }>;
    const inDevState = statesList.find((s) => s.name === "In Development")!;
    const reviewState = statesList.find((s) => s.name === "Quality Gate Review")!;

    // 1. Create ticket
    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ name: "Research Guard Test", description_html: "<p>Deskripsi tugas</p>" }),
    });
    const ticket = (await createRes.json()) as { id: string };
    trackTicket(ticket.id);

    // Move to in-development and set research_required: true
    await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: inDevState.id, research_required: true }),
    });

    // 2. Try move to review without research link -> should 422 RESEARCH_LINK_REQUIRED
    const failReviewRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: reviewState.id }),
    });
    expect(failReviewRes.status).toBe(422);
    const failJson = (await failReviewRes.json()) as { error: { code: string } };
    expect(failJson.error.code).toBe("RESEARCH_LINK_REQUIRED");

    // 3. Add research link
    const addLinkRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/research-links/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ label: "Modul Auth Spesifikasi", url: "https://docs.stackgate.dev/auth" }),
    });
    expect(addLinkRes.status).toBe(201);

    // 4. GET research links
    const getLinksRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/research-links/`, {
      headers: { Cookie: studentCk },
    });
    expect(getLinksRes.status).toBe(200);
    const getLinksJson = (await getLinksRes.json()) as { research_required: boolean; links: Array<{ label: string }> };
    expect(getLinksJson.research_required).toBe(true);
    expect(getLinksJson.links.length).toBe(1);

    // 5. Try move to review again -> should succeed with 200
    const successReviewRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCk },
      body: JSON.stringify({ state_id: reviewState.id }),
    });
    expect(successReviewRes.status).toBe(200);
  }, 30000);

  it("POST /api/workspaces/stackgate/projects/:id/issues/ without auth returns 401", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issues/not-a-ticket/comments/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_html: "<p>Halo</p>" }),
    });
    expect(res.status).toBe(401);
  });

  it("issue comments CRUD roundtrip with author detail and cleanup", async () => {
    const app = createApp();
    const login = await app.request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "siswa@local.dev", password: "dev123456" }),
    });
    const ck = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const jsonHeaders = { "Content-Type": "application/json", Cookie: ck };

    const wsRes = await app.request("/api/workspaces/stackgate/projects/", { headers: { Cookie: ck } });
    const prjList = (await wsRes.json()) as Array<{ id: string }>;
    const projectId = prjList[0].id;

    const createRes = await app.request(`/api/workspaces/stackgate/projects/${projectId}/issues/`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ name: "Tiket Komentar UAT" }),
    });
    expect(createRes.status).toBe(201);
    const ticket = (await createRes.json()) as { id: string };
    trackTicket(ticket.id);
    const base = `/api/workspaces/stackgate/projects/${projectId}/issues/${ticket.id}`;

    try {
      const postRes = await app.request(`${base}/comments/`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ comment_html: "<p>Catatan revisi pertama</p>", comment_stripped: "Catatan revisi pertama" }),
      });
      expect(postRes.status).toBe(201);
      const created = (await postRes.json()) as { id: string; comment_html: string; comment_stripped: string; actor_detail: { display_name: string } };
      expect(created.comment_stripped).toBe("Catatan revisi pertama");
      expect(created.actor_detail.display_name).toBe("Siswa");

      const feedRes = await app.request(`${base}/history/?activity_type=issue-comment`, { headers: { Cookie: ck } });
      expect(feedRes.status).toBe(200);
      const feed = (await feedRes.json()) as Array<{ id: string }>;
      expect(feed.some((c) => c.id === created.id)).toBe(true);

      const patchRes = await app.request(`${base}/comments/${created.id}/`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ comment_html: "<p>Catatan revisi kedua</p>" }),
      });
      expect(patchRes.status).toBe(200);

      const delRes = await app.request(`${base}/comments/${created.id}/`, {
        method: "DELETE",
        headers: jsonHeaders,
      });
      expect(delRes.status).toBe(200);

      const afterRes = await app.request(`${base}/history/?activity_type=issue-comment`, { headers: { Cookie: ck } });
      const after = (await afterRes.json()) as Array<{ id: string }>;
      expect(after.some((c) => c.id === created.id)).toBe(false);
    } finally {
      const { db } = await import("../src/db/client.js");
      const { comments, gateCheckItems, researchLinks, ticketTransitions, tickets } = await import("../src/db/schema.js");
      const { eq } = await import("drizzle-orm");
      await db.delete(comments).where(eq(comments.ticketId, ticket.id));
      await db.delete(gateCheckItems).where(eq(gateCheckItems.ticketId, ticket.id));
      await db.delete(researchLinks).where(eq(researchLinks.ticketId, ticket.id));
      await db.delete(ticketTransitions).where(eq(ticketTransitions.ticketId, ticket.id));
      await db.delete(tickets).where(eq(tickets.id, ticket.id));
    }
  }, 30000);
});
