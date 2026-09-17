# Task 2 review package
## Commits
23335f1 feat(api): hono scaffold with health endpoint and tests
## Stat
 apps/api/.env.example         |   3 +
 apps/api/api/index.ts         |   4 +
 apps/api/package.json         |  32 +++
 apps/api/src/app.ts           |  15 ++
 apps/api/src/server.ts        |   9 +
 apps/api/tests/health.test.ts |  16 ++
 apps/api/tsconfig.json        |  13 ++
 apps/api/vercel.json          |   3 +
 pnpm-lock.yaml                | 460 +++++++++++++++++++++++++++++++++++++++---
 9 files changed, 530 insertions(+), 25 deletions(-)
## Full diff
``diff
diff --git a/apps/api/.env.example b/apps/api/.env.example
new file mode 100644
index 0000000..df9fc8c
--- /dev/null
+++ b/apps/api/.env.example
@@ -0,0 +1,3 @@
+DATABASE_URL="postgresql://user:password@host:5432/stackgate"
+JWT_SECRET="change-me-32-chars-minimum"
+PORT="8000"
diff --git a/apps/api/api/index.ts b/apps/api/api/index.ts
new file mode 100644
index 0000000..76681d1
--- /dev/null
+++ b/apps/api/api/index.ts
@@ -0,0 +1,4 @@
+import { handle } from "hono/vercel";
+import { createApp } from "../src/app.js";
+
+export default handle(createApp());
diff --git a/apps/api/package.json b/apps/api/package.json
new file mode 100644
index 0000000..1e36073
--- /dev/null
+++ b/apps/api/package.json
@@ -0,0 +1,32 @@
+{
+  "name": "stackgate-api",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "tsx src/server.ts",
+    "build": "tsc --noEmit",
+    "check:types": "tsc --noEmit",
+    "check:lint": "oxlint --max-warnings=0 src tests",
+    "test": "vitest run"
+  },
+  "dependencies": {
+    "@vercel/functions": "^2.2.2",
+    "bcryptjs": "^3.0.2",
+    "drizzle-orm": "^0.44.0",
+    "hono": "^4.7.0",
+    "pg": "^8.13.0"
+  },
+  "devDependencies": {
+    "@hono/node-server": "^1.13.0",
+    "@types/bcryptjs": "^2.4.6",
+    "@types/node": "22.12.0",
+    "@types/pg": "^8.11.0",
+    "dotenv": "16.4.7",
+    "drizzle-kit": "^0.31.0",
+    "oxlint": "1.51.0",
+    "tsx": "4.20.6",
+    "typescript": "5.8.3",
+    "vitest": "^4.1.8"
+  }
+}
diff --git a/apps/api/src/app.ts b/apps/api/src/app.ts
new file mode 100644
index 0000000..6498c37
--- /dev/null
+++ b/apps/api/src/app.ts
@@ -0,0 +1,15 @@
+import { Hono } from "hono";
+
+export function createApp(): Hono {
+  const app = new Hono();
+
+  app.get("/api/health", (c) => c.json({ data: { ok: true } }));
+
+  app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
+  app.onError((err, c) => {
+    console.error(err);
+    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
+  });
+
+  return app;
+}
diff --git a/apps/api/src/server.ts b/apps/api/src/server.ts
new file mode 100644
index 0000000..e7dcd27
--- /dev/null
+++ b/apps/api/src/server.ts
@@ -0,0 +1,9 @@
+import { config } from "dotenv";
+import { serve } from "@hono/node-server";
+import { createApp } from "./app.js";
+
+config();
+
+const port = Number(process.env.PORT ?? 8000);
+serve({ fetch: createApp().fetch, port });
+console.log(`stackgate-api listening on ${port}`);
diff --git a/apps/api/tests/health.test.ts b/apps/api/tests/health.test.ts
new file mode 100644
index 0000000..b6e7ee1
--- /dev/null
+++ b/apps/api/tests/health.test.ts
@@ -0,0 +1,16 @@
+import { describe, expect, it } from "vitest";
+import { createApp } from "../src/app.js";
+
+describe("GET /api/health", () => {
+  it("returns ok", async () => {
+    const res = await createApp().request("/api/health");
+    expect(res.status).toBe(200);
+    expect(await res.json()).toEqual({ data: { ok: true } });
+  });
+
+  it("returns JSON 404 for unknown routes", async () => {
+    const res = await createApp().request("/api/nope");
+    expect(res.status).toBe(404);
+    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Not found" } });
+  });
+});
diff --git a/apps/api/tsconfig.json b/apps/api/tsconfig.json
new file mode 100644
index 0000000..bb7db17
--- /dev/null
+++ b/apps/api/tsconfig.json
@@ -0,0 +1,13 @@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "module": "NodeNext",
+    "moduleResolution": "NodeNext",
+    "strict": true,
+    "skipLibCheck": true,
+    "outDir": "dist",
+    "rootDir": ".",
+    "types": ["node"]
+  },
+  "include": ["src/**/*.ts", "api/**/*.ts", "tests/**/*.ts"]
+}
diff --git a/apps/api/vercel.json b/apps/api/vercel.json
new file mode 100644
index 0000000..9256348
--- /dev/null
+++ b/apps/api/vercel.json
@@ -0,0 +1,3 @@
+{
+  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index" }]
+}
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
index 0a5e678..7ee9792 100644
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -593,6 +593,55 @@ importers:
         specifier: 'catalog:'
         version: 2.10.11
 
