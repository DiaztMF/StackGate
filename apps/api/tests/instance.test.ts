import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/instances/", () => {
  it("returns Plane-compatible instance info without envelope", async () => {
    const res = await createApp().request("/api/instances/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      instance: { is_setup_done: boolean };
      config: { is_email_password_enabled: boolean; enable_signup: boolean };
    };
    expect(json.instance.is_setup_done).toBe(true);
    expect(json.config.is_email_password_enabled).toBe(true);
    expect(json.config.enable_signup).toBe(false);
  });
});
