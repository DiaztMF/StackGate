import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client.js";
import { states } from "../src/db/schema.js";

describe("db roundtrip", () => {
  it("inserts and deletes a state row", async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
    const [row] = await db
      .insert(states)
      .values({ projectId: "00000000-0000-0000-0000-000000000000", key: "probe", name: "Probe", position: "99" })
      .returning({ id: states.id });
    expect(row.id).toBeDefined();
    await db.delete(states).where(eq(states.id, row.id));
  });
});
