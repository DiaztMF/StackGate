import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { projects, states, workspaces } from "../src/db/schema.js";

describe("db roundtrip", () => {
  it("inserts and deletes a state row with its parents", async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
    const [ws] = await db.insert(workspaces).values({ name: "Probe WS" }).returning({ id: workspaces.id });
    const [project] = await db
      .insert(projects)
      .values({ workspaceId: ws.id, name: "Probe Project", slug: `probe-${Date.now()}` })
      .returning({ id: projects.id });
    const [row] = await db
      .insert(states)
      .values({ projectId: project.id, key: "probe", name: "Probe", position: "99" })
      .returning({ id: states.id });
    expect(row.id).toBeDefined();
    await db.delete(states).where(eq(states.id, row.id));
    await db.delete(projects).where(eq(projects.id, project.id));
    await db.delete(workspaces).where(eq(workspaces.id, ws.id));
  });
});
