# Task 6 review package
## Commits
2926fbb feat(web): stackgate api adapter with silent refresh
79a8af8 feat(web): stackgate api adapter with silent refresh
## Stat
 packages/services/package.json             |  1 +
 packages/services/src/index.ts             |  3 ++
 packages/services/src/stackgate/auth.ts    | 19 +++++++++++
 packages/services/src/stackgate/client.ts  | 54 ++++++++++++++++++++++++++++++
 packages/services/src/stackgate/tickets.ts | 11 ++++++
 pnpm-lock.yaml                             |  3 ++
 6 files changed, 91 insertions(+)
## Full diff
``diff
diff --git a/packages/services/package.json b/packages/services/package.json
index c76d4a6..0010333 100644
--- a/packages/services/package.json
+++ b/packages/services/package.json
@@ -29,6 +29,7 @@
   },
   "devDependencies": {
     "@plane/typescript-config": "workspace:*",
+    "@types/node": "catalog:",
     "tsdown": "catalog:",
     "typescript": "catalog:"
   }
diff --git a/packages/services/src/index.ts b/packages/services/src/index.ts
index 9ec22ae..7288a75 100644
--- a/packages/services/src/index.ts
+++ b/packages/services/src/index.ts
@@ -19,3 +19,6 @@ export * from "./file";
 export * from "./label";
 export * from "./state";
 export * from "./issue";
+export * from "./stackgate/client";
+export * from "./stackgate/auth";
+export * from "./stackgate/tickets";
diff --git a/packages/services/src/stackgate/auth.ts b/packages/services/src/stackgate/auth.ts
new file mode 100644
index 0000000..8ae9e9b
--- /dev/null
+++ b/packages/services/src/stackgate/auth.ts
@@ -0,0 +1,19 @@
+import { sgApi, setAccessToken } from "./client.js";
+
+export interface SgUser {
+  id: string;
+  email: string;
+  name: string;
+  role: "student" | "lead" | "pm";
+}
+
+export async function sgLogin(email: string, password: string): Promise<SgUser> {
+  const res = await sgApi.post("/api/auth/login", { email, password }, { withCredentials: true });
+  setAccessToken(res.data.data.accessToken as string);
+  return res.data.data.user as SgUser;
+}
+
+export async function sgMe(): Promise<SgUser> {
+  const res = await sgApi.get("/api/auth/me");
+  return res.data.data.user as SgUser;
+}
diff --git a/packages/services/src/stackgate/client.ts b/packages/services/src/stackgate/client.ts
new file mode 100644
index 0000000..76375d2
--- /dev/null
+++ b/packages/services/src/stackgate/client.ts
@@ -0,0 +1,54 @@
+import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
+
+const ERROR_MESSAGES: Record<string, string> = {
+  UNAUTHORIZED: "Sesi berakhir, silakan login kembali",
+  FORBIDDEN_TRANSITION: "Aksi ini di luar hak peran kamu",
+  GATE_INCOMPLETE: "Checklist gerbang belum lengkap",
+  RESEARCH_LINK_REQUIRED: "Tautan modul riset wajib diisi dulu",
+  VALIDATION_ERROR: "Data yang dikirim belum valid",
+  NOT_FOUND: "Data tidak ditemukan",
+};
+
+export function toUserMessage(code: string): string {
+  return ERROR_MESSAGES[code] ?? "Terjadi kesalahan, coba lagi";
+}
+
+let accessToken: string | null = null;
+
+export function setAccessToken(token: string | null): void {
+  accessToken = token;
+}
+
+interface RetriableConfig extends InternalAxiosRequestConfig {
+  _retried?: boolean;
+}
+
+export function createStackGateClient(): AxiosInstance {
+  const instance = axios.create({ baseURL: process.env.VITE_API_BASE_URL });
+  instance.interceptors.request.use((config) => {
+    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
+    return config;
+  });
+  instance.interceptors.response.use(
+    (res) => res,
+    async (error: unknown) => {
+      const axiosError = error as AxiosError<{ error?: { code?: string } }>;
+      const original = axiosError.config as RetriableConfig | undefined;
+      if (axiosError.response?.status === 401 && original && !original._retried) {
+        original._retried = true;
+        const refresh = await axios.post<{ data: { accessToken: string } }>(
+          `${process.env.VITE_API_BASE_URL}/api/auth/refresh`,
+          {},
+          { withCredentials: true },
+        );
+        setAccessToken(refresh.data.data.accessToken);
+        return instance(original);
+      }
+      const code = axiosError.response?.data?.error?.code;
+      throw new Error(code ? toUserMessage(code) : "Terjadi kesalahan, coba lagi");
+    },
+  );
+  return instance;
+}
+
+export const sgApi = createStackGateClient();
diff --git a/packages/services/src/stackgate/tickets.ts b/packages/services/src/stackgate/tickets.ts
new file mode 100644
index 0000000..be1eb9e
--- /dev/null
+++ b/packages/services/src/stackgate/tickets.ts
@@ -0,0 +1,11 @@
+import { sgApi } from "./client.js";
+
+export async function sgListTickets(projectId: string): Promise<unknown[]> {
+  const res = await sgApi.get(`/api/projects/${projectId}/tickets`);
+  return res.data.data.tickets as unknown[];
+}
+
+export async function sgTransition(ticketId: string, toState: string): Promise<unknown> {
+  const res = await sgApi.post(`/api/tickets/${ticketId}/transition`, { to_state: toState });
+  return res.data.data.ticket;
+}
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
index 7ee9792..a26f1e2 100644
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1445,6 +1445,9 @@ importers:
       '@plane/typescript-config':
         specifier: workspace:*
         version: link:../typescript-config
+      '@types/node':
+        specifier: 'catalog:'
+        version: 22.12.0
       tsdown:
         specifier: 'catalog:'
         version: 0.16.0(@emnapi/core@1.10.0)(@emnapi/runtime@1.11.3)(oxc-resolver@11.20.0)(typescript@5.8.3)
``