+  apps/api:
+    dependencies:
+      '@vercel/functions':
+        specifier: ^2.2.2
+        version: 2.2.13
+      bcryptjs:
+        specifier: ^3.0.2
+        version: 3.0.3
+      drizzle-orm:
+        specifier: ^0.44.0
+        version: 0.44.7(@opentelemetry/api@1.9.1)(@types/pg@8.23.1)(pg@8.23.0)
+      hono:
+        specifier: ^4.7.0
+        version: 4.13.7
+      pg:
+        specifier: ^8.13.0
+        version: 8.23.0
+    devDependencies:
+      '@hono/node-server':
+        specifier: ^1.13.0
+        version: 1.19.17(hono@4.13.7)
+      '@types/bcryptjs':
+        specifier: ^2.4.6
+        version: 2.4.6
+      '@types/node':
+        specifier: 22.12.0
+        version: 22.12.0
+      '@types/pg':
+        specifier: ^8.11.0
+        version: 8.23.1
+      dotenv:
+        specifier: 16.4.7
+        version: 16.4.7
+      drizzle-kit:
+        specifier: ^0.31.0
+        version: 0.31.10
+      oxlint:
+        specifier: 1.51.0
+        version: 1.51.0
+      tsx:
+        specifier: 4.20.6
+        version: 4.20.6
+      typescript:
+        specifier: 5.8.3
+        version: 5.8.3
+      vitest:
+        specifier: ^4.1.8
+        version: 4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))
+
   apps/live:
     dependencies:
       '@effect/platform':
@@ -739,7 +788,7 @@ importers:
         version: 5.8.3
       vitest:
         specifier: 'catalog:'
-        version: 4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))
+        version: 4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))
 
   apps/web:
     dependencies:
@@ -968,7 +1017,7 @@ importers:
         version: 17.3.0
       vitest:
         specifier: 'catalog:'
-        version: 4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))
+        version: 4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))
 
   packages/constants:
     dependencies:
@@ -1355,13 +1404,13 @@ importers:
         version: link:../typescript-config
       '@storybook/addon-designs':
         specifier: 'catalog:'
-        version: 11.1.3(@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1)))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))
+        version: 11.1.3(@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1)))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))
       '@storybook/addon-docs':
         specifier: 'catalog:'
-        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       '@storybook/react-vite':
         specifier: 'catalog:'
-        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       '@types/react':
         specifier: 19.2.17
         version: 19.2.17
@@ -1566,7 +1615,7 @@ importers:
         version: link:../typescript-config
       '@storybook/addon-docs':
         specifier: 'catalog:'
-        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))
+        version: 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))
       '@storybook/addon-links':
         specifier: 'catalog:'
         version: 10.4.6(@types/react@19.2.17)(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))
@@ -1988,6 +2037,9 @@ packages:
   '@date-fns/tz@1.4.1':
     resolution: {integrity: sha512-P5LUNhtbj6YfI3iJjw5EL9eUAG6OitD0W3fWQcpQjDRc/QIsL0tRNuO1PcDvPccWL1fSTXXdE1ds+l95DV/OFA==}
 
+  '@drizzle-team/brocli@0.10.2':
+    resolution: {integrity: sha512-z33Il7l5dKjUgGULTqBsQBQwckHh5AbIuxhdsIxDDiZAzBOrZO6q9ogcWC65kU382AfynTfgNumVcNIjuIua6w==}
+
   '@effect/cluster@0.56.1':
     resolution: {integrity: sha512-gnrsH6kfrUjn+82j/bw1IR4yFqJqV8tc7xZvrbJPRgzANycc6K1hu3LMg548uYbUkTzD8YYyqrSatMO1mkQpzw==}
     peerDependencies:
@@ -2078,6 +2130,14 @@ packages:
   '@emnapi/wasi-threads@1.2.1':
     resolution: {integrity: sha512-uTII7OYF+/Mes/MrcIOYp5yOtSMLBWSIoLPpcgwipoiKbli6k322tcoFsxoIIxPDqW01SQGAgko4EzZi2BNv2w==}
 
+  '@esbuild-kit/core-utils@3.3.2':
+    resolution: {integrity: sha512-sPRAnw9CdSsRmEtnsl2WXWdyquogVpB3yZ3dgwJfe8zrOzTsV7cJvmwrKVa+0ma5BoiGJ+BoqkMvawbayKUsqQ==}
+    deprecated: 'Merged into tsx: https://tsx.hirok.io'
+
+  '@esbuild-kit/esm-loader@2.6.5':
+    resolution: {integrity: sha512-FxEMIkJKnodyA1OaCUoEvbYRkoZlLZ4d/eXFu9Fh8CbBBgP5EmZxrfTRyN0qpXZ4vOvqnE5YdRdcrmUUXuU+dA==}
+    deprecated: 'Merged into tsx: https://tsx.hirok.io'
+
   '@esbuild/aix-ppc64@0.28.1':
     resolution: {integrity: sha512-Svl7tq8k/08+p6CXPpRjQ1fKX+1odH/BQbb48fV6fj3CWHhsoIOoY87w1oHXm0qEpkIK3ZfVgp0hed3XBXzXMQ==}
     engines: {node: '>=18'}
