import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./auth/routes.js";
import instanceApi from "./instance/routes.js";
import { planeAuth, planeUsers } from "./plane/routes.js";
import { planeUserWorkspaces, planeWorkspaces } from "./plane/workspaces.js";
import ticketsApi from "./tickets/routes.js";

export function createApp(): Hono {
  // strict:false — Plane FE calls every endpoint with a trailing slash
  // (Django APPEND_SLASH behavior); ours are declared without.
  const app = new Hono({ strict: false });

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
  app.get("/favicon.ico", () => new Response(null, { status: 204 }));
  app.route("/api/auth", auth);
  app.route("/auth", planeAuth);
  app.route("/api/users", planeUsers);
  app.route("/api/users/me/workspaces", planeUserWorkspaces);
  app.route("/api/workspaces", planeWorkspaces);
  app.route("/api/instances", instanceApi);
  app.route("/api", ticketsApi);

  app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  });

  return app;
}
