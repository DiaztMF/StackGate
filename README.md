# StackGate

A high-performance, ticket-based project management system tailored for software houses managing intern developers, featuring strict state transition gates and lightweight Hono API architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Plane%20SPA%20Fork-teal)](#architecture--development-guides)
[![Backend](https://img.shields.io/badge/Backend-Hono%20API-orange)](https://hono.dev/)
[![Database](https://img.shields.io/badge/Database-Neon%20Postgres-green)](https://neon.tech/)

## Installation

Clone the repository and install root monorepo dependencies:

```bash
git clone https://github.com/DiaztMF/StackGate.git
cd StackGate
pnpm install
```

## Quick Start

1. Create your backend environment configuration in `apps/api/.env`:

```bash
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
FRONTEND_URL="http://localhost:3000"
```

2. Push Drizzle schema and start the fullstack workspace:

```bash
# Terminal 1: API backend
cd apps/api
pnpm dev

# Terminal 2: Web frontend
cd apps/web
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the workspace board.

## What is StackGate?

`StackGate` is an engineered project tracking platform designed to mitigate code quality risks when supervising intern and junior developers. It wraps a fork of Plane's rich React interface (`apps/web`) with a custom, lightweight Hono backend (`apps/api`) that enforces strict state machine transitions before tickets can advance to code review, QA, or production deployment.

## Why StackGate?

Standard issue trackers like Jira or Trello allow arbitrary drag-and-drop state changes, leading to premature merging and unreviewed production releases. `StackGate` introduces strict server-side transition guards and audit trails that block unqualified progress until defined quality criteria and mentor sign-offs are satisfied.

## API / Routes

### Hono API Endpoints
- `GET /api/health`: Health status probe returning `{"data":{"ok":true}}`.
- `POST /api/auth/login`: Authenticates user credentials and issues access/refresh token pairs.
- `POST /api/auth/refresh`: Rotates refresh tokens and issues fresh 15-minute access JWTs.
- `GET /api/projects/:id/tickets`: Lists tickets scoped to project permissions.
- `POST /api/tickets/:id/transition`: Validates and triggers state changes against the transition guard matrix.

## Examples

Executing a controlled ticket transition via the Hono client:

```typescript
export async function advanceTicketState(ticketId: string, targetState: 'IN_REVIEW' | 'COMPLETED', token: string) {
  const response = await fetch(`/api/tickets/${ticketId}/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetState }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Transition disallowed by guard matrix');
  }

  return await response.json();
}
```

## Architecture & Development Guides

- Monorepo Architecture:
  - `apps/web`: Plane SPA fork (React Router, Tailwind CSS) operating on port 3000.
  - `apps/api`: Zero-bloat Hono backend with Drizzle ORM and Neon Postgres on port 8000.
- State Gate Matrix: State enforcement codified under `apps/api/src/tickets/`.
- Auth Lifecycle: 15-minute stateless JWT access tokens backed by rotating 7-day refresh tokens.

## License

MIT License. See [LICENSE](LICENSE) for full details.