import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("transition guards (no token)", () => {
  it("rejects transition without token", async () => {
    const res = await createApp().request("/api/tickets/00000000-0000-0000-0000-000000000000/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_state: "ready" }),
    });
    expect(res.status).toBe(401);
  });
});
