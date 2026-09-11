import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET = "test-secret-32-chars-minimum-xxxx";

describe("plane-compat issues", () => {
  it("GET /api/workspaces/stackgate/projects/test/issue-display-properties/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issue-display-properties/");
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces/stackgate/projects/test/issues/ returns 401 without auth", async () => {
    const res = await createApp().request("/api/workspaces/stackgate/projects/test/issues/");
    expect(res.status).toBe(401);
  });
});
