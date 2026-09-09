import type { Context } from "hono";

export async function readJson<T>(c: Context): Promise<{ ok: true; body: T } | { ok: false }> {
  try {
    return { ok: true, body: await c.req.json<T>() };
  } catch {
    return { ok: false };
  }
}

export function invalidJson(c: Context) {
  return c.json({ error: { code: "VALIDATION_ERROR", message: "Body JSON tidak valid" } }, 400);
}
