# FSM — Field Service Management

A multi-tenant field service management web app: schedule jobs, dispatch
technicians, track work in the field, and bill customers. See
[skills.md](skills.md) for the full domain model, feature scope, and the
phased build plan this repo follows.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **PostgreSQL** via **Prisma 7** (driver adapter: `@prisma/adapter-pg`)
- **Zod** for validation, **Vitest** for unit tests

## Getting started

```bash
npm install
# .env already has a local DATABASE_URL (postgres@localhost:5432/fsm)

npm run dev:db                # start a local Postgres (embedded, no Docker) — leave running
npm run db:push               # create tables (first run only)
npm run db:seed               # load demo data (Acme Field Services)
npm run dev                   # http://localhost:3000  -> /dashboard
```

`npm run dev:db` downloads a real PostgreSQL binary on first run and stores
data in `./.pgdata`. If you already have your own Postgres, set `DATABASE_URL`
in `.env` and skip `dev:db`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run lint` / `typecheck` / `format` | ESLint / `tsc --noEmit` / Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run db:generate` / `db:push` / `db:migrate` | Prisma client / schema sync / migrations |
| `npm run db:seed` / `db:studio` | Seed demo data / open Prisma Studio |

## Layout

```
prisma/schema.prisma     domain model (skills.md §2)
prisma/seed.ts           demo data
src/server/lib/          db, env, money (cents), rbac matrix, job state machine
src/config/nav.ts        module navigation
src/app/(app)/           authed app shell + dashboard
src/generated/prisma/    generated Prisma client (gitignored)
```

## Build progress

- [x] **Phase 0 — Foundation**: scaffold, schema, core lib, seed, CI, app shell
- [x] **Phase 1 — Auth & tenancy**: signup (tenant+owner), login/logout,
      signed-cookie sessions, RBAC-filtered shell, proxy guard, settings/team
- [x] **Phase 2 — Customers / sites / assets**: CRUD + search, nested contacts /
      sites / assets, soft delete, per-customer history timeline (activity log)
- [x] **Phase 3 — Work orders**: job CRUD + per-tenant numbering, status
      state-machine workflow, line items with live totals/tax, technician
      assignment, scheduling fields, notes/activity timeline, status filter
- [x] **Phase 4 — Scheduling & dispatch board**: day view with technician
      columns, **drag-and-drop** reassignment, overlap/conflict detection,
      unscheduled-jobs panel with one-click scheduling, date navigation
- [x] **Phase 5 — Technician mobile (PWA)**: mobile field app at `/field`
      (techs land here at login), my-jobs list, status workflow, time
      check-in/out, log parts, photo upload + signature capture, installable
      PWA (manifest + service worker). Uploads stored on disk under `./uploads`,
      served tenant-scoped via `/api/files/[id]`.
- [x] **Phase 6 — Invoicing & payments**: invoice from completed job, manual
      payments (cash/card/check/ACH), invoice lifecycle, A/R outstanding,
      job→invoice→paid loop that auto-closes the job
- [x] **Phase 7 — Estimates & customer portal**: estimates with line items,
      send → public approval token, no-auth `/portal` approve/reject, convert
      approved estimate → job
- [x] **Phase 8 — Inventory & recurring contracts**: parts CRUD, low-stock
      filter/badges, inline stock adjust; service contracts with frequency and
      a generate-due action that creates the next jobs
- [x] **Phase 9 — Reporting & alerts**: revenue (month/total), A/R, jobs by
      status, top customers, technician workload; dashboard alerts (overdue
      invoices, unscheduled jobs, due contracts, low stock)
- [x] **Phase 10 — Settings & polish**: tax-rate config, team management
      (add member, change role, activate/deactivate), forbidden→dashboard
      redirect instead of erroring

**Status: all 10 phases complete.** Live demo:
<https://fsm-unigreen.netlify.app> (Netlify + Neon Postgres). See
[DEPLOY.md](DEPLOY.md).

**UI language: Thai** (ภาษาไทย). All copy lives in [src/i18n.ts](src/i18n.ts);
amounts display in THB (฿).

Demo login after `npm run db:seed`: `owner@acme.test` / `password123`
(also `dispatch@acme.test`, `tina@acme.test`, `tom@acme.test`).