@@ -2370,6 +2430,12 @@ packages:
       y-prosemirror: ^1.2.1
       yjs: ^13.6.8
 
+  '@hono/node-server@1.19.17':
+    resolution: {integrity: sha512-dSneS5qhiauZWGDCeK4o695Xd9nUNjviSZCMQrj10eetr8Uln1ucn6bbphOM6UynAMMtNIzZNSpL9vnASJwrPQ==}
+    engines: {node: '>=18.14.1'}
+    peerDependencies:
+      hono: ^4
+
   '@humanfs/core@0.19.2':
     resolution: {integrity: sha512-UhXNm+CFMWcbChXywFwkmhqjs3PRCmcSa/hfBgLIb7oQ5HNb1wS0icWsGtSAUNgefHeI+eBrA8I1fxmbHsGdvA==}
     engines: {node: '>=18.18.0'}
@@ -4803,6 +4869,9 @@ packages:
   '@types/babel__traverse@7.28.0':
     resolution: {integrity: sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==}
 
+  '@types/bcryptjs@2.4.6':
+    resolution: {integrity: sha512-9xlo6R2qDs5uixm0bcIqCeMCE6HiQsIyel9KQySStiyqNl2tnj2mP3DX1Nf56MD6KMenNNlBBsy3LJ7gUEQPXQ==}
+
   '@types/body-parser@1.19.6':
     resolution: {integrity: sha512-HLFeCYgz89uk22N5Qg3dvGvsv46B8GLvKKo1zKG4NybA8U2DiEO3w9lqGg29t/tfLRJpJ6iQxnVw4OnB7MoM9g==}
 
@@ -4941,6 +5010,9 @@ packages:
   '@types/pdf-parse@1.1.5':
     resolution: {integrity: sha512-kBfrSXsloMnUJOKi25s3+hRmkycHfLK6A09eRGqF/N8BkQoPUmaCr+q8Cli5FnfohEz/rsv82zAiPz/LXtOGhA==}
 
+  '@types/pg@8.23.1':
+    resolution: {integrity: sha512-fKVHpikPdg4GKks3JuLEhvwSyvwzF23hnabPy6DD8ljVbC7+6J5dQzdv4arV6jqq57djnMgs1HKBxX4P8aBI3A==}
+
   '@types/qs@6.14.0':
     resolution: {integrity: sha512-eOunJqu0K1923aExK6y8p6fsihYEn/BYuQ4g0CxAAgFc4b/ZLN4CrsRZ55srTdqoiLzU2B2evC+apEIxprEzkQ==}
 
