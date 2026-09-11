# Full UI & Copy Rebrand to StackGate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand all visible UI text, headlines, welcome copy, auth headers/footers, and brand lockups from Plane to StackGate across the entire frontend.

**Architecture:** Update auth screen components (`auth-header.tsx`, `footer.tsx`, `header.tsx`), update shared i18n copy in `packages/i18n/src/locales/en/` (`home.json`, `workspace.json`, `auth.json`), and modernize the brand lockup component.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, i18next.

## Global Constraints
- Target branch: `master`.
- Do not mention "internship" or "magang" in branding copy.
- Quality gate: `pnpm --filter @plane/i18n build`, `pnpm --filter web check:types`, `pnpm --filter web check:lint`, `pnpm --filter web build`.

---

### Task 1: Rebrand Auth Screen Copy & Header Brand Lockup

**Files:**
- Modify: `apps/web/core/components/account/auth-forms/auth-header.tsx:28-56`
- Modify: `apps/web/core/components/auth-screens/footer.tsx:30-45`
- Modify: `packages/propel/src/icons/brand/plane-lockup.tsx`

- [ ] **Step 1: Update Auth Header Copy**

In `apps/web/core/components/account/auth-forms/auth-header.tsx`:
Replace `"Work in all dimensions."` with `"Project Quality & Gate Control."` and `"Welcome back to Plane."` with `"Welcome to StackGate."`
Update sign up header label to `"Create an account to start managing projects with quality gates."`

- [ ] **Step 2: Update Auth Footer**

In `apps/web/core/components/auth-screens/footer.tsx`:
Remove `"Join 10,000+ teams building with Plane"` and partner company logos, or replace with `"Trusted Software Project Delivery"`.

- [ ] **Step 3: Update `PlaneLockup` icon component to render StackGate brand mark**

In `packages/propel/src/icons/brand/plane-lockup.tsx`:
Render a clean SVG monogram / wordmark:
```tsx
export function PlaneLockup({ width = "120", height = "28", className }: ISvgIcons) {
  return (
    <div className={`flex items-center gap-2 font-bold tracking-tight text-primary select-none ${className || ""}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-primary text-xs text-on-color">
        S
      </span>
      <span className="text-base font-semibold tracking-tight">StackGate</span>
    </div>
  );
}
```

- [ ] **Step 4: Verify types and commit**

Run: `pnpm --filter @makeplane/propel build && pnpm --filter web check:types`
Commit: `feat(web): rebrand auth screen copy and brand lockup to stackgate`

---

### Task 2: Rebrand Dashboard & Workspace i18n Copy

**Files:**
- Modify: `packages/i18n/src/locales/en/home.json`
- Modify: `packages/i18n/src/locales/en/workspace.json`
- Modify: `packages/i18n/src/locales/en/auth.json`

- [ ] **Step 1: Update `home.json`**

In `packages/i18n/src/locales/en/home.json`:
- `"Most things start with a project in Plane."` -> `"Most things start with a project in StackGate."`
- `"Make Plane yours."` -> `"Customize StackGate."`

- [ ] **Step 2: Update `workspace.json`**

In `packages/i18n/src/locales/en/workspace.json`:
- `"To start using Plane, you need to create or join a workspace."` -> `"To start using StackGate, you need to create or join a workspace."`
- `"Welcome to Plane, we are excited to have you here."` -> `"Welcome to StackGate, we are excited to have you here."`
- `"Everything starts with a project in Plane"` -> `"Everything starts with a project in StackGate"`

- [ ] **Step 3: Update `auth.json`**

In `packages/i18n/src/locales/en/auth.json`:
- `"new_to_plane": "New to Plane?"` -> `"new_to_plane": "New to StackGate?"`

- [ ] **Step 4: Build i18n package and verify web types**

Run: `pnpm --filter @plane/i18n build && pnpm --filter web check:types`
Commit: `feat(i18n): update dashboard and workspace copy to stackgate`

---

### Task 3: Quality Gate & E2E Production Verification

**Files:**
- Entire codebase.

- [ ] **Step 1: Run type checking and linting**
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter stackgate-api test`

- [ ] **Step 2: Build web**
`pnpm --filter web build`

- [ ] **Step 3: Push to master and verify in production browser**
Verify in Playwright browser:
- Login page: "Project Quality & Gate Control", "Welcome to StackGate", logo StackGate.
- Dashboard quickstart: "Most things start with a project in StackGate", "Customize StackGate".
- No mentions of Plane on the user-facing screens.
