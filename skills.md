---
name: build-fsm-webapp
description: Playbook for designing and building a complete Field Service Management (FSM) web application — domain model, feature scope, architecture, tech stack, and a phased build plan.
metadata:
  type: reference
---

# Build a Field Service Management (FSM) Web App

A skill/playbook for building a complete, production-grade **Field Service Management** SaaS web app from scratch. FSM software coordinates the work of mobile technicians: scheduling jobs, dispatching the right person, tracking work in the field, billing the customer, and reporting on it all.

Use this as the source of truth for *what* to build and *in what order*. Build in vertical slices (one feature end-to-end) rather than horizontal layers.

---

## 1. The Domain in One Paragraph

A **customer** requests service. The office creates a **work order** (job) tied to a **site/asset**. A **dispatcher** schedules it onto a **technician's** calendar. The technician drives out, does the work, logs **time/parts/photos/signature** on a mobile screen, and marks it complete. The office turns the completed job into an **invoice**, takes **payment**, and the cycle repeats — with **recurring contracts** auto-generating future jobs. Everything is multi-tenant, role-based, and reportable.

---

## 2. Core Domain Model (entities + key fields)

Design the schema first — every feature maps back to these. Use UUIDs for PKs, `tenant_id` on every table, `created_at`/`updated_at`/`deleted_at` (soft delete) everywhere.

| Entity | Purpose | Key fields |
|---|---|---|
| **Tenant / Company** | Top-level isolation boundary | name, plan, timezone, settings(jsonb) |
| **User** | Anyone who logs in | email, password_hash, role, tenant_id, active |
| **Technician** | Field worker profile (1:1 with User) | skills[], certifications[], home_base, hourly_cost, color |
| **Customer** | Who pays | name, type(residential/commercial), billing_address, terms |
| **Contact** | People at a customer | name, email, phone, role, is_primary |
| **Site / Location** | Where work happens | customer_id, address, geo(lat/lng), access_notes, gate_code |
| **Asset / Equipment** | Serviced thing (HVAC unit, pump…) | site_id, make, model, serial, install_date, warranty_end |
| **Service / Price book item** | Catalog of offered work | name, category, default_duration, price, taxable |
| **Part / Inventory item** | Stocked materials | sku, name, cost, price, qty_on_hand, reorder_point |
| **Work Order / Job** | The unit of work | number, customer_id, site_id, status, priority, type, description, scheduled_window, assigned_tech_id |
| **Job Line Item** | Services/parts on a job | job_id, type(labor/part/fee), qty, unit_price, taxable |
| **Time Entry** | Labor tracking | job_id, tech_id, start, end, billable |
| **Appointment / Visit** | A scheduled slot (a job can have many) | job_id, tech_id, start, end, status |
| **Estimate / Quote** | Pre-approval pricing | customer_id, status, total, expires_at, line_items |
| **Invoice** | Bill to customer | job_id, number, status, subtotal, tax, total, due_date |
| **Payment** | Money received | invoice_id, amount, method, processor_ref, paid_at |
| **Contract / Agreement** | Recurring service | customer_id, frequency(RRULE), services[], next_run |
| **Attachment** | Files/photos | parent_type, parent_id, url, mime, uploaded_by |
| **Note / Activity** | Audit + comms log | parent_type, parent_id, body, author_id, kind |

**Job status lifecycle** (state machine — enforce transitions):
`draft → scheduled → dispatched → en_route → in_progress → on_hold → completed → invoiced → closed` (+ `cancelled` from most states).

---

## 3. Feature Scope (by module)

Build modules roughly in this priority order. **MVP = modules 1–6.**

1. **Auth & tenancy** — signup/login, JWT or session, password reset, multi-tenant isolation, RBAC (owner, admin, dispatcher, technician, accountant, read-only).
2. **Customers & sites** — CRUD, contacts, multiple sites per customer, asset tracking, history timeline.
3. **Work orders** — create/edit, status workflow, line items, assign technician, attachments, notes.
4. **Scheduling & dispatch board** — calendar (day/week/tech-column views), drag-and-drop assignment, conflict/overlap detection, map view of jobs + technicians.
5. **Technician mobile experience** — "my jobs today" list, job detail, check-in/out, log time/parts/photos, capture signature, complete job. Must work offline-friendly (PWA).
6. **Invoicing & payments** — generate invoice from job, send to customer, online pay (Stripe), record manual payments, A/R aging.
7. **Estimates/quotes** — build quote, customer approval link, convert approved quote → job.
8. **Inventory** — stock levels, consume parts on jobs, low-stock alerts, purchase orders.
9. **Recurring contracts / maintenance plans** — RRULE-based auto-generation of jobs, billing schedules.
10. **Customer portal** — customers view jobs, approve quotes, pay invoices, request service.
11. **Reporting & dashboards** — revenue, tech utilization, first-time fix rate, job profitability, A/R.
12. **Notifications** — email/SMS for appointment reminders, "tech en route", invoice sent.
13. **Settings & admin** — price book, tax rates, business hours, templates, team management, integrations.

