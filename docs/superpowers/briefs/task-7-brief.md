# Task 7 Brief — CI workflow file (push and deploy handled by controller)

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 7 (amended: implementer writes + commits only the workflow file; controller creates the repo, pushes, sets secrets, creates Vercel projects, verifies).
Branch: `plan-01-foundation`. Work from `D:\Project\Web Project\Enuma\StackGate`.

## Requirements

Step 1 — create `.github/workflows/ci.yml` exactly:

```yaml
name: ci
on:
  push:
    branches: [master, plan-01-foundation]
  pull_request:
jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm --filter web check:lint
      - run: pnpm --filter web check:types
      - run: pnpm --filter web check:format
      - run: pnpm --filter web build
  api:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
      TEST_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
      JWT_SECRET: "ci-only-secret-32-chars-minimum-x"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm --filter stackgate-api check:lint
      - run: pnpm --filter stackgate-api check:types
      - run: pnpm --filter stackgate-api test
```

Validate the YAML parses (e.g. `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` if PyYAML exists, otherwise `node -e` with a yaml parse, otherwise careful visual check against the block above — report which method you used).

Step 2 — commit exactly: `git add .github/workflows/ci.yml` then `git commit -m "ci: web checks plus api checks and tests"`. Do NOT push (no remote exists yet; the controller handles repo creation and push).

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Stay on branch `plan-01-foundation`. Do not touch `master`. Do not create remotes.
