# GlobeTrotter — SPEC

Verified against `GlobeTrotter.pdf` (Odoo x LDCE 2026). All 13 PDF screens are covered below.
Ground truth for WHAT each screen contains. Frontend decides HOW it looks.

## 1. Product summary

Personalized multi-city travel planner. A user creates a **Trip**, adds **Stops** (city + date range,
ordered), assigns **ItineraryItems** (catalog activities on a specific date/time) to each stop, records
non-activity **Expenses** per stop, watches a server-computed **budget** with over-budget day alerts,
and **shares** the trip on a public unguessable URL that anyone can view and any logged-in user can
**copy** into their own account.

No external travel APIs. A seeded catalog of ~30 cities x 8-12 activities IS the data source.

## 2. Roles

| Role | Gets |
|---|---|
| `USER` | Everything traveler-facing (screens 1-12) |
| `ADMIN` | All of USER + screen 13 (analytics + user management) + catalog CRUD |

Signup self-assigns `USER` only. One ADMIN is seeded. No other roles.

## 3. Data model

| Model | Fields | Notes |
|---|---|---|
| `User` | id, name, email @unique, passwordHash, role, isActive, photoUrl?, languagePref?, resetToken?, resetTokenExp?, timestamps | photoUrl = base64 data URL <= 2 MB |
| `City` | id, name, country, region, costIndex Int 1-100, popularity Int, description?, imageUrl? | master catalog, `@@unique([name, country])` |
| `Activity` | id, cityId, name, category, cost Decimal(10,2), durationHours Decimal(4,1), description?, imageUrl? | master catalog |
| `Trip` | id, userId, name, description?, startDate, endDate, coverPhotoUrl?, budgetTotal Decimal?, isPublic Bool=false, publicSlug String? @unique, timestamps | **no status enum** |
| `Stop` | id, tripId, cityId, startDate, endDate, order Int, notes? | order renumbered in a transaction on reorder |
| `ItineraryItem` | id, stopId, activityId, date, startTime?, costOverride Decimal?, notes?, order Int | effective cost = costOverride ?? activity.cost |
| `Expense` | id, stopId, category, description, amount Decimal, date? | non-activity costs |
| `SavedDestination` | id, userId, cityId, createdAt | `@@unique([userId, cityId])` |
| `ActivityLog` | starter, used lightly | TRIP_CREATED, TRIP_SHARED, TRIP_COPIED |
| `Notification` | starter, used lightly | on trip copied, notify the original owner |

Enums: `Role{USER,ADMIN}` · `ActivityCategory{SIGHTSEEING,FOOD,ADVENTURE,CULTURE,NIGHTLIFE,SHOPPING,NATURE,OTHER}` · `ExpenseCategory{TRANSPORT,STAY,MEALS,OTHER}`

`DocumentSequence` and the placeholder `Item` from the starter are removed — no human-readable document
numbers exist in this problem.

### Derived trip status

`upcoming` = startDate > today · `ongoing` = startDate <= today <= endDate · `past` = endDate < today.
Computed in `src/lib/trip-status.ts`, never stored.

## 4. Budget math (server-side only, `src/lib/budget.ts`)

```
nights          = max(1, differenceInDays(endDate, startDate))
activitiesTotal = sum(item.costOverride ?? item.activity.cost)
transport/stay/meals/other = sum(expense.amount) grouped by category
grand           = activitiesTotal + transport + stay + meals + other
avgPerDay       = grand / nights
perDay[]        = every date in [startDate, endDate]; amount = items on that date
                  + expenses with that date (undated expenses bucket to the trip start date)
dailyBudget     = budgetTotal / nights          (only when budgetTotal is set)
perDay[i].overBudget = budgetTotal set AND amount > dailyBudget
overBudget      = budgetTotal set AND grand > budgetTotal
```

Decimal handling: Prisma `Decimal` is converted with `Number()` at the API boundary; every response
sends plain JSON numbers so the frontend never does money math.

## 5. Screen blueprints

### S1 — Login / Signup

Fields: email, password (+ name on signup). Actions: Login, Signup link, Forgot Password (starter route
exists; low priority). Validation: zod, password min 6. On success redirect to `/dashboard`.
Data: `POST /api/auth/signup`, Auth.js credentials sign-in.

### S2 — Dashboard / Home

Welcome line with the user name. Sections: **Upcoming trips** (next 3, each with countdown days,
cover-or-fallback, stop count, total cost), **Recommended destinations** (top-popularity cities the user
has no stop in), **Budget highlights** (active or next trip: grand total, budgetTotal, overBudget flag),
**Recent trips** (last 5). Primary CTA "Plan New Trip". Data: `GET /api/dashboard`.

### S3 — Create Trip

Fields: name (required, 2-100), start date, end date (>= start), description?, cover photo upload?
(base64 <= 2 MB). Action: Save, then redirect to `/trips/[id]/build`. Data: `POST /api/trips`.