@@ -5003,6 +5075,19 @@ packages:
     resolution: {integrity: sha512-WmoN8qaIAo7WTYWbAZuG8PYEhn5fkz7dZrqTBZ7dtt//lL2Gwms1IcnQ5yHqjDfX8Ft5j4YzDM23f87zBfDe9g==}
     deprecated: Potential CWE-502 - Update to 1.3.1 or higher
 
+  '@vercel/functions@2.2.13':
+    resolution: {integrity: sha512-14ArBSIIcOBx9nrEgaJb4Bw+en1gl6eSoJWh8qjifLl5G3E4dRXCFOT8HP+w66vb9Wqyd1lAQBrmRhRwOj9X9A==}
+    engines: {node: '>= 18'}
+    peerDependencies:
+      '@aws-sdk/credential-provider-web-identity': '*'
+    peerDependenciesMeta:
+      '@aws-sdk/credential-provider-web-identity':
+        optional: true
+
+  '@vercel/oidc@2.0.2':
+    resolution: {integrity: sha512-59PBFx3T+k5hLTEWa3ggiMpGRz1OVvl9eN8SUai+A43IsqiOuAe7qPBf+cray/Fj6mkgnxm/D7IAtjc8zSHi7g==}
+    engines: {node: '>= 18'}
+
   '@vitest/coverage-v8@4.1.8':
     resolution: {integrity: sha512-lt3kovsyHwYe00wq4D1ti0Z974fWj4NLp6siqiyEufUpyFwK9Yhi7rBhac9JL5aA0zoMrJqc4vYPZRUnI7l7nw==}
     peerDependencies:
@@ -5323,6 +5408,10 @@ packages:
   batch-processor@1.0.0:
     resolution: {integrity: sha512-xoLQD8gmmR32MeuBHgH0Tzd5PuSZx71ZsbhVxOCRbgktZEPe4SQy7s9Z50uPp0F/f7iw2XmkHN2xkgbMfckMDA==}
 
+  bcryptjs@3.0.3:
+    resolution: {integrity: sha512-GlF5wPWnSa/X5LKM1o0wz0suXIINz1iHRLvTS+sLyi7XPbe5ycmYI3DlZqVGZZtDgl4DmasFg7gOB3JYbphV5g==}
+    hasBin: true
+
   bidi-js@1.0.3:
     resolution: {integrity: sha512-RKshQI1R3YQ+n9YJz2QQ147P66ELpa1FQEg20Dk8oW9t2KgLbpDLLp9aGZ7y8WHSshDknG0bknqGw5/tyCs5tw==}
 
@@ -5954,6 +6043,102 @@ packages:
     resolution: {integrity: sha512-47qPchRCykZC03FhkYAhrvwU4xDBFIj1QPqaarj6mdM/hgUzfPHcpkHJOn3mJAufFeeAxAzeGsr5X0M4k6fLZQ==}
     engines: {node: '>=12'}
 
+  drizzle-kit@0.31.10:
+    resolution: {integrity: sha512-7OZcmQUrdGI+DUNNsKBn1aW8qSoKuTH7d0mYgSP8bAzdFzKoovxEFnoGQp2dVs82EOJeYycqRtciopszwUf8bw==}
+    hasBin: true
+
+  drizzle-orm@0.44.7:
+    resolution: {integrity: sha512-quIpnYznjU9lHshEOAYLoZ9s3jweleHlZIAWR/jX9gAWNg/JhQ1wj0KGRf7/Zm+obRrYd9GjPVJg790QY9N5AQ==}
+    peerDependencies:
+      '@aws-sdk/client-rds-data': '>=3'
+      '@cloudflare/workers-types': '>=4'
+      '@electric-sql/pglite': '>=0.2.0'
+      '@libsql/client': '>=0.10.0'
+      '@libsql/client-wasm': '>=0.10.0'
+      '@neondatabase/serverless': '>=0.10.0'
+      '@op-engineering/op-sqlite': '>=2'
+      '@opentelemetry/api': ^1.4.1
+      '@planetscale/database': '>=1.13'
+      '@prisma/client': '*'
+      '@tidbcloud/serverless': '*'
+      '@types/better-sqlite3': '*'
+      '@types/pg': '*'
+      '@types/sql.js': '*'
+      '@upstash/redis': '>=1.34.7'
+      '@vercel/postgres': '>=0.8.0'
+      '@xata.io/client': '*'
+      better-sqlite3: '>=7'
+      bun-types: '*'
+      expo-sqlite: '>=14.0.0'
+      gel: '>=2'
+      knex: '*'
+      kysely: '*'
+      mysql2: '>=2'
+      pg: '>=8'
+      postgres: '>=3'
+      prisma: '*'
+      sql.js: '>=1'
+      sqlite3: '>=5'
+    peerDependenciesMeta:
+      '@aws-sdk/client-rds-data':
+        optional: true
+      '@cloudflare/workers-types':
+        optional: true
+      '@electric-sql/pglite':
+        optional: true
+      '@libsql/client':
+        optional: true
+      '@libsql/client-wasm':
+        optional: true
+      '@neondatabase/serverless':
+        optional: true
+      '@op-engineering/op-sqlite':
+        optional: true
+      '@opentelemetry/api':
+        optional: true
+      '@planetscale/database':
+        optional: true
+      '@prisma/client':
+        optional: true
+      '@tidbcloud/serverless':
+        optional: true
+      '@types/better-sqlite3':
+        optional: true
+      '@types/pg':
+        optional: true
+      '@types/sql.js':
+        optional: true
+      '@upstash/redis':
+        optional: true
+      '@vercel/postgres':
+        optional: true
+      '@xata.io/client':
+        optional: true
+      better-sqlite3:
+        optional: true
+      bun-types:
+        optional: true
+      expo-sqlite:
+        optional: true
+      gel:
+        optional: true
+      knex:
+        optional: true
+      kysely:
+        optional: true
+      mysql2:
+        optional: true
+      pg:
+        optional: true
+      postgres:
+        optional: true
+      prisma:
+        optional: true
+      sql.js:
+        optional: true
+      sqlite3:
+        optional: true
+
   dts-resolver@2.1.3:
     resolution: {integrity: sha512-bihc7jPC90VrosXNzK0LTE2cuLP6jr0Ro8jk+kMugHReJVLIpHz/xadeq3MhuwyO4TD4OA3L1Q8pBBFRc08Tsw==}
     engines: {node: '>=20.19.0'}
@@ -6594,6 +6779,10 @@ packages:
     resolution: {integrity: sha512-Xwwo44whKBVCYoliBQwaPvtd/2tYFkRQtXDWj1nackaV2JPXx3L0+Jvd8/qCJ2p+ML0/XVkJ2q+Mr+UVdpJK5w==}
     engines: {node: '>=12.0.0'}
 
+  hono@4.13.7:
+    resolution: {integrity: sha512-c8/gF9ac8Y78/agExVocyLevgR+JlpNB444Py0FSX8pJoPdYUfUzRcXtYEYGwt6l19qIlVZPN5Mfsw9jFShmQQ==}
+    engines: {node: '>=16.9.0'}
+
   hookable@5.5.3:
     resolution: {integrity: sha512-Yc+BQe8SvoXH1643Qez1zqLRmbA5rCL+sSmk6TVos0LWVfNIB7PGncdlId77WzLGSIB5KaWgTaNTs2lNVEI6VQ==}
 
@@ -7857,6 +8046,40 @@ packages:
   pdfkit@0.20.1:
     resolution: {integrity: sha512-1rRXK6x5o8I/3dBrBzXfxibpHpkfCnIA7EBAES7pEpGFc/65inMLlA8SalGWpJfal7BGekxeLf6A30IOpQpc5Q==}
 
+  pg-cloudflare@1.4.0:
+    resolution: {integrity: sha512-Vo7z/6rrQYxpNRylp4Tlob2elzbh+N/MOQbxFVWCxS7oEx6jF53GTJFxK2WWpKuBRkmiin4Mt+xofFDjx09R0A==}
+
+  pg-connection-string@2.14.0:
+    resolution: {integrity: sha512-XwWDGcLRGCXAR8F/AM5bG7Q+A3Wm2s6QeEjlOKZLlH3UYcguiqCWKyWXVag5TLTIjR7oOJUY8kcADaZgWPyLeg==}
+
+  pg-int8@1.0.1:
+    resolution: {integrity: sha512-WCtabS6t3c8SkpDBUlb1kjOs7l66xsGdKpIPZsg4wR+B3+u9UAum2odSsF9tnvxg80h4ZxLWMy4pRjOsFIqQpw==}
+    engines: {node: '>=4.0.0'}
+
+  pg-pool@3.14.0:
+    resolution: {integrity: sha512-gKtPkFdQPU3DksooVLi9LsjZxrsBUZIpa+7aVx+LV5pNh0KzP4Zleud2po+ConrxbuXGBJ6Hfer6hdgpIBpBaw==}
+    peerDependencies:
+      pg: '>=8.0'
+
+  pg-protocol@1.16.0:
+    resolution: {integrity: sha512-sILXutLVjCLjcDuOmvhX5e2Z4cS5qG/6Bu3VkpFwdf/633ElGLpEh9bgmuI5I4sqKqkifQiGyiCcx1HdtrK7tg==}
+
+  pg-types@2.2.0:
+    resolution: {integrity: sha512-qTAAlrEsl8s4OiEQY69wDvcMIdQN6wdz5ojQiOy6YRMuynxenON0O5oCpJI6lshc6scgAY8qvJ2On/p+CXY0GA==}
+    engines: {node: '>=4'}
+
+  pg@8.23.0:
+    resolution: {integrity: sha512-Ip2EQCngowJLGOfCwkFhPXU7/ljlhn6Rxlmy4XYfL2Y+vyRM59+8uR2xqRWKdYmbXmxCFOAmKxBuSUCdF34qLg==}
+    engines: {node: '>= 16.0.0'}
+    peerDependencies:
+      pg-native: '>=3.0.1'
+    peerDependenciesMeta:
+      pg-native:
+        optional: true
+
+  pgpass@1.0.5:
+    resolution: {integrity: sha512-FdW9r/jQZhSeohs1Z3sI1yxFQNFvMcnmfuj4WBMUTxOrAyLMaTcE1aAMBiTlbMNaXvBCQuVi0R7hd8udDSP7ug==}
+
   picocolors@1.1.1:
     resolution: {integrity: sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==}
 
@@ -7972,6 +8195,22 @@ packages:
     resolution: {integrity: sha512-DTPx3RWSSnWyzLxQnlH0rJP+EW5ekl16ZU4/psbIhA0e53kJfdgaN5vKM+xP7yJtXVu+nfdVFmlgFDEKAe4Pyw==}
     engines: {node: ^10 || ^12 || >=14}
 
+  postgres-array@2.0.0:
+    resolution: {integrity: sha512-VpZrUqU5A69eQyW2c5CA1jtLecCsN2U/bD6VilrFDWq5+5UIEVO7nazS3TEcHf1zuPYO/sqGvUvW62g86RXZuA==}
+    engines: {node: '>=4'}
+
+  postgres-bytea@1.0.1:
+    resolution: {integrity: sha512-5+5HqXnsZPE65IJZSMkZtURARZelel2oXUEO8rH83VS/hxH5vv1uHquPg5wZs8yMAfdv971IU+kcPUczi7NVBQ==}
+    engines: {node: '>=0.10.0'}
+
+  postgres-date@1.0.7:
+    resolution: {integrity: sha512-suDmjLVQg78nMK2UZ454hAG+OAW+HQPZ6n++TNDUX+L0+uUlLywnoxJKDou51Zm+zTCjrCl0Nq6J9C5hP9vK/Q==}
+    engines: {node: '>=0.10.0'}
+
+  postgres-interval@1.2.0:
+    resolution: {integrity: sha512-9ZhXKM/rw350N1ovuWHbGxnGh/SNJ4cnxHiM0rxE4VN41wsg8P8zWn9hv/buK00RP4WvlOyr/RBDiptyxVbkZQ==}
+    engines: {node: '>=0.10.0'}
+
   prelude-ls@1.2.1:
     resolution: {integrity: sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==}
     engines: {node: '>= 0.8.0'}
@@ -8622,6 +8861,10 @@ packages:
   space-separated-tokens@2.0.2:
     resolution: {integrity: sha512-PEGlAwrG8yXGXRjW32fGbg66JAlOAwbObuqVoJpv/mRgoWDQfgH1wDPvtzWyUSNAXBGSk8h755YDbbcEy3SH2Q==}
 
+  split2@4.2.0:
+    resolution: {integrity: sha512-UcjcJOWknrNkF6PLX83qcHM6KHgVKNkV62Y8a5uYDVv9ydGQVwAHMKqHdJje1VTWpljG0WYpCDhrCdAOYH4TWg==}
+    engines: {node: '>= 10.x'}
+
   stack-trace@0.0.10:
     resolution: {integrity: sha512-KGzahc7puUKkzyMt+IqAep+TVNbKP+k2Lmwhub39m1AsTSkaDutx56aDCo+HLDzf/D26BIHTJWNiTG1KAJiQCg==}
 
@@ -8970,6 +9213,11 @@ packages:
     engines: {node: '>=18.0.0'}
     hasBin: true
 
+  tsx@4.23.13:
+    resolution: {integrity: sha512-BL5MGkRln6aDYhb0xbQlEAGw743BaZYWdbWtdJOBriYJboKgUUYCadFp2/FpBBZquBC/ezNBn7wMMPx7FDZUDw==}
+    engines: {node: '>=18.0.0'}
+    hasBin: true
+
   turbo@2.10.11:
     resolution: {integrity: sha512-yQfwQVoRXwOuyX1LxiJFBFNg6VfuYh+/RyZLd82+isgyLkBXw3S5XRRzvcck1FAjSCG5sVyLd+O1eDMvYa3J7g==}
     hasBin: true
@@ -9372,6 +9620,10 @@ packages:
     resolution: {integrity: sha512-h3Fbisa2nKGPxCpm89Hk33lBLsnaGBvctQopaBSOW/uIs6FTe1ATyAnKFJrzVs9vpGdsTe73WF3V4lIsk4Gacw==}
     engines: {node: '>=18'}
 
+  xtend@4.0.2:
+    resolution: {integrity: sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==}
+    engines: {node: '>=0.4'}
+
   y-indexeddb@9.0.12:
     resolution: {integrity: sha512-9oCFRSPPzBK7/w5vOkJBaVCQZKHXB/v6SIT+WYhnJxlEC61juqG0hBrAf+y3gmSMLFLwICNH9nQ53uscuse6Hg==}
     engines: {node: '>=16.0.0', npm: '>=8.0.0'}
@@ -9785,6 +10037,8 @@ snapshots:
 
   '@date-fns/tz@1.4.1': {}
 
+  '@drizzle-team/brocli@0.10.2': {}
+
   '@effect/cluster@0.56.1(@effect/platform@0.94.1(effect@3.20.0))(@effect/rpc@0.73.0(@effect/platform@0.94.1(effect@3.20.0))(effect@3.20.0))(@effect/sql@0.49.0(@effect/experimental@0.58.0(@effect/platform@0.94.1(effect@3.20.0))(effect@3.20.0)(ioredis@5.7.0))(@effect/platform@0.94.1(effect@3.20.0))(effect@3.20.0))(@effect/workflow@0.16.0(@effect/experimental@0.58.0(@effect/platform@0.94.1(effect@3.20.0))(effect@3.20.0)(ioredis@5.7.0))(@effect/platform@0.94.1(effect@3.20.0))(@effect/rpc@0.73.0(@effect/platform@0.94.1(effect@3.20.0))(effect@3.20.0))(effect@3.20.0))(effect@3.20.0)':
     dependencies:
       '@effect/platform': 0.94.1(effect@3.20.0)
@@ -9899,6 +10153,16 @@ snapshots:
       tslib: 2.8.1
     optional: true
 
+  '@esbuild-kit/core-utils@3.3.2':
+    dependencies:
+      esbuild: 0.28.1
+      source-map-support: 0.5.21
+
+  '@esbuild-kit/esm-loader@2.6.5':
+    dependencies:
+      '@esbuild-kit/core-utils': 3.3.2
+      get-tsconfig: 4.13.7
+
   '@esbuild/aix-ppc64@0.28.1':
     optional: true
 
@@ -10165,6 +10429,10 @@ snapshots:
       y-prosemirror: 1.3.7(prosemirror-model@1.25.3)(prosemirror-state@1.4.3)(prosemirror-view@1.40.0)(y-protocols@1.0.6(yjs@13.6.27))(yjs@13.6.27)
       yjs: 13.6.27
 
+  '@hono/node-server@1.19.17(hono@4.13.7)':
+    dependencies:
+      hono: 4.13.7
+
   '@humanfs/core@0.19.2':
     dependencies:
       '@humanfs/types': 0.15.0
@@ -10316,11 +10584,11 @@ snapshots:
 
   '@isaacs/cliui@9.0.0': {}
 
-  '@joshwooding/vite-plugin-react-docgen-typescript@0.7.0(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))':
+  '@joshwooding/vite-plugin-react-docgen-typescript@0.7.0(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))':
     dependencies:
       glob: 11.1.0
       react-docgen-typescript: 2.4.0(typescript@5.8.3)
-      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
     optionalDependencies:
       typescript: 5.8.3
 
@@ -11431,21 +11699,21 @@ snapshots:
 
   '@standard-schema/spec@1.1.0': {}
 
-  '@storybook/addon-designs@11.1.3(@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1)))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))':
+  '@storybook/addon-designs@11.1.3(@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1)))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))':
     dependencies:
       '@figspec/react': 2.0.1(@types/react@19.2.17)(react@19.2.8)
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
     optionalDependencies:
-      '@storybook/addon-docs': 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+      '@storybook/addon-docs': 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       react: 19.2.8
       react-dom: 19.2.8(react@19.2.8)
     transitivePeerDependencies:
       - '@types/react'
 
-  '@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))':
+  '@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))':
     dependencies:
       '@mdx-js/react': 3.1.0(@types/react@19.2.17)(react@19.2.8)
-      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))
+      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))
       '@storybook/icons': 2.0.2(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       '@storybook/react-dom-shim': 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))
       react: 19.2.8
