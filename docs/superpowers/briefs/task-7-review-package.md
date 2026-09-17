# Task 7 review package
## Commits
3183530 ci: web checks plus api checks and tests
## Stat
 .github/workflows/ci.yml | 41 +++++++++++++++++++++++++++++++++++++++++
 1 file changed, 41 insertions(+)
## Full diff
``diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000..ff4140f
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,41 @@
+name: ci
+on:
+  push:
+    branches: [master, plan-01-foundation]
+  pull_request:
+jobs:
+  web:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: pnpm/action-setup@v4
+        with:
+          version: 11.10.0
+      - uses: actions/setup-node@v4
+        with:
+          node-version: "22"
+          cache: pnpm
+      - run: pnpm install --no-frozen-lockfile
+      - run: pnpm --filter web check:lint
+      - run: pnpm --filter web check:types
+      - run: pnpm --filter web check:format
+      - run: pnpm --filter web build
+  api:
+    runs-on: ubuntu-latest
+    env:
+      DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
+      TEST_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
+      JWT_SECRET: "ci-only-secret-32-chars-minimum-x"
+    steps:
+      - uses: actions/checkout@v4
+      - uses: pnpm/action-setup@v4
+        with:
+          version: 11.10.0
+      - uses: actions/setup-node@v4
+        with:
+          node-version: "22"
+          cache: pnpm
+      - run: pnpm install --no-frozen-lockfile
+      - run: pnpm --filter stackgate-api check:lint
+      - run: pnpm --filter stackgate-api check:types
+      - run: pnpm --filter stackgate-api test
``
