# StackGate Guidelines

The StackGate guidelines are specifically curated for this ticket-based project management platform for software houses using intern developers. These guidelines should be followed closely to ensure the best experience when extending the Plane-based frontend and building the lightweight replacement backend.

## Foundational Context

This application is a React Router single-page application (frontend fork) with a Hono API replacement backend, and its main packages & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- Node.js - >=22.22.0
- pnpm - 11.10.0
- turbo - 2.10.11
- React - 19.2.8
- React DOM - 19.2.8
- React Router - 8.3.0
- Vite - 8.0.16
- TypeScript - 5.8.3
- Tailwind CSS - 4.1.17
- MobX - 6.12.0
- SWR - 2.4.2
- Axios - 1.18.1
- Zod - ^3.25.76
- Vitest - ^4.1.8
- oxlint - 1.51.0
- oxfmt - 0.35.0

Version provenance—versions above were detected from the upstream `makeplane/plane` preview branch (`v1.4.2`) workspace catalog and app manifests, which this fork inherits until explicitly re-pinned. You must never invent a version. When the local fork exists, re-verify against its lockfile before changing any version.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `removeCommentReaction`, not `delRx`.
- Check for existing components to reuse before writing a new one.
- All HTTP access must go through the `APIService` base class in `packages/services`. Direct `fetch` or `axios` calls in components are strictly forbidden.
- Service methods must unwrap with `.then((response) => response?.data)` and rethrow with `.catch((error) => { throw error?.response; })`, exactly as the existing services do.
- Use `import type` for type-only imports, as in `import type { AxiosInstance, AxiosRequestConfig } from "axios"`.
- Match the license header comment block of sibling files when creating a new file in forked code.
- You must not introduce new `any` types. Legacy `params: any` signatures may be narrowed, never widened.

## Verification Scripts

- Do not create verification scripts when existing manual checks or build processes cover that functionality and prove they work.

## Application Structure & Architecture

- Stick to the existing directory structure; don't create new base folders without approval.
  - `apps/web` — the main SPA (routes, core stores, helpers, styles)
  - `packages/services/src/<domain>` — one folder per API domain (`auth`, `issue`, `project`, `workspace`, `state`, `cycle`, `module`, `user`, `file`)
  - `packages/ui`, `packages/types`, `packages/utils` — shared components, contracts, helpers
  - `apps/live/src` — realtime server (`server.ts`, `hocuspocus.ts`, `redis.ts`, `controllers/`, `services/`)
- `apps/admin` and `apps/space` are frozen out of the MVP. You must not add features to them.
- The Django backend, Celery workers, RabbitMQ, and MinIO are deleted in this fork. You must not reintroduce them.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to restart the development server or rebuild. Ask them to run the appropriate dev or build command.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations—focus on what's important rather than explaining obvious details.

# React Router

## Tools

- Run the web dev server via command line: `pnpm --filter web dev` (utilizes React Router dev server on port 3000).
- Production build: `pnpm --filter web build` (emits a static client bundle served with `serve -s build/client`).
- Typecheck with codegen: `pnpm --filter web check:types` (utilizes `react-router typegen && tsc --noEmit`).
- Root monorepo commands run through Turbo: `turbo run dev --concurrency=18`, `turbo run build`, `turbo run check`.

## Searching Documentation (IMPORTANT)

- Always refer to React Router v8 documentation for version-specific guidance.
- React Router v7+ API names and codemods do not apply here. You must verify every API against the v8 docs before use.

## Route Modules and SSR Boundaries

- The web app ships as a static SPA. You must not add server loaders or server-only modules to `apps/web`.
- SSR (`@react-router/serve`) exists only in the frozen `apps/space`. You must not copy that pattern into `apps/web`.
- Keep route config in `react-router.config.ts` and path aliases in `vite-tsconfig-paths`. You must not hardcode hostnames in routes—hosts come only from `VITE_*_BASE_URL` environment variables.

# TypeScript

- Target the pinned TypeScript 5.8.3 behavior. You must keep `check:types` green on every change.
- Parameters must use explicit descriptive names with exact domain vocabulary, e.g. `retrieve(anchor: string, issueID: string)` and `removeCommentReaction(anchor: string, commentId: string, reactionHex: string)`.
- Single-letter parameters and opaque abbreviations are strictly forbidden. Always use `data` instead of `d`, `commentId` instead of `cid`, `anchor` instead of `a`.
- Prefer `import type` for types and keep runtime imports free of type-only specifiers.
- Error values crossing the service boundary must be the unwrapped `error?.response`, never raw Axios errors.