@@ -11461,10 +11729,10 @@ snapshots:
       - vite
       - webpack
 
-  '@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
+  '@storybook/addon-docs@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
     dependencies:
       '@mdx-js/react': 3.1.0(@types/react@19.2.17)(react@19.2.8)
-      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       '@storybook/icons': 2.0.2(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       '@storybook/react-dom-shim': 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))
       react: 19.2.8
@@ -11506,12 +11774,12 @@ snapshots:
       - '@swc/helpers'
       - webpack
 
-  '@storybook/builder-vite@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
+  '@storybook/builder-vite@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
     dependencies:
-      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+      '@storybook/csf-plugin': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       ts-dedent: 2.2.0
-      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
     transitivePeerDependencies:
       - esbuild
       - rollup
@@ -11558,22 +11826,22 @@ snapshots:
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       ts-dedent: 2.2.0
 
-  '@storybook/csf-plugin@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))':
+  '@storybook/csf-plugin@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25))':
     dependencies:
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       unplugin: 2.3.11
     optionalDependencies:
       esbuild: 0.28.1
-      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
       webpack: 5.104.1(@swc/core@1.13.5(@swc/helpers@0.5.17))(esbuild@0.28.1)(postcss@8.5.25)
 
-  '@storybook/csf-plugin@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
+  '@storybook/csf-plugin@10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
     dependencies:
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       unplugin: 2.3.11
     optionalDependencies:
       esbuild: 0.28.1
