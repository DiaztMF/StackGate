import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await createApp().request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true } });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const res = await createApp().request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Not found" } });
  });
});
