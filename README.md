# GlobeTrotter

Personalized multi-city travel planner — Odoo x LDCE 2026 hackathon.

Plan a trip across several cities, assign real activities to real days, watch a server-computed budget
with over-budget alerts, then share the itinerary on a public link anyone can view and any logged-in
user can copy into their own account.

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 6 · Neon Postgres · Auth.js v5 (credentials + bcrypt) · zod

## Run it

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL and AUTH_SECRET
npm run db:push               # sync the schema to Postgres
npm run db:seed               # 31 cities, 310 activities, demo accounts
npm run dev
```

`AUTH_SECRET` comes from `npx auth secret`. `DATABASE_URL` must be Neon's **pooled** connection string.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run check` | Budget and date-math self-check (no database needed) |
| `npm run db:push` / `db:seed` / `db:reset` | Schema sync · seed · wipe and re-seed |

## Demo accounts — password `Demo@123`

| Email | Role | |
|---|---|---|
| `user@demo.com` | USER | The demo path — 3 trips: upcoming, ongoing, past |
| `friend@demo.com` | USER | Owns a public trip, for the Copy Trip flow |
| `admin@demo.com` | ADMIN | Analytics dashboard and user management |

Public itineraries, viewable logged out: `/p/iceland-ring-road-demo` · `/p/sea-shoestring-demo`

## How it works

- **No external travel APIs.** A seeded catalog of 31 cities across 7 regions with 10 activities each
  (`prisma/catalog.ts`) is the data source behind search, recommendations and every cost estimate.
- **Trip status is derived, never stored.** upcoming / ongoing / past come from the dates
  (`src/lib/trip-status.ts`), so a trip can never be stale relative to the calendar.
- **All money math is server-side.** `src/lib/budget.ts` is the single source of truth for totals,
  per-day series, daily budgets and over-budget flags. The frontend displays numbers; it never computes them.
- **One itinerary payload, three surfaces.** `src/lib/itinerary.ts` produces the shape that the timeline
  view, the calendar view and the public page all render, so they cannot drift apart.
- **Calendar dates are UTC-pinned.** Trip, stop and item dates are days, not instants — stored at UTC
  midnight and compared date-only so nothing shifts by timezone.

## Layout

```
prisma/         schema.prisma · catalog.ts (the 31-city catalog) · seed.ts
src/lib/        budget · itinerary · dates · trip-status · access · validators · api-helpers
src/app/api/    29 route handlers — trips, stops, items, expenses, catalog, sharing, admin
src/middleware  session gate + role-gated routes + the public /p/ whitelist
scripts/        check-budget.ts — the runnable check behind the money logic
docs/           SPEC · API_CONTRACT · DATABASE · DECISIONS · DEMO_SCRIPT
```

## Documentation

| File | |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | All 13 screens, the data model, the budget rules |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Every endpoint: method, roles, body, response |
| [`docs/DATABASE.md`](docs/DATABASE.md) | ER diagram, cascade behaviour, seed contents |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Judgment calls, and the gaps found and fixed |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | The walkthrough, step by step |