---

## 4. Recommended Tech Stack

Pick one row per layer. Defaults chosen for speed + a single TypeScript codebase.

| Layer | Default choice | Alternatives |
|---|---|---|
| **Framework** | Next.js (App Router) full-stack | Remix; or React SPA + separate API |
| **Language** | TypeScript end-to-end | — |
| **DB** | PostgreSQL | — (need relational + jsonb + PostGIS) |
| **ORM** | Prisma | Drizzle (lighter, SQL-first) |
| **Auth** | Auth.js (NextAuth) or Clerk | Lucia; custom JWT |
| **API style** | tRPC (type-safe) or REST route handlers | GraphQL |
| **UI** | React + Tailwind + shadcn/ui | MUI; Chakra |
| **State/data** | TanStack Query | RTK Query; SWR |
| **Calendar** | FullCalendar or react-big-calendar | custom grid |
| **Maps** | Mapbox GL or Google Maps | Leaflet + OSM |
| **Payments** | Stripe (Checkout + Connect for payouts) | — |
| **Email/SMS** | Resend / Postmark + Twilio | SendGrid |
| **File storage** | S3 / Cloudflare R2 (presigned uploads) | Supabase Storage |
| **Background jobs** | BullMQ + Redis, or Inngest | cron + queue table |
| **Realtime** | Pusher / Ably / Supabase Realtime | WebSocket server |
| **Mobile** | PWA first; React Native later | Expo |
| **Hosting** | Vercel + Neon/Supabase Postgres | Fly.io; Railway; AWS |
| **Testing** | Vitest + Playwright | Jest + Cypress |

**Why these choices:** a single TS monorepo with Next.js lets the dispatch board, customer portal, and mobile PWA share types and components. Postgres covers relational integrity, JSON flexibility, and geo (PostGIS) for the map/route features. Stripe handles both customer payments and technician/contractor payouts.

---

## 5. Architecture Notes

- **Multi-tenancy:** start with a single DB + `tenant_id` row-level scoping. Enforce it in a middleware/repository layer (never trust the client). Add Postgres Row-Level Security (RLS) for defense in depth. Move to schema-per-tenant only if a customer demands isolation.
- **Authorization:** RBAC with a permission matrix (role × resource × action). Technicians see only their assigned jobs; dispatchers see all; accountants see billing only.
- **State machine:** model job/invoice/estimate status transitions explicitly (e.g., XState or a hand-rolled transition map). Reject illegal transitions at the service layer.
- **Offline-first mobile:** PWA with a service worker; queue mutations (check-in, photo, time entry) locally and sync when back online. Use optimistic UI. Assign client-generated UUIDs so offline-created records merge cleanly.
- **Realtime dispatch:** when a dispatcher moves a job, push the update to the assigned tech and the board via websockets/SSE.
- **Money:** store amounts as integer cents (never floats). Centralize tax + total calculation in one pure function used by estimates, jobs, and invoices.
- **Time zones:** store UTC; render in the tenant's (and site's) local zone. Scheduling windows are the #1 source of TZ bugs.
- **Audit log:** append-only activity table for every status change, assignment, and money event.
- **File uploads:** presigned direct-to-S3; store only metadata in DB; generate thumbnails async.
- **Idempotency:** idempotency keys on payment + invoice-creation endpoints.

---

## 6. Suggested Project Structure (Next.js + Prisma)