# Deployment

- Default deploy branch is `master`. Never set another branch as production branch.
- Vercel production branch for `stackgate-web` and `stackgate-api` must be `master`.

# Browser & DevTools Verification

- Whenever verifying or testing in the browser (via Playwright or manual loops), you MUST check DevTools console logs (`playwright_browser_console_messages` level "error") immediately after navigating or interacting. Never rely on visual snapshots alone.
- Any 4xx/5xx network errors, unhandled exceptions, or console errors must be investigated, traced to their root cause, and resolved before marking work complete.

- Web frontend deploys as static output (`build/client`) to Vercel. Backend API deploys as Vercel Functions with the Node.js runtime. Realtime (`apps/live`) deploys as a persistent Node process on Render (512MB).
- Required frontend variables: `VITE_API_BASE_URL`, `VITE_WEB_BASE_URL`, `VITE_LIVE_BASE_URL`, `VITE_LIVE_BASE_PATH` (always `/live`).
- Required live variables: `REDIS_URL` (Upstash, never localhost in production) and `LIVE_SERVER_SECRET_KEY`.
- CORS on the API must use an explicit allowlist. Wildcard origins are strictly forbidden in production.
- Vercel Hobby functions time out after roughly 10 seconds. Long-running work such as exports and analytics aggregation is out of scope and must stay out of the request path.

# Test Enforcement

- `apps/web` ships no unit test runner. You must verify web changes with `check:lint` (`oxlint --max-warnings=11957`), `check:types`, `check:format` (`oxfmt --check`), and a production `build`.
- `apps/live` uses Vitest (`vitest run`, coverage via `@vitest/coverage-v8`). You must add or update tests with every live change and run the suite before committing.
- The replacement API must cover the transition-guard matrix with Vitest: student rejected from Client Ready, lead rejected with incomplete checklist, ticket without required research link rejected from Review.
- API tests must never pollute production data: every test that creates rows must register them via `trackTicket`/`trackProject` in `apps/api/tests/cleanup.ts` (auto-deleted in `afterAll`). For full isolation, point `TEST_DATABASE_URL` at a separate Neon branch — under vitest it takes precedence over `DATABASE_URL`.
- Do not claim a change works without showing the exact command run and its passing output.

# Tailwind CSS

- Styling uses Tailwind CSS 4.1.17 through `@tailwindcss/postcss`, with typography utilities from `@tailwindcss/typography` 0.5.19 and the shared `@plane/tailwind-config` workspace package.
- Compose conditional classes with `clsx` (^2.1.1) and resolve conflicts with `tailwind-merge` (3.4.0). Hand-rolled class concatenation with ternaries is strictly forbidden.
- Variant-driven component styles must use `class-variance-authority` (0.7.1). Inline style objects for layout or spacing are strictly forbidden.
- Icons must come from `lucide-react` (0.469.0). Emoji or image-file icons are strictly forbidden.

# Client State and Data Fetching

- Client state uses MobX (6.12.0) with `mobx-react` (9.2.2) observers and `mobx-utils` (6.0.8) derivations. Local `useState` duplication of store-owned server state is strictly forbidden.
- Server data uses SWR (2.4.2) with service-backed keys. Ad-hoc polling with `setInterval` outside SWR configuration is strictly forbidden.
- HTTP uses Axios (1.18.1) exclusively through subclasses of `APIService`, constructed with a base URL and `withCredentials: true`. You must preserve that credential behavior in the adapter.
- Service method names must follow the existing verb vocabulary: `list`, `retrieve`, `addComment`, `updateComment`, `removeComment`, `addVote`, `removeVote`. Inventing synonyms such as `fetchIssue` or `deleteComment2` is strictly forbidden.
- Dates use `date-fns` (^4.1.0). Manual date arithmetic with millisecond constants is strictly forbidden.

# Realtime Collaboration

- Realtime uses `@hocuspocus/server` (2.15.2) with `@hocuspocus/extension-redis`, `yjs` (^13.6.20), `y-prosemirror` (^1.3.7), `y-protocols` (^1.0.6), and `@tiptap/core` (^2.22.3) over `express` (4.22.0) plus `express-ws` (^5.0.2), with `ioredis` (5.7.0) as the pub/sub transport.
- The live server requires persistent WebSocket connections. You must never attempt to run it on serverless functions.
- Redis must point at Upstash in every deployed environment. A local Redis dependency for production behavior is strictly forbidden.
- Live builds with `tsdown` (0.16.0) and starts with `node --env-file=.env .`. You must keep that entrypoint contract unchanged.
