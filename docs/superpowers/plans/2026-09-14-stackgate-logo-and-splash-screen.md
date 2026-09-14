# StackGate Logo & Animated Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the official StackGate brand assets (The Layered Stack & Portal) on Figma via Figma MCP, integrate the vector logo mark and lockup into `@makeplane/propel`, and replace the raster loading GIF in `apps/web` with a crisp, GPU-accelerated SVG animated splash screen.

**Architecture:** 
- Design in Figma: Create a design file in the user's team workspace (`team::1613365354803641480`) containing Logo Exploration, Wordmark Lockups, and Color Tokens via `use_figma`.
- Brand Icons in Propel: Update `packages/propel/src/icons/brand/plane-logo.tsx` and `plane-lockup.tsx` with clean SVG vectors.
- Animated Loading in Web: Implement `LogoSpinner` in `apps/web/core/components/common/logo-spinner.tsx` using an animated SVG with staggered floating layers and a glowing portal pulse.

**Tech Stack:** Figma MCP Plugin API, React 19, TypeScript, Tailwind CSS, SVG + CSS Keyframes.

## Global Constraints
- Target branch: `master`.
- No placeholders (`TODO`, `TBD`).
- Quality gate: `pnpm --filter @makeplane/propel build`, `pnpm --filter web check:types`, `pnpm --filter web check:lint`, `pnpm --filter web build` exit 0.
- Zero network errors on DevTools console.

---

### Task 1: Generate Brand Identity Canvas in Figma via Figma MCP

**Files:**
- Output: Remote Figma file on `team::1613365354803641480`

**Interfaces:**
- Consumes: `figma_create_new_file`, `figma_use_figma`, skills `figma-create-new-file`, `figma-use`
- Produces: Live Figma File URL with 3 frames (Logo Exploration, Brand Lockup, Color Tokens)

- [ ] **Step 1: Create a new Figma design file**
Call `figma_create_new_file` with:
- `planKey`: `"team::1613365354803641480"`
- `fileName`: `"StackGate - Brand Identity & Design System"`
- `editorType`: `"design"`
Record the returned `fileKey` and `url`.

- [ ] **Step 2: Generate Logo Marks, Lockups, and Color Tokens canvas**
Execute `figma_use_figma` on the created `fileKey`:
- Draw Frame 1: "Logo Exploration" (256px master vector, 64px app icon with gradient rounded background, 16px favicon glyph).
  - Geometri: 3 horizontal slanted stacked plates (angle 15deg) with central portal cutout forming the letter 'S'.
  - Colors: Linear gradient #3B82F6 -> #4F46E5, Cyan highlight #06B6D4.
- Draw Frame 2: "Brand Lockup" (Horizontal Mark + "StackGate" typography with Stack in Medium and Gate in Bold, both Light and Dark variants).
- Draw Frame 3: "Color Tokens & Palette" (Swatches for Tech Blue #3B82F6, Indigo #4F46E5, Cyan #06B6D4, Slate 900 #0F172A).

- [ ] **Step 3: Verify and record Figma File URL**
Verify nodes were created successfully and output the markdown URL link.

---

### Task 2: Implement Vector Logo & Lockup in `@makeplane/propel`

**Files:**
- Modify: `packages/propel/src/icons/brand/plane-logo.tsx`
- Modify: `packages/propel/src/icons/brand/plane-lockup.tsx`

**Interfaces:**
- Produces: Exported React SVG components `PlaneLogo` and `PlaneLockup` with the new StackGate geometry

- [ ] **Step 1: Implement `PlaneLogo` with StackGate vector geometry**
In `packages/propel/src/icons/brand/plane-logo.tsx`:
Replace the old Plane fold with the 3-layer stacked portal geometry (viewBox 0 0 64 64) with gradient and solid color support.

- [ ] **Step 2: Implement `PlaneLockup` with StackGate vector + typography**
In `packages/propel/src/icons/brand/plane-lockup.tsx`:
Combine the `PlaneLogo` vector mark with clean inline text typography `StackGate` (Stack in weight 500, Gate in weight 700).

- [ ] **Step 3: Build `@makeplane/propel` and verify**
Run: `pnpm --filter @makeplane/propel build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**
Commit: `feat(propel): implement stackgate layered stack and portal vector logo`

---

### Task 3: Implement Animated Loading & Splash Screen in `apps/web`

**Files:**
- Modify: `apps/web/core/components/common/logo-spinner.tsx`

**Interfaces:**
- Consumes: `PlaneLogo` from `@plane/propel/icons`, Tailwind CSS keyframes
- Produces: Clean SVG animated component `LogoSpinner` replacing raster GIFs

- [x] **Step 1: Implement `LogoSpinner` with SVG motion**
In `apps/web/core/components/common/logo-spinner.tsx`:
Replace the `<img>` raster gif loader with a pure vector animated spinner:
- 3 stacked geometric plates with `@keyframes` staggered glide.
- Center portal breathing glow pulse (1.6s ease-in-out infinite).
- Responsive size (supports small and medium loading contexts).
- Crisp on high-DPI displays.

- [x] **Step 2: Verify formatting, types, and build**
Run:
`pnpm --filter web fix:format`
`pnpm --filter web check:types`
`pnpm --filter web check:lint`
`pnpm --filter web build`

- [x] **Step 3: Commit**
Commit: `feat(web): replace raster gif loader with vector animated stackgate splash screen`

---

### Task 4: Quality Gate & E2E Production Verification

**Files:**
- Entire codebase.

- [ ] **Step 1: Push changes to master**
```bash
rtk git push origin master
```
Monitor CI run on GitHub Actions until completion.

- [ ] **Step 2: E2E browser verification**
- Navigate to `https://stackgate-web.vercel.app/`
- Inspect splash/loading screen animation during navigation.
- Check DevTools console for 0 errors.
- Present live Figma URL to the user for evaluation and review.
