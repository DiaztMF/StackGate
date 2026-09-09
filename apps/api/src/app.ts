import { Hono } from "hono";

export function createApp(): Hono {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({ data: { ok: true } }));

  app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  });

  return app;
}
