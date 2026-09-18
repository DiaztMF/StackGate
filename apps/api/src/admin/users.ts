import { Hono } from "hono";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import type { AuthUser } from "../auth/middleware.js";
import { requireSuperadmin } from "./guard.js";

const adminUsers = new Hono<{ Variables: { user: AuthUser } }>();

adminUsers.get("/users", requireSuperadmin, async (c) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json({ data: { users: rows } });
});

export default adminUsers;