-      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
       webpack: 5.104.1(esbuild@0.28.1)
 
   '@storybook/global@5.0.0': {}
@@ -11638,11 +11906,11 @@ snapshots:
       '@types/react': 19.2.17
       '@types/react-dom': 19.2.3(@types/react@19.2.17)
 
-  '@storybook/react-vite@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
+  '@storybook/react-vite@10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(esbuild@0.28.1)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))':
     dependencies:
-      '@joshwooding/vite-plugin-react-docgen-typescript': 0.7.0(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))
+      '@joshwooding/vite-plugin-react-docgen-typescript': 0.7.0(typescript@5.8.3)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))
       '@rollup/pluginutils': 5.2.0
-      '@storybook/builder-vite': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
+      '@storybook/builder-vite': 10.4.6(esbuild@0.28.1)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))(webpack@5.104.1(esbuild@0.28.1))
       '@storybook/react': 10.4.6(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)(storybook@10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8))(typescript@5.8.3)
       empathic: 2.0.0
       magic-string: 0.30.21
@@ -11652,7 +11920,7 @@ snapshots:
       resolve: 1.22.10
       storybook: 10.4.6(@testing-library/dom@10.4.0)(@types/react@19.2.17)(prettier@3.9.6)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       tsconfig-paths: 4.2.0