```
/prisma
  schema.prisma            # all models from §2
/src
  /app
    /(marketing)           # public site
    /(auth)                # login, signup, reset
    /(app)                 # authed shell
      /dashboard
      /customers
      /jobs
      /schedule            # dispatch board
      /invoices
      /estimates
      /inventory
      /settings
    /(portal)              # customer-facing portal
    /(mobile)              # technician PWA routes
    /api                   # route handlers / webhooks (stripe, twilio)
  /server
    /modules               # one folder per domain module (job, invoice…)
      /job
        job.service.ts     # business logic + state machine
        job.repo.ts        # tenant-scoped data access
        job.router.ts      # tRPC/REST
        job.schema.ts      # zod validation
    /lib                   # auth, db, money, rbac, mailer, storage
  /components              # shared UI (shadcn)
  /features               # feature-level UI (DispatchBoard, JobCard…)
  /hooks
/tests
```

---

## 7. Phased Build Plan

Each phase ends with something demoable. Don't start a phase before the prior one works end-to-end.

- **Phase 0 — Foundation:** repo, Next.js + TS + Tailwind + Prisma + Postgres, CI, lint/format, seed script, base layout, env config.
- **Phase 1 — Auth & tenancy:** signup creates a tenant + owner, login, RBAC guard, tenant-scoped queries, settings shell.
- **Phase 2 — Customers/sites/assets:** full CRUD + search + history timeline.
- **Phase 3 — Work orders:** create job, line items, status workflow, assign tech, notes/attachments.
- **Phase 4 — Scheduling/dispatch:** calendar board, drag-drop assign, conflict detection, map view.
- **Phase 5 — Technician PWA:** my-day list, job detail, check-in/out, time/parts/photos/signature, complete.
- **Phase 6 — Invoicing & payments:** job→invoice, Stripe pay link, record payments, A/R aging. **← shippable MVP**
- **Phase 7 — Estimates + customer portal:** quote builder, approval link, portal (view/approve/pay).
- **Phase 8 — Inventory + recurring contracts:** stock tracking, part consumption, RRULE job generation.
- **Phase 9 — Reporting & notifications:** dashboards, KPIs, email/SMS reminders, "en route" texts.
- **Phase 10 — Polish & scale:** background jobs, realtime, perf, audit log, RLS, accessibility, mobile app (RN).

---

## 8. Key Workflows to Get Right

1. **Schedule → Dispatch → Execute:** dispatcher drags job to tech/time → tech notified → en route (GPS) → on-site check-in → work logged → complete → office sees it instantly.
2. **Job → Invoice → Paid:** completed job auto-drafts an invoice from its line items/time/parts → sent → customer pays online → A/R updates.
3. **Recurring maintenance:** contract with RRULE → nightly job generates upcoming visits → auto-assign or queue for dispatch.
4. **Estimate → Approval → Job:** build quote → customer approves via link → one click converts to scheduled job.

---

## 9. KPIs the Reporting Module Must Surface

Revenue (by period/tech/service), jobs completed, **first-time fix rate**, **technician utilization %**, average response/resolution time, job profitability (revenue − labor cost − parts), A/R aging buckets, recurring vs. one-off revenue, conversion rate (estimate→job).

---

## 10. Cross-Cutting Concerns / Definition of Done

- [ ] Multi-tenant isolation enforced server-side (+ RLS) and tested
- [ ] RBAC permission matrix enforced on every endpoint
- [ ] All input validated with zod; all money in integer cents
- [ ] Status transitions guarded by state machines
- [ ] Soft deletes + append-only audit log
- [ ] Time stored UTC, rendered in local zone
- [ ] Stripe + Twilio webhooks verified & idempotent
- [ ] PWA works offline for the tech's core loop
- [ ] Unit tests on services (money, tax, scheduling, state machine); e2e on the 4 key workflows
- [ ] Seed/demo data for every module
- [ ] Accessible (keyboard, ARIA) and responsive

---

## 11. Common Pitfalls

- Floats for money → use cents.
- Time-zone-naive scheduling → store UTC, be explicit about site vs. user zone.
- Trusting `tenant_id` from the client → always derive from the session.
- Overlapping appointments / double-booking a tech → enforce at write time.
- Building horizontal layers (all models, then all APIs, then all UI) → build vertical slices instead.
- Skipping the state machine → leads to invoices on cancelled jobs and similar corruption.
- No idempotency on payments → duplicate charges on retry.

---

### How to use this skill

When asked to build the FSM app (or any part), (1) confirm the schema from §2 exists, (2) pick the current phase from §7, (3) build that module as a vertical slice (schema → service+RBAC → API+validation → UI), (4) check it against the §10 Definition of Done, then move to the next phase. Default the stack to §4 unless the user specifies otherwise.
