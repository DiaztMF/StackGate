import { createHash, randomBytes } from "node:crypto";
import { sign, verify } from "hono/jwt";

export interface AccessPayload {
  sub: string;
  email: string;
  role: "student" | "lead" | "pm";
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be at least 32 chars");
  return s;
}

export async function signAccess(payload: AccessPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign({ ...payload, iat: now, exp: now + 15 * 60 }, secret(), "HS256");
}

export async function verifyAccess(token: string): Promise<AccessPayload> {
  return (await verify(token, secret(), "HS256")) as unknown as AccessPayload;
}

export function newRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
