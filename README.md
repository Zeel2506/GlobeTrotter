<div align="center">

<img src="public/logo.png" alt="GlobeTrotter" width="180" />

# GlobeTrotter

**From a blank page to a day-by-day multi-city itinerary — costed, visualised, and shareable with one link.**

Built for the **Odoo x LDCE Hackathon 2026**

![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_Postgres-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [What GlobeTrotter Does](#-what-globetrotter-does)
3. [Architecture](#-architecture)
4. [Libraries & Tech Stack](#-libraries--tech-stack)
5. [Data Model](#-data-model)
6. [User Roles & Permissions](#-user-roles--permissions)
7. [Complete User Workflow](#-complete-user-workflow)
8. [Screens & Routes](#-screens--routes)
9. [Project Structure](#-project-structure)
10. [Quick Start](#-quick-start)
11. [Environment Variables](#-environment-variables)
12. [Database Seeding](#-database-seeding)
13. [Demo Script](#-demo-script)
14. [Cross-Cutting Design Decisions](#-cross-cutting-design-decisions)
15. [API Guide](#-api-guide)
16. [Testing](#-testing)
17. [License](#-license)

---

## 🎯 Problem Statement

Planning a trip through **one** city is a solved problem. Planning a trip through **five** is not.

The moment a journey has more than a single stop, travellers fall back on a spreadsheet, a group chat and a dozen browser tabs:

- **No single source of truth.** Dates live in one place, bookings in another, the budget in a third — and they drift apart.
- **Cost is invisible until it is too late.** You discover the trip is over budget after booking, not while planning.
- **Ordering is manual.** Reordering cities means rewriting every date by hand.
- **Sharing is lossy.** "Here's my plan" becomes a screenshot, a PDF, or a wall of text.

GlobeTrotter turns the whole thing into one structured, costed, shareable artefact.

---

## ✨ What GlobeTrotter Does

| | Module | What it does |
|---|---|---|
| 🗺️ | **Trip Planner** | Create a trip with dates, cover photo and an optional total budget |
| 📍 | **Multi-City Stops** | Add ordered city stops with date ranges; drag or arrow-reorder them |
| 🎟️ | **Activity Assignment** | Drop catalog activities onto specific days and times within a stop |
| 💰 | **Budget Engine** | Server-computed totals by category, per-day series, over-budget day alerts |
| 📅 | **Timeline & Calendar** | The same itinerary as a day-by-day timeline or a month calendar |
| 🔍 | **Discovery** | Search 31 cities and 310 activities by cost, popularity, category, duration |
| 🔗 | **Public Sharing** | Publish to an unguessable link anyone can open without an account |
| 📑 | **Copy Trip** | Any signed-in visitor can deep-clone a shared trip into their own account |
| ❤️ | **Saved Destinations** | Heart cities while browsing and revisit them from the profile |
| 📊 | **Admin Analytics** | Adoption over time, top destinations, top activities, user management, CSV export |

---

## 🏗️ Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│   React 19 Client Components · framer-motion · Recharts      │
│   @dnd-kit reordering · react-day-picker calendars           │
└───────────────┬──────────────────────────────────────────────┘
                │  fetch()  →  { data } | { error }
┌───────────────▼──────────────────────────────────────────────┐
│                   NEXT.JS 16 (App Router)                    │
│                                                              │
│  Server Components ──── read Prisma directly (no round trip) │
│  Route Handlers    ──── /api/* · zod validated · role gated  │
│  Edge Middleware   ──── session gate + /p/ public whitelist  │
│                                                              │
│  src/lib/budget.ts     ← the ONLY place money is computed    │
│  src/lib/itinerary.ts  ← one payload, three surfaces         │
│  src/lib/access.ts     ← owner-or-admin guard, one helper    │
└───────────────┬──────────────────────────────────────────────┘
                │  Prisma 6
┌───────────────▼──────────────────────────────────────────────┐
│              NEON POSTGRES (pooled connection)               │
│   Users · Cities · Activities · Trips · Stops · Items        │
│   Expenses · SavedDestinations · ActivityLog · Notification  │
└──────────────────────────────────────────────────────────────┘
```

### End-to-End Planning Flow

```text
  SIGN UP ──▶ DASHBOARD ──▶ CREATE TRIP ──▶ ITINERARY BUILDER
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          ▼                        ▼                        ▼
                    ADD CITY STOPS          ASSIGN ACTIVITIES          ADD EXPENSES
                    (ordered, dated)        (per day + time)      (transport/stay/meals)
                          └────────────────────────┼────────────────────────┘
                                                   ▼
                                          BUDGET RECALCULATED
                                       (server-side, every read)
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        ▼                          ▼                          ▼
                 TIMELINE VIEW              CALENDAR VIEW              BUDGET SCREEN
                        └──────────────────────────┼──────────────────────────┘
                                                   ▼
                                          SHARE  →  /p/[slug]
                                                   │
                                        (no account needed to view)
                                                   ▼
                                    ANOTHER USER  →  COPY TRIP  →  deep clone
```

### Derived, Never Stored

Two things are deliberately **not** columns in the database:

| Concept | Why it is derived | Where |
|---|---|---|
| **Trip status** (upcoming / ongoing / past) | A stored enum goes stale the moment the calendar moves past it | `src/lib/trip-status.ts` |
| **All money totals** | One source of truth means the timeline, budget screen and public page can never disagree | `src/lib/budget.ts` |

---

## 🛠️ Libraries & Tech Stack

### Frontend

| Package | Version | Why |
|---|---|---|
| `next` | 16.3.2 | App Router, Server Components, route handlers |
| `react` | 19.2.8 | UI |
| `typescript` | 5 | Types across API contract and client |
| `tailwindcss` | v4 | Token-driven styling, `@theme inline` |
| `framer-motion` | 13.1.1 | Hero card flip, page transitions, chart entrances |
| `recharts` | 3.10.1 | Budget donut, per-day bars, admin analytics |
| `@dnd-kit/core` + `sortable` | 6.3.1 | Stop and activity reordering |
| `react-day-picker` | 10.0.1 | Calendar behind every date field |
| `lucide-react` | 1.33.0 | Icon set |
| `sonner` | 2.0.8 | Toasts |
| `date-fns` | 4.4.0 | Date helpers |

### Backend & Data

| Package | Version | Why |
|---|---|---|
| `prisma` / `@prisma/client` | 6.19.3 | Schema, migrations, typed queries |
| `next-auth` | 5.0.0-beta.32 | Credentials auth, JWT sessions with role claim |
| `bcryptjs` | 3.0.3 | Password hashing |
| `zod` | 4.4.3 | Every request body and query validated |

### Design System

Self-hosted **ABC Diatype** (5 weights, `next/font/local`). MakeMyTrip-derived palette: brand red `#EB2226`, light-grey canvas `#F2F2F2`, white panels, saffron accent `#F58220`. Component sources adapted from **21st.dev** and **React Bits** — each vendored file names its origin and every change made to it.

---

## 🗄️ Data Model

```text
   User ─┬──< Trip ──< Stop ─┬──< ItineraryItem >── Activity >── City
         │                   │                                    │
         │                   └──< Expense                          │
         │                                                         │
         └──< SavedDestination >───────────────────────────────────┘
         │
         ├──< ActivityLog
         └──< Notification
```

| Model | Purpose | Notable fields |
|---|---|---|
| `User` | Account + role | `role` (USER/ADMIN), `photoUrl` (base64 ≤2 MB), `languagePref`, `isActive` |
| `City` | Master catalog | `costIndex` 1-100, `popularity` 0-100, `@@unique([name, country])` |
| `Activity` | Master catalog | `category` (8 values), `cost`, `durationHours` |
| `Trip` | The plan | `budgetTotal?` enables alerts, `isPublic`, `publicSlug?` (unique) |
| `Stop` | A city visit | `order` renumbered transactionally on reorder |
| `ItineraryItem` | Activity on a day | `costOverride?` — per-trip price, never mutates the catalog |
| `Expense` | Non-activity cost | `TRANSPORT / STAY / MEALS / OTHER`, `date?` optional |
| `SavedDestination` | Heart list | `@@unique([userId, cityId])` |
| `ActivityLog` | Audit trail | `TRIP_CREATED`, `TRIP_SHARED`, `TRIP_COPIED` |
| `Notification` | In-app alerts | Fired when someone copies your trip |

> **Dates are calendar days, not instants.** Every trip/stop/item date is pinned to UTC midnight and compared date-only (`src/lib/dates.ts`). Without this, a user in IST creating a trip on "1 Sep" stores 31 Aug 18:30Z and the derived status filter drifts by a day.

---

## 🔐 User Roles & Permissions

| Capability | Guest | USER | ADMIN |
|---|:---:|:---:|:---:|
| View landing page | ✅ | ✅ | ✅ |
| View a shared trip at `/p/[slug]` | ✅ | ✅ | ✅ |
| Sign up / log in | ✅ | — | — |
| Create, edit, delete own trips | ❌ | ✅ | ✅ |
| Add stops, activities, expenses | ❌ | ✅ | ✅ |
| Reorder stops and activities | ❌ | ✅ | ✅ |
| View budget breakdown | ❌ | ✅ | ✅ |
| Share / un-share own trip | ❌ | ✅ | ✅ |
| Copy a public trip | ❌ | ✅ | ✅ |
| Save destinations | ❌ | ✅ | ✅ |
| Edit own profile / delete account | ❌ | ✅ | ✅ |
| View **any** user's trip | ❌ | ❌ | ✅ |
| Analytics dashboard | ❌ | ❌ | ✅ |
| Activate / suspend users, change roles | ❌ | ❌ | ✅ |
| Create / edit / delete catalog rows | ❌ | ❌ | ✅ |
| CSV export | ❌ | ❌ | ✅ |

**Enforced in two layers:** `src/middleware.ts` gates page routes by prefix; every `/api/*` handler independently calls `requireRole()`. A hand-crafted request cannot bypass the UI.

> Other users' trips return **404, not 403** — so trip IDs are not enumerable.

---

## 🔄 Complete User Workflow

### 1. Traveller (USER)

1. **Sign up** → account created with `USER` role (ADMIN is never self-assignable)
2. **Dashboard** → upcoming trips with countdown, recommended cities, budget highlights
3. **Plan New Trip** → name, date range, optional description / cover / total budget
4. **Itinerary Builder** → add city stops with date ranges inside the trip window
5. **Reorder stops** → drag, or use the arrow buttons (which work without a pointer)
6. **Assign activities** → pick from the stop's city, set a day and start time
7. **Add expenses** → transport, stay, meals, other — per stop
8. **Review** → timeline or calendar; day totals and running trip total
9. **Budget screen** → category donut, per-day bars, over-budget days flagged
10. **Share** → generates `/p/[slug]`; open it logged out to confirm
11. **Profile** → photo, language, saved destinations, delete account

### 2. Recipient of a shared link (Guest → USER)

1. Opens `/p/[slug]` with **no account** — full itinerary and cost summary
2. Clicks **Copy Trip** → prompted to sign in
3. Trip is deep-cloned (stops → items → expenses) into their account as "… (Copy)"
4. The clone is **private** with no slug — copying does not republish

### 3. Administrator (ADMIN)

1. Signs in and reaches `/admin` (a `USER` hitting this URL is redirected)
2. **Analytics** → users, new signups, trips created over 6 months, top cities/activities
3. **CSV export** on every table
4. **User management** → search, filter, change role, suspend/activate
5. Guard rails: an admin cannot change their **own** role or suspend themselves, and the **last active admin** cannot be demoted

---

## 📱 Screens & Routes

### Pages

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing — hero arc, planner widget, destination rails |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/p/[slug]` | **Public** | Shared read-only itinerary + Copy Trip |
| `/dashboard` | USER, ADMIN | Upcoming trips, recommendations, budget highlights |
| `/trips` | USER, ADMIN | My Trips with Upcoming/Ongoing/Past filters |
| `/trips/new` | USER, ADMIN | Create trip (accepts `?name=&start=&end=` prefill) |
| `/trips/[id]` | Owner or ADMIN | Itinerary — timeline ⇄ calendar toggle |
| `/trips/[id]/build` | Owner or ADMIN | Itinerary builder — stops, activities, reorder |
| `/trips/[id]/budget` | Owner or ADMIN | Cost breakdown, charts, expense management |
| `/cities` | USER, ADMIN | City search — filters, sort, add to trip, save |
| `/activities` | USER, ADMIN | Activity search — category, cost, duration filters |
| `/profile` | USER, ADMIN | Profile, language, saved destinations, delete account |
| `/admin` | **ADMIN** | Analytics dashboard |
| `/admin/users` | **ADMIN** | User management |

### API — 30 route handlers

Full contract in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). Summary:

| Group | Routes |
|---|---|
| Auth | `/api/auth/signup`, `/api/auth/[...nextauth]` |
| Trips | `/api/trips`, `/api/trips/[id]`, `/api/trips/[id]/{budget,itinerary,share,unshare}` |
| Stops | `/api/trips/[id]/stops`, `/api/trips/[id]/stops/reorder`, `/api/stops/[id]` |
| Items | `/api/stops/[id]/items`, `/api/stops/[id]/items/reorder`, `/api/items/[id]` |
| Expenses | `/api/stops/[id]/expenses`, `/api/expenses/[id]` |
| Catalog | `/api/cities`, `/api/cities/[id]`, `/api/cities/facets`, `/api/activities`, `/api/activities/[id]` |
| Profile | `/api/profile`, `/api/saved-destinations`, `/api/saved-destinations/[cityId]` |
| Public | `/api/public/trips/[slug]`, `/api/public/trips/[slug]/copy` |
| Dashboard | `/api/dashboard` |
| Admin | `/api/admin/analytics`, `/api/admin/users`, `/api/admin/users/[id]` |

---

## 📁 Project Structure

```text
globetrotter/
├── fonts/                          ABC Diatype (5 weights, self-hosted)
├── public/
│   └── logo.png                    Brand mark
├── prisma/
│   ├── schema.prisma               10 models, 3 enums
│   ├── catalog.ts                  31 cities × 10 activities + verified photo URLs
│   └── seed.ts                     Catalog + demo accounts + community data
├── scripts/
│   └── check-budget.ts             Runnable assertions over the money + date maths
├── docs/
│   ├── SPEC.md                     All 13 PDF screens, blueprint per screen
│   ├── API_CONTRACT.md             Frozen endpoint contract
│   ├── DATABASE.md                 ER diagram, cascades, seed contents
│   ├── DECISIONS.md                Judgment calls and the bugs they prevented
│   ├── DEMO_SCRIPT.md              Presenter walkthrough
│   └── TEST_CASES.md               Manual test suite (USER + ADMIN)
└── src/
    ├── middleware.ts               Session gate, role routes, /p/ whitelist
    ├── auth.ts / auth.config.ts    Auth.js v5, credentials + bcrypt
    ├── app/
    │   ├── layout.tsx              Fonts, MotionConfig, Toaster
    │   ├── icon.tsx                Square favicon composed at build time
    │   ├── page.tsx                Landing
    │   ├── (auth)/                 login · signup (split-screen shell)
    │   ├── (app)/                  dashboard · trips · cities · activities · profile
    │   ├── admin/                  analytics · users (Mode A console)
    │   ├── p/[slug]/               Public shared itinerary
    │   └── api/                    30 route handlers
    ├── components/
    │   ├── ui/                     input, select, calendar, date-field, dialog, …
    │   ├── motion/                 hover-card, blur-fade, page-transition, count-up
    │   ├── landing/                hero-arc, hero-search, destination-rail, sections
    │   ├── brand/logo.tsx          Single lockup used by every shell
    │   └── …                       trip-card, city-card, activity-card, …
    ├── lib/
    │   ├── budget.ts               Money — single source of truth
    │   ├── itinerary.ts            One payload → timeline, calendar, public page
    │   ├── access.ts               requireTrip / requireStop / requireItem
    │   ├── dates.ts                UTC calendar-day helpers
    │   ├── trip-status.ts          Derived status + matching SQL filter
    │   └── api-helpers.ts          handle / ok / requireRole / parseBody / csv
    └── config/                     nav, landing copy, category colours
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js ≥ 20**
- A **PostgreSQL** database (this project uses [Neon](https://neon.tech) — use the **pooled** connection string)

### 1. Clone and install

```bash
git clone https://github.com/Zeel2506/GlobeTrotter.git
cd GlobeTrotter
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="run: npx auth secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npm run db:push     # sync schema.prisma to Postgres
npm run db:seed     # 31 cities, 310 activities, demo accounts
```

### 4. Run

```bash
npm run dev         # http://localhost:3000
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run check` | Budget + date assertions (no database needed) |
| `npm run db:push` | Sync schema |
| `npm run db:seed` | Seed catalog and demo data |
| `npm run db:reset` | Wipe and re-seed — **run before demoing** |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Postgres connection string. Use Neon's **pooled** URL |
| `AUTH_SECRET` | ✅ | JWT signing secret — `npx auth secret` |
| `NEXT_PUBLIC_APP_URL` | ➖ | Absolute base for generated share links. Falls back to the request origin |

> On Vercel, set all three as project environment variables. Use a **fresh** `AUTH_SECRET` for production — never reuse the local one.

---

## 🌱 Database Seeding

`npm run db:seed` creates:

| Data | Count |
|---|---|
| Cities | 31 across 7 regions, each with a verified photo |
| Activities | 310 (10 per city) across 8 categories |
| Demo trips | 4 — upcoming, ongoing, past+public, and a friend's public trip |
| Community users | 12 with 22 trips, so admin analytics has a real curve |

### Demo Accounts — password `Demo@123`

| Email | Role | What it demonstrates |
|---|---|---|
| `user@demo.com` | USER | The main path — 3 trips (upcoming / ongoing / past), one fully built |
| `friend@demo.com` | USER | Owns a public trip, for the Copy Trip flow |
| `admin@demo.com` | ADMIN | Analytics dashboard and user management |

**Public links (no login required):** `/p/iceland-ring-road-demo` · `/p/sea-shoestring-demo`

---

## 🎭 Demo Script

Run `npm run db:reset` first. Full presenter version in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

1. **Landing** — hero arc of real catalog cities, planner widget
2. **Sign up** a fresh account → empty-state dashboard
3. Sign in as `user@demo.com` → populated dashboard, countdown, budget highlights
4. **Plan New Trip** → dates via the calendar → lands in the builder
5. **City Search** → filter by region/cost → add 2–3 stops
6. **Activity Search** → filter by category and cost → assign to days
7. Try adding a **Tokyo** activity to a **Paris** stop → rejected with a clear message
8. **Reorder** stops by drag, then by arrow buttons
9. **Itinerary** → timeline, then toggle to calendar
10. **Budget** → $3,303 of $4,400, avg $275.25/day, over-budget day flagged
11. **Share** → copy the link → open in a **private window** (still works)
12. **Un-share** → link 404s → **re-share** → same slug returns
13. Sign in as `friend@demo.com` → **Copy Trip** → identical totals, private clone
14. Sign in as `admin@demo.com` → analytics, top cities, CSV export
15. As `user@demo.com`, hit `/admin` → redirected

---

## ⚙️ Cross-Cutting Design Decisions

Full reasoning in [`docs/DECISIONS.md`](docs/DECISIONS.md). The ones that shaped the build:

### Money is computed in exactly one place

`src/lib/budget.ts` is the only module that adds anything up. The timeline, budget screen, trip cards, dashboard and public page all read from it. The client never does arithmetic on money — Prisma `Decimal` is converted to a plain number at the API boundary, so `sum(perDay) === totals.grand` always holds.

### Undated expenses spread across their stop

A "hotel, 4 nights" expense has no single date. Attributing it to day one produced a meaningless spike that was the *only* thing tripping the over-budget flag. It is now divided evenly across the stop's days — totals unchanged, the per-day chart becomes readable.

### Effective cost never mutates the catalog

`ItineraryItem.costOverride` holds a per-trip price. Effective cost is `costOverride ?? activity.cost`, resolved server-side, so editing what *you* paid never changes the catalog for anyone else.

### Un-sharing keeps the slug

`isPublic` flips to false; `publicSlug` is retained. Old links 404 while private and start working again on re-share, instead of dying permanently.

### Reordering validates set equality

`orderedStopIds` must be *exactly* the current ID set — no missing, extra or foreign IDs — then renumbers `0..n-1` in one transaction. A partial list would silently corrupt ordering.

### Images fail gracefully

Every image field is nullable, so a missing image is the **normal** case. `ImageFallback` renders a deterministic gradient derived from a hash of the name — the same city always gets the same gradient — and is also the `onError` target, so a dead URL degrades to the gradient rather than a broken-image icon.

### Motion is configured globally, never branched

`<MotionConfig reducedMotion="user">` wraps the app. Components do **not** branch on `useReducedMotion()` while rendering — that hook returns `null` on the server and a real value in the browser, which produces a hydration mismatch for exactly the users who asked for less motion.

---

## 📡 API Guide

### Conventions

Every response is `{ data }` or `{ error, issues? }`.

| Status | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Malformed JSON |
| 401 | Not authenticated |
| 403 | Authenticated, not permitted |
| 404 | Not found — **or** not visible to you |
| 409 | Conflict (duplicate email, city in use) |
| 422 | Validation failed; `issues` carries field errors |

List endpoints accept `?page=&pageSize=` and return `{ rows, total, page, pageSize }`.

### Guard pattern

```ts
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();          // 401 / 403
    const { id } = await params;
    await requireTrip(id, user);                   // 404 if not yours
    const body = await parseBody(req, schema);     // 422 on invalid
    // …
    return ok(row, 201);
  });
}
```

### The public endpoint

`GET /api/public/trips/[slug]` calls **no** auth guard at all — by design. It returns 404 for a private trip so an un-shared link reveals nothing. The owner's `budgetTotal` is stripped from the response: viewers see what a trip costs, not what its owner meant to spend.

---

## 🧪 Testing

### Automated

```bash
npm run check
```

Assertion suite over the two areas where a silent bug costs real money on screen: the budget engine and calendar-date handling. Covers effective-cost precedence, category totals, `sum(perDay) === grand`, daily-budget flags, same-day trips (no divide-by-zero), and timezone drift.

### Manual

[`docs/TEST_CASES.md`](docs/TEST_CASES.md) — 40 numbered cases across both roles, each with preconditions, steps and expected results, including the authorisation boundaries that matter (a `USER` reaching `/admin`, a hand-crafted request for someone else's trip, an un-shared public link).

---

## 📄 License

MIT © 2026 — built for the Odoo x LDCE Hackathon.

<div align="center">

**[Live Demo](#)** · **[API Contract](docs/API_CONTRACT.md)** · **[Decisions Log](docs/DECISIONS.md)** · **[Test Cases](docs/TEST_CASES.md)**

</div>
