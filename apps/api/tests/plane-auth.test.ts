import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat auth", () => {
  it("GET /auth/get-csrf-token/ returns a token", async () => {
    const res = await createApp().request("/auth/get-csrf-token/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { csrf_token: string };
    expect(typeof json.csrf_token).toBe("string");
  });

  it("POST /auth/email-check/ validates missing email", async () => {
    const res = await createApp().request("/auth/email-check/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/users/me/ returns 401 without token (not 404)", async () => {
    const res = await createApp().request("/api/users/me/");
    expect(res.status).toBe(401);
  });

  it("POST /auth/sign-in/ validates missing credentials (not 404)", async () => {
    const res = await createApp().request("/auth/sign-in/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
