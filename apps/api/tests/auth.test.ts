import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("auth", () => {
  it("rejects wrong credentials with 401", async () => {
    const app = createApp();
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@local.dev", password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Email atau password salah" } });
  });

  it("rejects /api/auth/me without a token", async () => {
    const res = await createApp().request("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
