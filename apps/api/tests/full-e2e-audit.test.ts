import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { refreshTokens, users, projects, states, tickets, workspaceInvitations, workspaceMembers, workspaces } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/auth/password.js";
import { cleanupTracked, trackTicket } from "./cleanup.js";

describe("E2E Complete Feature & RBAC Audit", () => {
  const app = createApp();

  afterAll(cleanupTracked);

  // Helper auth request
  async function loginAs(role: "student" | "lead" | "pm" | "superadmin") {
    const email = `${role}-e2e-audit@local.dev`;
    const pwd = "password123";
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      const hash = await hashPassword(pwd);
      [user] = await db.insert(users).values({ email, name: role.toUpperCase(), role, passwordHash: hash }).returning();
    }
    const res = await app.request("/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pwd, wantsJson: true }),
    });
    const cookie = res.headers.get("set-cookie") || "";
    const tokenMatch = cookie.match(/sg_refresh=([^;]+)/);
    const refreshToken = tokenMatch ? tokenMatch[1] : "";
    return { user, cookie, refreshToken };
  }

  it("AUDIT 1: Login & Role Profile Matrix", async () => {
    for (const role of ["student", "lead", "pm", "superadmin"] as const) {
      const session = await loginAs(role);
      expect(session.refreshToken).toBeTruthy();

      const meRes = await app.request("/api/users/me/", {
        headers: { Cookie: `sg_refresh=${session.refreshToken}` },
      });
      expect(meRes.status).toBe(200);
      const meData = (await meRes.json()) as any;
      expect(meData.role).toBe(role);

      // Verify instance admin strictly for superadmin
      const instRes = await app.request("/api/users/me/instance-admin/", {
        headers: { Cookie: `sg_refresh=${session.refreshToken}` },
      });
      const instData = (await instRes.json()) as any;
      if (role === "superadmin") {
        expect(instData.is_instance_admin).toBe(true);
      } else {
        expect(instData.is_instance_admin).toBe(false);
      }
    }
  });

  it("AUDIT 2: Superadmin Admin Portal Protection", async () => {
    for (const role of ["student", "lead", "pm", "superadmin"] as const) {
      const session = await loginAs(role);
      const res = await app.request("/api/admin/users", {
        headers: { Cookie: `sg_refresh=${session.refreshToken}` },
      });
      if (role === "superadmin") {
        expect(res.status).toBe(200);
      } else {
        expect(res.status).toBe(403);
      }
    }
  });

  it("AUDIT 3: Project Creation RBAC", async () => {
    for (const role of ["student", "lead", "pm", "superadmin"] as const) {
      const session = await loginAs(role);
      const res = await app.request("/api/workspaces/stackgate/projects/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `sg_refresh=${session.refreshToken}`,
        },
        body: JSON.stringify({ name: `Audit Proj ${role} ${Date.now()}` }),
      });
      if (role === "student") {
        expect(res.status).toBe(403); // Student disallowed
      } else {
        expect([200, 201]).toContain(res.status); // Lead, PM, Superadmin allowed
      }
    }
  });

  it("AUDIT 4: Quality Gate Checklist Management RBAC", async () => {
    const [project] = await db.select().from(projects).limit(1);
    const [state] = await db.select().from(states).where(eq(states.projectId, project.id)).limit(1);
    const [ticket] = await db.insert(tickets).values({
      projectId: project.id,
      stateId: state.id,
      title: "Audit Ticket Checklist",
    }).returning();
    trackTicket(ticket.id);

    for (const role of ["student", "lead", "pm", "superadmin"] as const) {
      const session = await loginAs(role);
      const addRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/gate-checks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `sg_refresh=${session.refreshToken}`,
        },
        body: JSON.stringify({ label: `Kriteria ${role}` }),
      });

      if (role === "student") {
        expect(addRes.status).toBe(403); // Student cannot add criteria
      } else {
        expect(addRes.status).toBe(201); // Lead, PM, Superadmin can add
        const item = (await addRes.json()) as any;

        // Try checking/verifying the item: ONLY LEAD allowed
        const checkRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/gate-checks/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `sg_refresh=${session.refreshToken}`,
          },
          body: JSON.stringify({ checked: true }),
        });

        if (role === "lead") {
          expect(checkRes.status).toBe(200);
        } else {
          expect(checkRes.status).toBe(403); // Only Lead can verify/check
        }
      }
    }
  });

  it("AUDIT 5: Ticket Transition Flow & Strict Guard Rules", async () => {
    const [project] = await db.select().from(projects).limit(1);
    const pStates = await db.select().from(states).where(eq(states.projectId, project.id));
    const backlog = pStates.find(s => s.key === "backlog")!;
    const inDev = pStates.find(s => s.key === "in-development")!;
    const review = pStates.find(s => s.key === "review")!;
    const ready = pStates.find(s => s.key === "ready")!;

    const studentSession = await loginAs("student");
    const leadSession = await loginAs("lead");

    // Create ticket assigned to student
    const [ticket] = await db.insert(tickets).values({
      projectId: project.id,
      stateId: backlog.id,
      title: "Flow Guard Test Ticket",
      description: "Deskripsi lengkap untuk review",
      assigneeId: studentSession.user.id,
    }).returning();
    trackTicket(ticket.id);

    // 1. Move Backlog -> Ready directly (Illegal jump)
    const jumpRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${leadSession.refreshToken}` },
      body: JSON.stringify({ state_id: ready.id }),
    });
    expect(jumpRes.status).toBe(403); // Forbidden jump without review

    // 2. Student moves Backlog -> In Development (Assignee allowed)
    const startDev = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${studentSession.refreshToken}` },
      body: JSON.stringify({ state_id: inDev.id }),
    });
    expect(startDev.status).toBe(200);

    // 3. Student moves In-Development -> Review (Allowed if description exists)
    const toReview = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${studentSession.refreshToken}` },
      body: JSON.stringify({ state_id: review.id }),
    });
    expect(toReview.status).toBe(200);

    // 4. Student tries to close to Ready -> 403 (Only Lead can close)
    const studentClose = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${studentSession.refreshToken}` },
      body: JSON.stringify({ state_id: ready.id }),
    });
    expect(studentClose.status).toBe(403);

    // 5. Lead rejects Review -> In Development with note
    const rejectWithNote = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${leadSession.refreshToken}` },
      body: JSON.stringify({ state_id: inDev.id, note: "Perbaiki linting error" }),
    });
    expect(rejectWithNote.status).toBe(200);
  });

  it("AUDIT 6: Student Reassign & Link Delete RBAC", async () => {
    const [project] = await db.select().from(projects).limit(1);
    const pStates = await db.select().from(states).where(eq(states.projectId, project.id));
    const backlog = pStates.find(s => s.key === "backlog")!;

    const student1 = await loginAs("student");
    const lead = await loginAs("lead");

    const [ticket] = await db.insert(tickets).values({
      projectId: project.id,
      stateId: backlog.id,
      title: "Assignee RBAC Test",
      assigneeId: student1.user.id,
    }).returning();
    trackTicket(ticket.id);

    const reassignRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${student1.refreshToken}` },
      body: JSON.stringify({ assignee_ids: [lead.user.id] }),
    });
    expect(reassignRes.status).toBe(403);

    const linkRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/research-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${lead.refreshToken}` },
      body: JSON.stringify({ url: "https://example.com/spec", label: "Spec Dokumen" }),
    });
    expect(linkRes.status).toBe(201);
    const link = (await linkRes.json()) as any;

    const delRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/research-links/${link.id}`, {
      method: "DELETE",
      headers: { Cookie: `sg_refresh=${student1.refreshToken}` },
    });
    expect(delRes.status).toBe(403);
  });

  it("AUDIT 7: Workspace Invitations Flow", async () => {
    const pm = await loginAs("pm");
    const student = await loginAs("student");
    const pmCookie = `sg_refresh=${pm.refreshToken}`;
    const studentCookie = `sg_refresh=${student.refreshToken}`;

    const listRes = await app.request("/api/workspaces/stackgate/invitations/", {
      headers: { Cookie: pmCookie },
    });
    expect(listRes.status).toBe(200);
    expect(Array.isArray(await listRes.json())).toBe(true);

    const studentInvite = await app.request("/api/workspaces/stackgate/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ emails: [{ email: "blocked@local.dev", role: 15 }] }),
    });
    expect(studentInvite.status).toBe(403);

    const badInvite = await app.request("/api/workspaces/stackgate/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: pmCookie },
      body: JSON.stringify({ emails: [{ email: "not-an-email", role: 15 }] }),
    });
    expect(badInvite.status).toBe(400);

    const probeEmail = `invite-probe-${Date.now()}@local.dev`;
    const createRes = await app.request("/api/workspaces/stackgate/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: pmCookie },
      body: JSON.stringify({ emails: [{ email: probeEmail, role: 5 }] }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as Array<{ id: string; email: string; accepted: boolean; role: number }>;
    expect(created[0].email).toBe(probeEmail);
    expect(created[0].accepted).toBe(false);
    expect(created[0].role).toBe(5);

    const afterCreate = (await (await app.request("/api/workspaces/stackgate/invitations/", {
      headers: { Cookie: pmCookie },
    })).json()) as Array<{ email: string }>;
    expect(afterCreate.some((i) => i.email === probeEmail)).toBe(true);

    const withdrawRes = await app.request(`/api/workspaces/stackgate/invitations/${created[0].id}/`, {
      method: "DELETE",
      headers: { Cookie: pmCookie },
    });
    expect(withdrawRes.status).toBe(200);
    await db.delete(workspaceInvitations).where(eq(workspaceInvitations.email, probeEmail));

    const tempEmail = `invite-member-${Date.now()}@local.dev`;
    const tempHash = await hashPassword("password123");
    const [tempUser] = await db
      .insert(users)
      .values({ email: tempEmail, name: "Temp Invite", role: "student", passwordHash: tempHash })
      .returning();
    const memberRes = await app.request("/api/workspaces/stackgate/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: pmCookie },
      body: JSON.stringify({ emails: [{ email: tempEmail, role: 15 }] }),
    });
    expect(memberRes.status).toBe(201);
    const memberJson = (await memberRes.json()) as Array<{ accepted: boolean }>;
    expect(memberJson[0].accepted).toBe(true);
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, tempUser.id));
    await db.delete(users).where(eq(users.id, tempUser.id));
  });

  it("AUDIT 8: Timezones, Workspace Rename & Feature Stubs", async () => {
    const pm = await loginAs("pm");
    const student = await loginAs("student");
    const pmCookie = `sg_refresh=${pm.refreshToken}`;

    const tzRes = await app.request("/api/timezones/");
    expect(tzRes.status).toBe(200);
    const tzJson = (await tzRes.json()) as { timezones: Array<{ utc_offset: string; gmt_offset: string; label: string; value: string }> };
    expect(tzJson.timezones.length).toBeGreaterThan(100);
    expect(tzJson.timezones.some((t) => t.value === "Asia/Jakarta")).toBe(true);

    const [ws] = await db.select().from(workspaces).limit(1);
    const originalName = ws.name;
    const renameForbidden = await app.request("/api/workspaces/stackgate/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `sg_refresh=${student.refreshToken}` },
      body: JSON.stringify({ name: "Hacked" }),
    });
    expect(renameForbidden.status).toBe(403);
    const renameRes = await app.request("/api/workspaces/stackgate/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: pmCookie },
      body: JSON.stringify({ name: `${originalName}` }),
    });
    expect(renameRes.status).toBe(200);
    const renamed = (await renameRes.json()) as { name: string };
    expect(renamed.name).toBe(originalName);

    const labelsRes = await app.request("/api/workspaces/stackgate/labels/", { headers: { Cookie: pmCookie } });
    expect(labelsRes.status).toBe(200);
    expect(await labelsRes.json()).toEqual([]);
    const cyclesRes = await app.request("/api/workspaces/stackgate/cycles/", { headers: { Cookie: pmCookie } });
    expect(cyclesRes.status).toBe(200);
    expect(await cyclesRes.json()).toEqual([]);
    const estimatesRes = await app.request("/api/workspaces/stackgate/estimates/", { headers: { Cookie: pmCookie } });
    expect(estimatesRes.status).toBe(200);
    expect(await estimatesRes.json()).toEqual([]);
    const draftsRes = await app.request("/api/workspaces/stackgate/draft-issues/?per_page=50&cursor=50:0:0:0", {
      headers: { Cookie: pmCookie },
    });
    expect(draftsRes.status).toBe(200);
    const draftsJson = (await draftsRes.json()) as { results: unknown[]; count: number };
    expect(draftsJson.results).toEqual([]);
    expect(draftsJson.count).toBe(0);
    const unsplashRes = await app.request("/api/unsplash/?query=test");
    expect(unsplashRes.status).toBe(200);
    expect(await unsplashRes.json()).toEqual({ results: [] });
  });

  it("AUDIT 9: Invitation Accept Flow", async () => {
    const pm = await loginAs("pm");
    const pmCookie = `sg_refresh=${pm.refreshToken}`;
    const joinEmail = `invite-join-${Date.now()}@local.dev`;
    const joinHash = await hashPassword("password123");
    const [joinUser] = await db
      .insert(users)
      .values({ email: joinEmail, name: "Join Probe", role: "student", passwordHash: joinHash })
      .returning();
    const inviteRes = await app.request("/api/workspaces/stackgate/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: pmCookie },
      body: JSON.stringify({ emails: [{ email: joinEmail, role: 15 }] }),
    });
    expect(inviteRes.status).toBe(201);
    const signinRes = await app.request("/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: joinEmail, password: "password123", wantsJson: true }),
    });
    expect(signinRes.status).toBe(200);
    const joinCookie = (signinRes.headers.get("set-cookie") ?? "").split(";")[0];
    const myInvitesRes = await app.request("/api/users/me/workspaces/invitations/", {
      headers: { Cookie: joinCookie },
    });
    expect(myInvitesRes.status).toBe(200);
    const myInvites = (await myInvitesRes.json()) as Array<{ id: string; email: string }>;
    expect(myInvites.some((i) => i.email === joinEmail)).toBe(false);
    const [ws] = await db.select().from(workspaces).limit(1);
    const [pendingRow] = await db
      .insert(workspaceInvitations)
      .values({ workspaceId: ws.id, email: joinEmail, role: "lead", token: `probe-${Date.now()}`, createdById: pm.user.id })
      .returning();
    const listed = (await (await app.request("/api/users/me/workspaces/invitations/", {
      headers: { Cookie: joinCookie },
    })).json()) as Array<{ id: string }>;
    expect(listed.some((i) => i.id === pendingRow.id)).toBe(true);
    const acceptRes = await app.request("/api/users/me/workspaces/invitations/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: joinCookie },
      body: JSON.stringify({ invitations: [pendingRow.id] }),
    });
    expect(acceptRes.status).toBe(200);
    const membership = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, joinUser.id));
    expect(membership.length).toBeGreaterThan(0);
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, joinUser.id));
    await db.delete(workspaceInvitations).where(eq(workspaceInvitations.email, joinEmail));
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, joinUser.id));
    await db.delete(users).where(eq(users.id, joinUser.id));
  });

  it("AUDIT 10: Ticket Attachments via Private Blob", async () => {
    const lead = await loginAs("lead");
    const student = await loginAs("student");
    const leadCookie = `sg_refresh=${lead.refreshToken}`;
    const studentCookie = `sg_refresh=${student.refreshToken}`;
    const [project] = await db.select().from(projects).limit(1);
    const pStates = await db.select().from(states).where(eq(states.projectId, project.id));
    const backlog = pStates.find((s) => s.key === "backlog")!;
    const [ticket] = await db
      .insert(tickets)
      .values({ projectId: project.id, stateId: backlog.id, title: "Attachment Probe Ticket", assigneeId: lead.user.id })
      .returning();
    const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const form = new FormData();
    form.append("file", new Blob([pngBytes], { type: "image/png" }), "probe.png");
    const uploadRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/attachments/`, {
      method: "POST",
      headers: { Cookie: leadCookie },
      body: form,
    });
    expect(uploadRes.status).toBe(201);
    const uploaded = (await uploadRes.json()) as { id: string; attributes: { name: string; size: number }; issue_id: string };
    expect(uploaded.attributes.name).toBe("probe.png");
    expect(uploaded.issue_id).toBe(ticket.id);
    const listRes = await app.request(`/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/attachments/`, {
      headers: { Cookie: leadCookie },
    });
    expect(listRes.status).toBe(200);
    const listed = (await listRes.json()) as Array<{ id: string }>;
    expect(listed.some((a) => a.id === uploaded.id)).toBe(true);
    const fileRes = await app.request(
      `/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/attachments/${uploaded.id}/file`,
      { headers: { Cookie: studentCookie } },
    );
    expect(fileRes.status).toBe(200);
    expect(fileRes.headers.get("content-type")).toContain("image/png");
    const forbiddenDel = await app.request(
      `/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/attachments/${uploaded.id}`,
      { method: "DELETE", headers: { Cookie: studentCookie } },
    );
    expect(forbiddenDel.status).toBe(403);
    const delRes = await app.request(
      `/api/workspaces/stackgate/projects/${project.id}/issues/${ticket.id}/attachments/${uploaded.id}`,
      { method: "DELETE", headers: { Cookie: leadCookie } },
    );
    expect(delRes.status).toBe(200);
    await db.delete(tickets).where(eq(tickets.id, ticket.id));
  });
});