-      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
     transitivePeerDependencies:
       - '@types/react'
       - '@types/react-dom'
@@ -12182,6 +12450,8 @@ snapshots:
     dependencies:
       '@babel/types': 7.29.7
 
+  '@types/bcryptjs@2.4.6': {}
+
   '@types/body-parser@1.19.6':
     dependencies:
       '@types/connect': 3.4.38
@@ -12340,6 +12610,12 @@ snapshots:
     dependencies:
       '@types/node': 22.12.0
 
+  '@types/pg@8.23.1':
+    dependencies:
+      '@types/node': 22.12.0
+      pg-protocol: 1.16.0
+      pg-types: 2.2.0
+
   '@types/qs@6.14.0': {}
 
   '@types/range-parser@1.2.7': {}
@@ -12396,6 +12672,15 @@ snapshots:
 
   '@ungap/structured-clone@1.3.0': {}
 
+  '@vercel/functions@2.2.13':
+    dependencies:
+      '@vercel/oidc': 2.0.2
+
+  '@vercel/oidc@2.0.2':
+    dependencies:
+      '@types/ms': 2.1.0
+      ms: 2.1.3
+
   '@vitest/coverage-v8@4.1.8(vitest@4.1.8)':
     dependencies:
       '@bcoe/v8-coverage': 1.0.2
@@ -12435,6 +12720,14 @@ snapshots:
     optionalDependencies:
       vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)
 
+  '@vitest/mocker@4.1.8(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))':
+    dependencies:
+      '@vitest/spy': 4.1.8
+      estree-walker: 3.0.3
+      magic-string: 0.30.21
+    optionalDependencies:
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
+
   '@vitest/pretty-format@3.2.4':
     dependencies:
       tinyrainbow: 2.0.0
@@ -12761,6 +13054,8 @@ snapshots:
 
   batch-processor@1.0.0: {}
 
+  bcryptjs@3.0.3: {}
+
   bidi-js@1.0.3:
     dependencies:
       require-from-string: 2.0.2
@@ -13364,6 +13659,19 @@ snapshots:
 
   dotenv@16.4.7: {}
 
+  drizzle-kit@0.31.10:
+    dependencies:
+      '@drizzle-team/brocli': 0.10.2
+      '@esbuild-kit/esm-loader': 2.6.5
+      esbuild: 0.28.1
+      tsx: 4.23.13
+
+  drizzle-orm@0.44.7(@opentelemetry/api@1.9.1)(@types/pg@8.23.1)(pg@8.23.0):
+    optionalDependencies:
+      '@opentelemetry/api': 1.9.1
+      '@types/pg': 8.23.1
+      pg: 8.23.0
+
   dts-resolver@2.1.3(oxc-resolver@11.20.0):
     optionalDependencies:
       oxc-resolver: 11.20.0
