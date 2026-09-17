# Task 1 Brief — Fork Plane and trim unused apps

Source: `docs/superpowers/plans/2026-09-09-stackgate-mvp-foundation.md`, Task 1.
Branch: `plan-01-foundation` (base `768a054`). Work from `D:\Project\Web Project\Enuma\StackGate`.

## Requirements

- Clone upstream `https://github.com/makeplane/plane.git` (branch `preview`) to `$env:TEMP\plane-upstream`. Never clone inside StackGate.
- Copy into StackGate: `apps/web`, `apps/live`, `packages`, `patches`, plus root files `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.npmrc`, `.node-version`, `.oxlintrc.json`, `.oxfmtrc.json`, `.prettierignore`, `.gitignore`, `.husky`, `LICENSE.txt`, `setup.sh`. Never copy any `.git` directory. Never copy upstream `AGENTS.md` (ours already exists at root).
- Delete the temp dir afterwards.
- In `pnpm-workspace.yaml`, delete exactly the lines `  - "!apps/api"` and `  - "!apps/proxy"` so the final `packages:` block reads:
  ```yaml
  packages:
    - apps/*
    - packages/*
  ```
- Regenerate the lockfile with `pnpm install --no-frozen-lockfile` (frozen install is expected to fail after deleting workspace projects, so regeneration is required). Expect exit code 0.
- Verify with `pnpm --filter web check:types`. Expect exit code 0, no TypeScript errors.
- Commit exactly: `git add apps packages patches package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc .node-version .oxlintrc.json .oxfmtrc.json .prettierignore .gitignore .husky LICENSE.txt setup.sh` then `git commit -m "feat: fork plane web+live+packages, trim admin/space/django/proxy"`.

## Binding constraints

- Recipe commands run from `D:\Project\Web Project\Enuma\StackGate`.
- Quote every PowerShell path containing spaces with double quotes.
- Never commit secrets. Forked Plane code stays AGPL-3.0; keep `LICENSE.txt`.
- Stay on branch `plan-01-foundation`. Do not touch `master`.
- `apps/admin`, `apps/space`, Django `apps/api`, `apps/proxy`, and `deployments` must not exist in the result. Verify with `Get-ChildItem apps` showing only `live` and `web`.
