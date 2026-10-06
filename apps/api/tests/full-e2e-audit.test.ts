import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { users, projects, states, tickets } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/auth/password.js";

describe("E2E Complete Feature & RBAC Audit", () => {
  const app = createApp();

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
});
