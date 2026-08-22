# DEV A — Backend Prompt: GlobeTrotter Travel Planner (Claude Code)

> Inputs: this file + `GlobeTrotter.pdf` + `starter-files/` folder. NO pre-built app — you scaffold in W0. No wireframes; SPEC screen blueprints are derived from the PDF. You own: `prisma/`, `src/app/api/`, `src/lib/`, `src/auth*.ts`. Never edit `src/components/` or page routes (Dev B's).
>
> **Push to GitHub in waves (W0+W1 → W2 → W3 → W4), announcing each.** This problem is backend-LIGHT and frontend-heavy — your job is to finish lean and correct by ~H4:00, then support Dev B. Verify current library APIs (Auth.js v5, Prisma+Neon) via quick web search before non-trivial use.

## PHASE 0 — Verify spec + freeze contract (0:00–0:20) — MANDATORY STOP AT END

The spec is pre-baked below. Read the PDF fully, VERIFY against it, fill gaps, then write `docs/SPEC.md` (with a per-screen blueprint for all 13 screens — fields, columns, actions — reasoned like a product designer) and `docs/API_CONTRACT.md` (every endpoint: method, path, roles, zod body, response, wave; + nav table). Cross-check: every displayed field must be captured somewhere upstream. Judgment calls → `docs/DECISIONS.md`. **STOP for human approval.**

### Pre-baked spec (verify, don't re-derive)

**Roles:** `USER` (everything traveler-facing) · `ADMIN` (all of USER + analytics dashboard + user management). Signup creates USER only; one ADMIN seeded. Simple — don't invent more roles.

**Entities:**
- `User` (starter, + `photoUrl?`, `languagePref?`) · starter `ActivityLog`/`Notification` kept but used lightly (trip shared, trip copied) · `DocumentSequence` unused — remove or ignore.
- `City` (master catalog): name, country, region, costIndex Int (1–100), popularity Int, description?, imageUrl? — **no external travel APIs; the seeded catalog IS the data source** (~30 cities worldwide).
- `Activity` (master catalog): cityId, name, category `SIGHTSEEING|FOOD|ADVENTURE|CULTURE|NIGHTLIFE|SHOPPING|NATURE|OTHER`, cost Decimal, durationHours Decimal, description?, imageUrl? — 8–12 per city.
- `Trip`: userId, name, description?, startDate, endDate, coverPhotoUrl? (base64 ≤2 MB like before), budgetTotal Decimal? (enables over-budget alerts), isPublic Bool default false, publicSlug String? @unique (generated on first share). **No status enum — upcoming/ongoing/past is DERIVED from dates.**
- `Stop`: tripId, cityId, startDate, endDate, `order` Int (reorder = swap order values), notes?.
- `ItineraryItem` (activity assigned to a stop): stopId, activityId, date, startTime?, costOverride Decimal? (effective cost = override ?? activity.cost), notes?, `order` Int within the day (drag-to-reorder).
- `Expense` (non-activity costs per stop): stopId, category `TRANSPORT|STAY|MEALS|OTHER`, description, amount, date?.
- `SavedDestination`: userId, cityId (unique pair) — profile's saved list + "Add to saved" from city search.

**Budget math (server-side, one service `src/lib/budget.ts`):** activities total = Σ effective ItineraryItem costs; transport/stay/meals = Σ Expenses by category; trip total = all of it; avg/day = total / trip nights; per-day series = costs bucketed by date; over-budget day flags when `budgetTotal` set: dailyBudget = budgetTotal / nights, flag days above it; overall over-budget flag when total > budgetTotal.

**Sharing:** `POST share` sets isPublic + generates unique slug (nanoid-style via cuid slice); public endpoints require NO session; **middleware must whitelist `/p/*` and its API** — this is a demo-critical detail, test logged-out. Copy Trip = deep clone (trip→stops→items→expenses) into the caller's account with "(Copy)" suffix, works from a public trip too (auth required to copy).

**Recovery paths:** delete trip → cascade stops/items/expenses (confirm dialog is Dev B's); un-share → isPublic=false, slug retained (re-share reuses it — copied links just 404 gracefully while private).

## W0+W1 — Scaffold + schema + seed + auth (0:20–1:15) — PUSH

1. `create-next-app` (TS, Tailwind, ESLint, `src/`, App Router); shadcn init + add: button, input, label, card, table, dialog, dropdown-menu, select, badge, tabs, sonner, form, textarea, skeleton, avatar, separator, sheet, calendar, popover, progress. Install: `next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers recharts framer-motion @dnd-kit/core @dnd-kit/sortable prisma @prisma/client tsx date-fns` (+`@types/bcryptjs`).
2. Integrate `starter-files/` (read its README; fix version drift). Set `SIGNUP_ROLES = ["USER"]`; middleware `ROLE_ROUTES = { "/admin": ["ADMIN"] }` and PUBLIC_PATHS += `/p` (public itineraries) — plus landing `/`, auth pages.
3. Full GlobeTrotter `schema.prisma` per spec; `prisma db push`.
4. **Seed is the star of this wave** — the catalog is your data source: ~30 real cities across regions with sensible costIndex/popularity, 8–12 realistic activities each with plausible costs/durations/categories (generate thoughtfully — judges will search these). Demo users: `admin@demo.com`, `user@demo.com`, `friend@demo.com` (`Demo@123`). For user@demo: 3 trips — one upcoming multi-city (3 stops, full itinerary items + expenses, budgetTotal set with one over-budget day), one ongoing, one past; one trip already public with slug. friend@demo: 1 public trip (for copy-trip demo).
5. Verify logins; `docs/DATABASE.md` (Mermaid ER + credentials). **Push W0+W1, announce.** README skeleton now.

## W2 — Trips, stops, catalog search, profile (1:15–2:30) — PUSH

- Trips: `GET /api/trips` (own; `?filter=upcoming|ongoing|past|all` derived by dates; includes stop count, first city image, computed total cost), `POST`, `GET/PATCH/DELETE /api/trips/[id]` (owner-or-ADMIN guard; GET includes stops→city + counts).
- Stops: `POST /api/trips/[id]/stops`, `PATCH/DELETE /api/stops/[id]`, `POST /api/trips/[id]/stops/reorder` body `{ orderedStopIds: string[] }` (validate set equality, renumber in a transaction). Guard: stop dates within trip dates.
- Catalog: `GET /api/cities` (`?q=&country=&region=&sort=popularity|costIndex&page=`), `GET /api/cities/[id]` (+ its activities), `GET /api/activities` (`?cityId=&q=&category=&maxCost=&maxDuration=&sort=`). Read-only for USER; ADMIN gets full CRUD on both (simple factory like before — feeds admin + lets them fix catalog live).
- Saved destinations: `GET/POST /api/saved-destinations`, `DELETE .../[cityId]`.
- Profile: `GET/PATCH /api/profile` (name, photoUrl, languagePref, email), `DELETE /api/profile` (delete account: cascade own trips; sign-out handled client-side).
**Push, announce.**

## W3 — Itinerary items, expenses, budget, sharing (2:30–4:00) — the demo's heart — PUSH

- Itinerary items: `POST /api/stops/[id]/items` (guard: activity belongs to stop's city; date within stop range), `PATCH/DELETE /api/items/[id]`, `POST /api/stops/[id]/items/reorder` (per-day `{ date, orderedItemIds }`).
- Expenses: CRUD under `/api/stops/[id]/expenses` + `/api/expenses/[id]`.
- Budget: `GET /api/trips/[id]/budget` → `{ totals: { transport, stay, activities, meals, other, grand }, avgPerDay, perDay: [{ date, amount, overBudget }], budgetTotal, overBudget, nights }` — all math server-side in `budget.ts`.
- Itinerary view data: `GET /api/trips/[id]/itinerary` → day-buckets `[{ date, stop: {city}, items: [...ordered, effectiveCost], dayTotal }]` — one endpoint powers list, calendar, and public views identically.
- Sharing: `POST /api/trips/[id]/share` → `{ publicSlug, url }`; `POST /api/trips/[id]/unshare`; **public, session-free** `GET /api/public/trips/[slug]` (404 if private) returning the same itinerary+budget-summary shape; `POST /api/public/trips/[slug]/copy` (auth required) → deep clone, returns new trip id.
**Push, announce.**

## W4 — Dashboard, admin analytics (4:00–5:00) — PUSH + DEPLOY

- `GET /api/dashboard`: welcome payload — upcoming trips (next 3 with countdown days), recommended cities (top popularity not already in user's trips), budget highlights (active trip totals + over-budget flags), recent trips.
- Admin: `GET /api/admin/analytics` → trips created over time (6 mo), top cities (by stop count), top activities (by item count), user stats (total, new this month, trips per user avg); `GET /api/admin/users` + `PATCH /api/admin/users/[id]` (isActive, role) — reuse users pattern.
- CSV export of admin tables (`?format=csv`) — cheap, impressive.
**Push, announce, deploy to Vercel** (env vars set; verify `/p/[slug]` works logged-out on the deployment).

## After W4 (5:00–8:00)

Smoke-test as USER/ADMIN + logged-out public route; verify copy-trip clones deeply; enrich seed if lists look thin; then **Dev B support is your only queue**. Final hour: seed reset, README, `docs/DEMO_SCRIPT.md` (the demo path from `1_TEAM_PLAN.md` step-by-step with accounts), final deploy.

## Rules

Schema/workflow ambiguity → ask humans with recommended default; cosmetic → decide + log in DECISIONS.md. Never change API_CONTRACT.md silently. Commit small, `git pull --rebase` before push. Behind at a wave boundary → cut per scope tiers in `1_TEAM_PLAN.md`, never the demo path.
