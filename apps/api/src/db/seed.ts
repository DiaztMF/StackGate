import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "./client.js";
import { gateCheckItems, projectMembers, projects, states, ticketTransitions, tickets, users, workspaces } from "./schema.js";

config();

const DEFAULT_GATE_ITEMS = [
  "Kode berjalan sesuai acceptance tiket",
  "Tidak ada secret ter-commit",
  "Mengikuti modul riset yang ditautkan",
  "Sudah self-test oleh pelaksana",
];

async function main(): Promise<void> {
  if (process.env.ALLOW_DEV_SEED !== "1") throw new Error("Refusing to seed: set ALLOW_DEV_SEED=1");
  const passwordHash = await bcrypt.hash("dev123456", 10);
  const [pm] = await db.insert(users).values({ email: "pm@local.dev", name: "PM", role: "pm", passwordHash }).returning();
  const [lead] = await db.insert(users).values({ email: "lead@local.dev", name: "Lead", role: "lead", passwordHash }).returning();
  const [student] = await db.insert(users).values({ email: "siswa@local.dev", name: "Siswa", role: "student", passwordHash }).returning();
  const [ws] = await db.insert(workspaces).values({ name: "Demo" }).returning();
  const [project] = await db.insert(projects).values({ workspaceId: ws.id, name: "Contoh Klien", slug: "contoh-klien" }).returning();
  for (const u of [pm, lead, student]) {
    await db.insert(projectMembers).values({ projectId: project.id, userId: u.id, role: u.role });
  }
  const stateRows = [
    { key: "backlog", name: "Backlog", position: "0" },
    { key: "in-development", name: "In Development", position: "1" },
    { key: "review", name: "Quality Gate Review", position: "2" },
    { key: "ready", name: "Client Ready", position: "3" },
  ];
  const insertedStates = [];
  for (const s of stateRows) {
    const [row] = await db.insert(states).values({ projectId: project.id, ...s }).returning();
    insertedStates.push(row);
  }
  const backlog = insertedStates[0];
  const [sample] = await db
    .insert(tickets)
    .values({ projectId: project.id, stateId: backlog.id, title: "Contoh tiket", description: "Tiket contoh untuk verifikasi board", assigneeId: student.id, reporterId: pm.id })
    .returning();
  await db.insert(ticketTransitions).values({ ticketId: sample.id, fromStateId: null, toStateId: backlog.id, actorId: pm.id });
  for (const label of DEFAULT_GATE_ITEMS) {
    await db.insert(gateCheckItems).values({ ticketId: sample.id, label });
  }
  console.log(`seeded project ${project.id}`);
}

void main();
