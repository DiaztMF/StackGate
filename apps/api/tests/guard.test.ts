import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { hashPassword } from "../src/auth/password.js";
import {
  comments,
  gateCheckItems,
  projects,
  refreshTokens,
  researchLinks,
  states,
  ticketTransitions,
  tickets,
  users,
  workspaces,
} from "../src/db/schema.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

const app = createApp();

let seq = 0;
function uniq(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

const workspaceIds: string[] = [];
const projectIds: string[] = [];
const userIds: string[] = [];
const ticketIds: string[] = [];

afterEach(async () => {
  if (ticketIds.length > 0) {
    await db.delete(gateCheckItems).where(inArray(gateCheckItems.ticketId, ticketIds));
    await db.delete(researchLinks).where(inArray(researchLinks.ticketId, ticketIds));
    await db.delete(comments).where(inArray(comments.ticketId, ticketIds));
    await db.delete(ticketTransitions).where(inArray(ticketTransitions.ticketId, ticketIds));
    await db.delete(tickets).where(inArray(tickets.id, ticketIds));
    ticketIds.length = 0;
  }
  if (projectIds.length > 0) {
    await db.delete(states).where(inArray(states.projectId, projectIds));
    await db.delete(projects).where(inArray(projects.id, projectIds));
    projectIds.length = 0;
  }
  if (userIds.length > 0) {
    await db.delete(refreshTokens).where(inArray(refreshTokens.userId, userIds));
    await db.delete(users).where(inArray(users.id, userIds));
    userIds.length = 0;
  }
  if (workspaceIds.length > 0) {
    await db.delete(workspaces).where(inArray(workspaces.id, workspaceIds));
    workspaceIds.length = 0;
  }
});

interface Fixture {
  ticketId: string;
  studentToken: string;
  leadToken: string;
}

async function loginToken(email: string, password: string): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(res.status).toBe(200);
  const json = (await res.json()) as { data: { accessToken: string } };
  return json.data.accessToken;
}

async function setupFixture(opts?: { researchRequired?: boolean; description?: string }): Promise<Fixture> {
  const tag = uniq("probe");
  const password = "Test1234!";
  const [studentHash, leadHash] = await Promise.all([hashPassword(password), hashPassword(password)]);
  const [ws] = await db.insert(workspaces).values({ name: `WS ${tag}` }).returning({ id: workspaces.id });
  workspaceIds.push(ws.id);
  const [project] = await db
    .insert(projects)
    .values({ workspaceId: ws.id, name: `Proj ${tag}`, slug: `probe-${tag}` })
    .returning({ id: projects.id });
  projectIds.push(project.id);
  const stateDefs = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Review", position: "2" },
    { key: "ready", name: "Ready", position: "3" },
  ];
  const inserted = await Promise.all(
    stateDefs.map((s) => db.insert(states).values({ projectId: project.id, ...s }).returning({ id: states.id, key: states.key })),
  );
  const flat = inserted.flat();
  const backlog = flat.find((s) => s.key === "backlog");
  expect(backlog).toBeDefined();
  const backlogId = (backlog as { id: string }).id;
  const studentEmail = `student-${tag}@local.dev`;
  const leadEmail = `lead-${tag}@local.dev`;
  const [student] = await db
    .insert(users)
    .values({ email: studentEmail, name: "Student", role: "student", passwordHash: studentHash })
    .returning({ id: users.id });
  const [lead] = await db
    .insert(users)
    .values({ email: leadEmail, name: "Lead", role: "lead", passwordHash: leadHash })
    .returning({ id: users.id });
  userIds.push(student.id, lead.id);
  const [ticket] = await db
    .insert(tickets)
    .values({
      projectId: project.id,
      stateId: backlogId,
      title: `T ${tag}`,
      description: opts?.description ?? "",
      assigneeId: student.id,
      reporterId: lead.id,
      researchRequired: opts?.researchRequired ?? false,
    })
    .returning({ id: tickets.id });
  ticketIds.push(ticket.id);
  const studentToken = await loginToken(studentEmail, password);
  const leadToken = await loginToken(leadEmail, password);
  return { ticketId: ticket.id, studentToken, leadToken };
}

function transition(token: string, ticketId: string, body: Record<string, string>) {
  return app.request(`/api/tickets/${ticketId}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

describe("guard matrix", () => {
  it("student backlog→in-development → 200", async () => {
    const f = await setupFixture({ description: "Deskripsi awal" });
    const res = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
    expect(res.status).toBe(200);
  });

  it("student →ready → 403 FORBIDDEN_TRANSITION", async () => {
    const f = await setupFixture();
    const res = await transition(f.studentToken, f.ticketId, { to_state: "ready" });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("FORBIDDEN_TRANSITION");
  });

  it("lead →ready with unchecked gate items → 422 GATE_INCOMPLETE", async () => {
    const f = await setupFixture();
    await db.insert(gateCheckItems).values({ ticketId: f.ticketId, label: "Check 1" });
    const res = await transition(f.leadToken, f.ticketId, { to_state: "ready" });
    expect(res.status).toBe(422);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("GATE_INCOMPLETE");
  });

  it("researchRequired ticket student in-development→review → 422 RESEARCH_LINK_REQUIRED", async () => {
    const f = await setupFixture({ description: "Riset modul X", researchRequired: true });
    const r1 = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
    expect(r1.status).toBe(200);
    const r2 = await transition(f.studentToken, f.ticketId, { to_state: "review" });
    expect(r2.status).toBe(422);
    const json = (await r2.json()) as { error: { code: string } };
    expect(json.error.code).toBe("RESEARCH_LINK_REQUIRED");
  });

  it("lead reject review→in-development without note → 422, with note → 200", async () => {
    const f = await setupFixture({ description: "Deskripsi lengkap" });
    const r1 = await transition(f.studentToken, f.ticketId, { to_state: "in-development" });
    expect(r1.status).toBe(200);
    const r2 = await transition(f.studentToken, f.ticketId, { to_state: "review" });
    expect(r2.status).toBe(200);
    const bad = await transition(f.leadToken, f.ticketId, { to_state: "in-development" });
    expect(bad.status).toBe(422);
    const good = await transition(f.leadToken, f.ticketId, { to_state: "in-development", note: "Perlu revisi" });
    expect(good.status).toBe(200);
  });
});