@@ -14165,6 +14473,8 @@ snapshots:
 
   highlight.js@11.11.1: {}
 
+  hono@4.13.7: {}
+
   hookable@5.5.3: {}
 
   hsl-to-hex@1.0.0:
@@ -15659,6 +15969,41 @@ snapshots:
       linebreak: 1.1.0
       png-js: 2.0.0
 
+  pg-cloudflare@1.4.0:
+    optional: true
+
+  pg-connection-string@2.14.0: {}
+
+  pg-int8@1.0.1: {}
+
+  pg-pool@3.14.0(pg@8.23.0):
+    dependencies:
+      pg: 8.23.0
+
+  pg-protocol@1.16.0: {}
+
+  pg-types@2.2.0:
+    dependencies:
+      pg-int8: 1.0.1
+      postgres-array: 2.0.0
+      postgres-bytea: 1.0.1
+      postgres-date: 1.0.7
+      postgres-interval: 1.2.0
+
+  pg@8.23.0:
+    dependencies:
+      pg-connection-string: 2.14.0
+      pg-pool: 3.14.0(pg@8.23.0)
+      pg-protocol: 1.16.0
+      pg-types: 2.2.0
+      pgpass: 1.0.5
+    optionalDependencies:
+      pg-cloudflare: 1.4.0
+
+  pgpass@1.0.5:
+    dependencies:
+      split2: 4.2.0
+
   picocolors@1.1.1: {}
 
   picomatch@2.3.2: {}
@@ -15771,6 +16116,16 @@ snapshots:
       picocolors: 1.1.1
       source-map-js: 1.2.1
 
+  postgres-array@2.0.0: {}
+
+  postgres-bytea@1.0.1: {}
+
+  postgres-date@1.0.7: {}
+
+  postgres-interval@1.2.0:
+    dependencies:
+      xtend: 4.0.2
+
   prelude-ls@1.2.1: {}
 
   prettier@3.9.6: {}
@@ -16683,6 +17038,8 @@ snapshots:
 
   space-separated-tokens@2.0.2: {}
 
+  split2@4.2.0: {}
+
   stack-trace@0.0.10: {}
 
   stackback@0.0.2: {}
@@ -16979,6 +17336,12 @@ snapshots:
     optionalDependencies:
       fsevents: 2.3.3
 
+  tsx@4.23.13:
+    dependencies:
+      esbuild: 0.28.1
+    optionalDependencies:
+      fsevents: 2.3.3
+
   turbo@2.10.11:
     optionalDependencies:
       '@turbo/darwin-64': 2.10.11
@@ -17204,6 +17567,22 @@ snapshots:
       tsx: 4.20.6
       yaml: 2.8.3
 
+  vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3):
+    dependencies:
+      lightningcss: 1.32.0
+      picomatch: 2.3.2
+      postcss: 8.5.25
+      rolldown: 1.0.3
+      tinyglobby: 0.2.17
+    optionalDependencies:
+      '@types/node': 22.12.0
+      esbuild: 0.28.1
+      fsevents: 2.3.3
+      jiti: 2.7.0
+      terser: 5.43.1
+      tsx: 4.23.13
+      yaml: 2.8.3
+
   vitest@4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.20.6)(yaml@2.8.3)):
     dependencies:
       '@vitest/expect': 4.1.8
@@ -17233,6 +17612,35 @@ snapshots:
     transitivePeerDependencies:
       - msw
 
+  vitest@4.1.8(@opentelemetry/api@1.9.1)(@types/node@22.12.0)(@vitest/coverage-v8@4.1.8)(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)):
+    dependencies:
+      '@vitest/expect': 4.1.8
+      '@vitest/mocker': 4.1.8(vite@8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3))
+      '@vitest/pretty-format': 4.1.8
+      '@vitest/runner': 4.1.8
+      '@vitest/snapshot': 4.1.8
+      '@vitest/spy': 4.1.8
+      '@vitest/utils': 4.1.8
+      es-module-lexer: 2.3.1
+      expect-type: 1.3.0
+      magic-string: 0.30.21
+      obug: 2.1.1
+      pathe: 2.0.3
+      picomatch: 2.3.2
+      std-env: 4.1.0
+      tinybench: 2.9.0
+      tinyexec: 1.0.4
+      tinyglobby: 0.2.17
+      tinyrainbow: 3.1.0
+      vite: 8.0.16(@types/node@22.12.0)(esbuild@0.28.1)(jiti@2.7.0)(terser@5.43.1)(tsx@4.23.13)(yaml@2.8.3)
+      why-is-node-running: 2.3.0
+    optionalDependencies:
+      '@opentelemetry/api': 1.9.1
+      '@types/node': 22.12.0
+      '@vitest/coverage-v8': 4.1.8(vitest@4.1.8)
+    transitivePeerDependencies:
+      - msw
+
   void-elements@3.1.0: {}
 
   vscode-jsonrpc@8.2.0: {}
@@ -17439,6 +17847,8 @@ snapshots:
     dependencies:
       is-wsl: 3.1.1
 
+  xtend@4.0.2: {}
+
   y-indexeddb@9.0.12(yjs@13.6.27):
     dependencies:
       lib0: 0.2.114
``
