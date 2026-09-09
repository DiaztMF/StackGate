import { sgApi, setAccessToken } from "./client.js";

export interface SgUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "lead" | "pm";
}

export async function sgLogin(email: string, password: string): Promise<SgUser> {
  const res = await sgApi.post("/api/auth/login", { email, password }, { withCredentials: true });
  setAccessToken(res.data.data.accessToken as string);
  return res.data.data.user as SgUser;
}

export async function sgMe(): Promise<SgUser> {
  const res = await sgApi.get("/api/auth/me");
  return res.data.data.user as SgUser;
}
