import { createMiddleware } from "hono/factory";
import type { AuthUser } from "../auth/middleware.js";
import { resolvePlaneUser, unauthorized } from "../plane/routes.js";

// Admin routes are called from the browser with the same cookie session as
// every other /api/workspaces/* endpoint, never a Bearer token — so this
// guard resolves the user the same way (Bearer header first, falling back
// to the sg_refresh cookie), not via the Bearer-only authMiddleware used by
// the older /api/tickets/* API.
export const requireSuperadmin = createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
  const user = await resolvePlaneUser(c);
  if (!user) return unauthorized(c);
  if (user.role !== "superadmin") {
    return c.json({ error: { code: "FORBIDDEN", message: "Hanya superadmin yang boleh mengakses ini" } }, 403);
  }
  c.set("user", { id: user.id, email: user.email, role: user.role });
  await next();
});
