# AI Orbit — Learn Module

A backend-engineering internship assignment with a focused frontend that demonstrates the complete Learn workflow.

## Tech stack

- Next.js 15 App Router, React, and TypeScript
- Node.js route-handler runtime
- PostgreSQL on Neon
- Prisma ORM
- Zod validation

## Features

Published resource discovery with search, filters, sorting, and pagination; resource and lesson experiences; demo-user enrollment, bookmarks, progress, and My Learning; and validated, role-protected content administration APIs.

## Architecture

```text
Frontend
↓
Next.js Route Handlers
↓
Validation / Demo Auth
↓
Service Layer
↓
Repository Layer
↓
Prisma
↓
Neon PostgreSQL
```

Route handlers translate HTTP requests and responses. Services enforce application rules and transaction boundaries. Repositories own bounded Prisma queries and explicit projections. See [docs/API.md](docs/API.md) for the HTTP contract.

## Setup

Requires Node.js 20.9 or newer and a Neon PostgreSQL database.

```bash
npm install
```

Copy `.env.example` to `.env` and provide both Neon connection strings:

```env
DATABASE_URL="postgresql://..." # pooled URL used by the application
DIRECT_URL="postgresql://..."   # direct URL used by Prisma migrations
```

Never commit `.env` or real credentials. Then prepare and run the project:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

The deterministic seed is optional outside development/demo environments. It only upserts known UUIDs and replaces category/tag links for those known resources; it does not perform unrestricted cleanup or run during startup.

## Demo users

The UI selector switches between the seeded normal users Maya Patel and Daniel Kim. Authenticated demo requests automatically send their UUID in `x-demo-user-id`.

| Demo identity | UUID | Use |
| --- | --- | --- |
| Maya Patel | `10000000-0000-4000-8000-000000000001` | Learner UI/API |
| Daniel Kim | `10000000-0000-4000-8000-000000000002` | Learner UI/API |
| Aisha Rahman | `10000000-0000-4000-8000-000000000003` | Admin API only |

The administrator uses `admin@learn-demo.example` in the seed data. Admin tools are intentionally not exposed in the learner UI.

This header is a deliberately isolated demo-auth boundary, not production authentication. Replace the resolver in `src/modules/auth/demo-user.ts` with a trusted session provider before using the module with real users.

## Testing and verification

```bash
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm test
npm run build
npm audit
```

## Design decisions

- PostgreSQL relations and foreign keys preserve content and learning-history integrity.
- Explicit category/resource and tag/resource join tables provide controllable uniqueness and indexing.
- Composite unique keys prevent duplicate lessons, enrollments, bookmarks, and progress records.
- Migration-level checks protect percentages, positions, positive lesson order, and nonnegative durations.
- Listing, My Learning, and bookmarks use server-side filtering and bounded pagination.
- Serializable transactions keep lesson progress and enrollment completion synchronized.
- Resource deletion becomes archival whenever user history exists.
- Demo authentication is centralized so a real authentication adapter can replace it without rewriting services.

## Deployment

For Vercel or a similar Node.js Next.js platform, configure `DATABASE_URL` and `DIRECT_URL`, run `npx prisma migrate deploy` as a controlled release step, and use `npm run build`. `postinstall` generates Prisma Client; startup never migrates or seeds automatically. Use Neon’s pooled connection string for runtime traffic and its direct connection string for migrations.
