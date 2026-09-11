# Rebrand Metadata and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up external open-source references to Plane (GitHub star button, external help links, Community badge, plane.so legal links) and update site metadata/SEO to StackGate branding without referencing "internship".

**Architecture:** Update constants in `packages/constants/src/metadata.ts`, clean up UI components in `apps/web/core/components/`, update `root.tsx` and PWA manifests, and verify in production browser.

**Tech Stack:** React 19, TypeScript, Vite, React Router 8.

## Global Constraints
- Target branch: `master`.
- Do not mention "internship" or "magang" in branding metadata.
- Keep Plane visual logos/theme intact as requested.
- Quality gate: `check:types` exit 0, `check:lint` pass, `pnpm --filter web build` exit 0.

---

### Task 1: Update Metadata, SEO Constants, and PWA Manifests

**Files:**
- Modify: `packages/constants/src/metadata.ts`
- Modify: `apps/web/app/root.tsx:35-95`
- Modify: `apps/web/core/components/core/page-title.tsx:19`
- Modify: `apps/web/public/manifest.json`
- Modify: `apps/web/public/site.webmanifest.json`

- [ ] **Step 1: Update `packages/constants/src/metadata.ts`**

Change values to:
```typescript
export const SITE_NAME = "StackGate | Modern Project Management & Quality Gate Platform";
export const SITE_TITLE = "StackGate | Modern Project Management & Quality Gate Platform";
export const SITE_DESCRIPTION =
  "Modern project management platform with strict quality gates to plan, track, and deliver work items.";
export const SITE_KEYWORDS =
  "project management, quality gates, work items, kanban, software development, tracking, collaboration";
export const SITE_URL = "https://stackgate-web.vercel.app/";
export const TWITTER_USER_NAME = "StackGate";
```

- [ ] **Step 2: Update `apps/web/app/root.tsx`**

Change `APP_TITLE` and meta description:
```typescript
const APP_TITLE = "StackGate | Modern Project Management & Quality Gate Platform";
```
In `meta`:
```typescript
export const meta: Route.MetaFunction = () => [
  { title: APP_TITLE },
  { name: "description", content: SITE_DESCRIPTION },
  { property: "og:title", content: APP_TITLE },
  {
    property: "og:description",
    content: SITE_DESCRIPTION,
  },
  { property: "og:url", content: "https://stackgate-web.vercel.app/" },
  ...
];
```

- [ ] **Step 3: Update `apps/web/core/components/core/page-title.tsx`**

Change line 19 fallback title:
```typescript
document.title = title ?? "StackGate";
```

- [ ] **Step 4: Update PWA Manifests**

In `apps/web/public/manifest.json`:
```json
{
  "name": "StackGate",
  "short_name": "StackGate",
  ...
}
```

In `apps/web/public/site.webmanifest.json`:
```json
{
  "name": "StackGate",
  "short_name": "StackGate",
  "description": "Modern project management platform with strict quality gates.",
  ...
}
```

- [ ] **Step 5: Verify types and commit**

Run: `pnpm --filter @plane/constants build && pnpm --filter web check:types`
Commit: `feat(web): update metadata and manifest to stackgate branding`

---

### Task 2: Remove External Open-Source Components (Navbar, Sidebar, Auth)

**Files:**
- Modify: `apps/web/core/components/navigation/top-navigation-root.tsx:80-85`
- Modify: `apps/web/core/components/workspace/sidebar/help-section/root.tsx:49-88`
- Modify: `apps/web/core/components/workspace/edition-badge.tsx:19-45`
- Modify: `apps/web/core/components/account/terms-and-conditions.tsx`

- [ ] **Step 1: Remove Star on GitHub from Navbar**

In `apps/web/core/components/navigation/top-navigation-root.tsx`:
Remove `<StarUsOnGitHubLink />` from the render tree (line 81).

- [ ] **Step 2: Clean Help Menu External Links**

In `apps/web/core/components/workspace/sidebar/help-section/root.tsx`:
Remove `CustomMenu.MenuItem` for documentation (`go.plane.so`), contact sales (`sales@plane.so`), forum (`forum.plane.so`), and `<PlaneVersionNumber />`.
Keep keyboard shortcuts and product updates modal intact.

- [ ] **Step 3: Disable Community Edition Badge in Sidebar**

In `apps/web/core/components/workspace/edition-badge.tsx`:
Change component to return `null`:
```typescript
export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  return null;
});
```

- [ ] **Step 4: Remove plane.so Terms & Privacy on Auth Screen**

In `apps/web/core/components/account/terms-and-conditions.tsx`:
Return `null` instead of the paragraph linking to `plane.so/legals/...`.

- [ ] **Step 5: Verify types, lint, and build**

Run:
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter web build`
Commit: `feat(web): remove external open-source buttons, help links, and edition badge`

---

### Task 3: Quality Gate & E2E Verification

- [ ] **Step 1: Push changes to master**
```bash
rtk git push origin master
```

- [ ] **Step 2: Verify in browser on production**
- Navigate to `https://stackgate-web.vercel.app/`
- Check document `<title>` = `StackGate | Modern Project Management & Quality Gate Platform`
- Verify no "Star us on GitHub" button in navbar
- Verify no "Community" badge in sidebar
- Verify no `plane.so` terms link on login screen