### S4 — My Trips

Filter tabs Upcoming | Ongoing | Past | All (derived). Card: cover-or-fallback, name, date range,
destination (stop) count, total cost chip, status badge. Actions: View, Edit, Delete (confirm).
Data: `GET /api/trips?filter=`, `DELETE /api/trips/[id]`.

### S5 — Itinerary Builder

Per trip: ordered stop list (city name + country, date range, notes, item count, stop subtotal).
Actions: Add Stop (city picker + dates), edit stop dates/notes, remove stop, **reorder stops**
(drag plus arrow fallback), per-stop day sections for assigning activities, per-day item reorder,
running trip total always visible. Item row: startTime, activity name, category chip, effective cost,
notes, remove. Data: `GET /api/trips/[id]`, stops CRUD + reorder, items CRUD + reorder,
`GET /api/trips/[id]/itinerary`, `GET /api/trips/[id]/budget`.

### S6 — Itinerary View

Read view of the same data: day-wise vertical timeline, city header per day, activity blocks (time + cost),
day totals, view toggle timeline <-> calendar. Data: `GET /api/trips/[id]/itinerary` — one endpoint powers
the list, the calendar and the public view identically.

### S7 — City Search

Search bar (name/country), filters country + region, sort popularity | costIndex, pagination.
Card: image-or-fallback, name, country, region, costIndex badge, popularity, activity count.
Actions: "Add to Trip" (dialog: which trip + date range, creates a Stop), save-destination heart.
Data: `GET /api/cities`, `POST /api/trips/[id]/stops`, `POST /api/saved-destinations`.

### S8 — Activity Search

Scope: global or `?cityId=`. Filters category, maxCost, maxDuration, q; sort cost | duration | name.
Card: image-or-fallback, name, city, category chip, cost, durationHours; quick-view dialog with the
description. Actions: add to a stop (pick stop + date), remove.
Data: `GET /api/activities`, `POST /api/stops/[id]/items`, `DELETE /api/items/[id]`.

### S9 — Trip Budget & Cost Breakdown

Totals by Transport / Stay / Activities / Meals / Other (donut + bars), grand total, average cost per day,
per-day bar chart with over-budget days flagged, budget-vs-actual progress when budgetTotal is set.
Inline expense add/edit/delete per stop. Data: `GET /api/trips/[id]/budget`, expenses CRUD,
`PATCH /api/trips/[id]` for budgetTotal.

### S10 — Trip Calendar / Timeline

Same payload as S6 in calendar mode: month grid, expandable day popovers, drag-to-reorder activities
within a day, quick edit links. Data: `GET /api/trips/[id]/itinerary`, items reorder.

### S11 — Shared / Public Itinerary

Public URL `/p/[slug]`, **no session required**. Trip hero (name, dates, cover, owner name), day timeline,
budget summary (totals only, no expense editing), "Copy Trip" (auth required), social share / copy URL,
read-only. The owner additionally sees an un-share control.
Data: `GET /api/public/trips/[slug]` (404 when private), `POST /api/public/trips/[slug]/copy`.

### S12 — User Profile / Settings

Editable: name, email, photo (base64 <= 2 MB), language preference. Saved destinations grid with remove.
Delete account (double confirm, cascades own trips).
Data: `GET/PATCH/DELETE /api/profile`, `GET/POST/DELETE /api/saved-destinations`.

### S13 — Admin / Analytics (marked Optional in the PDF)

Mode A, dense. Cards: total users, new users this month, total trips, average trips per user.
Charts and tables: trips created over the last 6 months, top cities by stop count, top activities by item
count. User management table: name, email, role, isActive, trip count; actions activate/deactivate and
change role. CSV export on the tables via `?format=csv`.
Data: `GET /api/admin/analytics`, `GET /api/admin/users`, `PATCH /api/admin/users/[id]`.

## 6. Upstream capture check

Every displayed field has a source: countdown and status from `Trip.startDate/endDate`; stop count from
`Stop`; total cost from items + expenses; cost index and popularity from the seed; category chip from
`Activity.category`; effective cost from `costOverride ?? activity.cost`; day totals from the itinerary
payload; owner name from `Trip.user.name`; saved list from `SavedDestination`; admin counts from
aggregate queries. No display field lacks an upstream source.

## 7. Recovery paths

- Delete trip cascades stops, which cascade items and expenses. Delete stop cascades its items and expenses.
- Un-share sets `isPublic=false` and **retains** the slug; old links 404 gracefully; re-sharing reuses the
  same slug so previously copied links start working again.
- Delete account cascades trips and saved destinations; sign-out is handled client-side.
- Copy Trip from a public trip deep-clones trip, stops, items and expenses into the caller's account with a
  "(Copy)" name suffix, `isPublic=false` and `publicSlug=null` on the clone.
