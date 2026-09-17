# Task 6 Brief — FE adapter and local end-to-end render

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 6.
Branch: `plan-01-foundation` (base now `ca2a1a4`). Work from `D:\Project\Web Project\Enuma\StackGate`.

## Requirements

Step 1 — find current auth consumers (proves what must be rewired). Run:

```powershell
Get-ChildItem -LiteralPath "apps/web/app","apps/web/core" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "@plane/services" | Select-Object -Unique Path
```

Expect a concrete file list (these are the only call sites the adapter must satisfy in Plan 01).

Step 2 — create the adapter. `packages/services/src/stackgate/client.ts` exactly:

```typescript
import axios, { create, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesi berakhir, silakan login kembali",
  FORBIDDEN_TRANSITION: "Aksi ini di luar hak peran kamu",
  GATE_INCOMPLETE: "Checklist gerbang belum lengkap",
  RESEARCH_LINK_REQUIRED: "Tautan modul riset wajib diisi dulu",
  VALIDATION_ERROR: "Data yang dikirim belum valid",
  NOT_FOUND: "Data tidak ditemukan",
};

export function toUserMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Terjadi kesalahan, coba lagi";
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Brief-owner amendment: baseURL MUST come from process.env, not import.meta.env.
// web's vite.config defines process.env as JSON of VITE_* vars, and @plane/services
// has no vite/client types, so import.meta.env breaks the services package's own
// check:types gate. This matches the existing @plane/constants convention.
// Controller amendment 2: use named create() — axios.create trips
// no-named-as-default-member and the package budget (max 6) is already
// exhausted by 6 pre-existing warnings. axios.post below is unaffected.
export function createStackGateClient(): AxiosInstance {
  const instance = create({ baseURL: process.env.VITE_API_BASE_URL });
  instance.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });
  instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      const axiosError = error as AxiosError<{ error?: { code?: string } }>;
      const original = axiosError.config as RetriableConfig | undefined;
      if (axiosError.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        const refresh = await axios.post<{ data: { accessToken: string } }>(
          `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(refresh.data.data.accessToken);
        return instance(original);
      }
      const code = axiosError.response?.data?.error?.code;
      throw new Error(code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi");
    },
  );
  return instance;
}

export const sgApi = createStackGateClient();
```

`packages/services/src/stackgate/auth.ts` exactly:

```typescript
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
```

`packages/services/src/stackgate/tickets.ts` exactly:

```typescript
import { sgApi } from "./client.js";

export async function sgListTickets(projectId: string): Promise<unknown[]> {
  const res = await sgApi.get(`/api/projects/${projectId}/tickets`);
  return res.data.data.tickets as unknown[];
}

export async function sgTransition(ticketId: string, toState: string): Promise<unknown> {
  const res = await sgApi.post(`/api/tickets/${ticketId}/transition`, { to_state: toState });
  return res.data.data.ticket;
}
```

Append to `packages/services/src/index.ts` exactly:

```typescript
export * from "./stackgate/client";
export * from "./stackgate/auth";
export * from "./stackgate/tickets";
```

Check how `packages/services` resolves relative imports first: if the package uses bundler resolution (Vite), extensionless `./client` also passes, but the `.js` form above is required — verify with `check:types` and keep whichever passes without touching anything else. If the `.js` form fails typecheck in this package, escalate with the exact error instead of improvising.

Step 3 — create untracked `apps/web/.env` exactly:

```text
VITE_API_BASE_URL="http://localhost:8000"
VITE_WEB_BASE_URL="http://localhost:3000"
VITE_LIVE_BASE_URL="http://localhost:3100"
VITE_LIVE_BASE_PATH="/live"
```

Verify it is ignored: `git status --porcelain --ignored "apps/web/.env"` must show `!! apps/web/.env`. Start the API (`pnpm --filter stackgate-api dev`, expects `stackgate-api listening on 8000`) and web (`pnpm --filter web dev`, expects React Router dev on port 3000). Log in with a seeded dev user (`siswa@local.dev` / `dev123456`) against the new API and confirm the board lists real tickets. `apps/api/.env` already contains `DATABASE_URL` and `JWT_SECRET` (git-ignored) — use as-is, never print credentials.

Step 4 — `pnpm --filter web check:types` exit 0, `pnpm --filter web build` exit 0 with `build/client` emitted.

Commit exactly: `git add packages/services/src/stackgate packages/services/src/index.ts packages/services/package.json pnpm-lock.yaml` then `git commit -m "feat(web): stackgate api adapter with silent refresh"`.

Second amendment (brief-owner approved): add `"@types/node": "catalog:"` to `packages/services/package.json` devDependencies (same as `@plane/constants`) and run `pnpm install --no-frozen-lockfile`, because the services package uses the react-library TS config with no node types in scope, so `process.env` fails with TS2580 without it. Then re-verify: services `check:types` exit 0; services `check:lint` shows exactly the 7 pre-existing warnings (proven pre-existing via stash — new files must add zero); web `check:types` exit 0; web `build` exit 0; login re-proof as siswa@local.dev.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets (no `.env` files). Never print credentials.
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- Do not modify any other `apps/web` or `packages/*` file. Full board rewiring is Plan 02 — this task only proves login + ticket data flow end to end.
