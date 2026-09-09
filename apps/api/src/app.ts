import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./auth/routes.js";
import ticketsApi from "./tickets/routes.js";

export function createApp(): Hono {
  const app = new Hono();

  const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    "*",
    cors({
      origin: origins,
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 600,
    }),
  );
  app.get("/api/health", (c) => c.json({ data: { ok: true } }));
  app.route("/api/auth", auth);
  app.route("/api", ticketsApi);

  app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  });

  return app;
}
