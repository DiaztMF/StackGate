import { createMiddleware } from "hono/factory";
import { verifyAccess } from "./tokens.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "lead" | "pm";
}

export const authMiddleware = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak ditemukan" } }, 401);
  }
  try {
    const payload = await verifyAccess(token);
    c.set("user", { id: payload.sub, email: payload.email, role: payload.role } satisfies AuthUser);
    await next();
  } catch {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Token tidak valid" } }, 401);
  }
});
