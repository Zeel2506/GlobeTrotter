# GlobeTrotter — API CONTRACT (frozen)

Every response is `{ data }` on success or `{ error, issues? }` on failure (`src/lib/api-helpers.ts`).
All money values are plain JSON numbers, never Prisma `Decimal` strings. All dates are ISO-8601.
`ownerOrAdmin` means: the row's `userId` equals the session user, or the session role is `ADMIN`.

## Conventions

| Status | Meaning |
|---|---|
| 200 / 201 | ok |
| 400 | malformed JSON or bad param |
| 401 | not authenticated |
| 403 | authenticated but not permitted |
| 404 | not found, or found but not visible to the caller |
| 409 | conflict (duplicate email, duplicate saved destination) |
| 422 | zod validation failed, `issues` carries field errors |

List endpoints accept `?page=&pageSize=` and return `{ data: { rows, total, page, pageSize } }`.

## Nav table

| Path | Roles | Screen |
|---|---|---|
| `/` | public | landing |
| `/login`, `/signup` | public | S1 |
| `/p/[slug]` | public | S11 |
| `/dashboard` | USER, ADMIN | S2 |
| `/trips` | USER, ADMIN | S4 |
| `/trips/new` | USER, ADMIN | S3 |
| `/trips/[id]` | owner or ADMIN | S6, S10 |
| `/trips/[id]/build` | owner or ADMIN | S5 |
| `/trips/[id]/budget` | owner or ADMIN | S9 |
| `/cities` | USER, ADMIN | S7 |
| `/activities` | USER, ADMIN | S8 |
| `/profile` | USER, ADMIN | S12 |
| `/admin` | ADMIN | S13 |

## W0+W1 — Auth

| Method | Path | Roles | Body (zod) | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | public | `{ name 2-80, email, password 6-72 }` — role forced to `USER` | `201 { id, name, email, role }` |
| * | `/api/auth/[...nextauth]` | public | Auth.js credentials | session |

## W2 — Trips

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| GET | `/api/trips?filter=upcoming\|ongoing\|past\|all&q=&page=` | any | — | `{ rows: TripCard[], total, page, pageSize }` |
| POST | `/api/trips` | any | `{ name 2-100, startDate, endDate>=startDate, description?, coverPhotoUrl? <=2MB, budgetTotal?>=0 }` | `201 Trip` |
| GET | `/api/trips/[id]` | ownerOrAdmin | — | `Trip & { stops: (Stop & { city, _count.items })[], totalCost, status, nights }` |
| PATCH | `/api/trips/[id]` | ownerOrAdmin | partial of POST body | `Trip` |
| DELETE | `/api/trips/[id]` | ownerOrAdmin | — | `{ id }` |

`TripCard = { id, name, startDate, endDate, coverPhotoUrl, status, stopCount, firstCityImage, firstCityName, totalCost, budgetTotal, isPublic }`

## W2 — Stops

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `/api/trips/[id]/stops` | ownerOrAdmin | `{ cityId, startDate, endDate, notes? }` — dates must sit inside the trip range | `201 Stop & { city }` |
| PATCH | `/api/stops/[id]` | ownerOrAdmin | `{ startDate?, endDate?, notes? }` same guard | `Stop & { city }` |
| DELETE | `/api/stops/[id]` | ownerOrAdmin | — | `{ id }` |
| POST | `/api/trips/[id]/stops/reorder` | ownerOrAdmin | `{ orderedStopIds: string[] }` — must be exactly the trip's stop id set | `{ rows: Stop[] }` |

Guards: `endDate >= startDate`; `startDate >= trip.startDate`; `endDate <= trip.endDate`; the city must exist.
Reorder renumbers `order` 0..n-1 inside one transaction after validating set equality (422 otherwise).

## W2 — Catalog

| Method | Path | Roles | Query / Body | Response |
|---|---|---|---|---|
| GET | `/api/cities` | any | `?q=&country=&region=&sort=popularity\|costIndex\|name&dir=asc\|desc&page=` | `{ rows: City & { _count.activities }, total, ... }` |
| POST | `/api/cities` | ADMIN | `{ name, country, region, costIndex 1-100, popularity>=0, description?, imageUrl? }` | `201 City` |
| GET | `/api/cities/[id]` | any | — | `City & { activities: Activity[], _count }` |
| PATCH | `/api/cities/[id]` | ADMIN | partial | `City` |
| DELETE | `/api/cities/[id]` | ADMIN | — | `{ id }` (409 when stops reference it) |
| GET | `/api/activities` | any | `?cityId=&q=&category=&maxCost=&maxDuration=&sort=cost\|durationHours\|name&dir=&page=` | `{ rows: Activity & { city }, total, ... }` |
| POST | `/api/activities` | ADMIN | `{ cityId, name, category, cost>=0, durationHours>0, description?, imageUrl? }` | `201 Activity` |
| GET/PATCH/DELETE | `/api/activities/[id]` | any / ADMIN / ADMIN | — | `Activity` |

## W2 — Saved destinations and profile

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| GET | `/api/saved-destinations` | any | — | `{ rows: (SavedDestination & { city })[] }` |
| POST | `/api/saved-destinations` | any | `{ cityId }` | `201 SavedDestination & { city }` (409 if already saved) |
| DELETE | `/api/saved-destinations/[cityId]` | any | — | `{ cityId }` |
| GET | `/api/profile` | any | — | `{ id, name, email, role, photoUrl, languagePref, createdAt, counts: { trips, savedDestinations } }` |
| PATCH | `/api/profile` | any | `{ name?, email?, photoUrl? <=2MB, languagePref?, password? }` | profile (409 on email taken) |
| DELETE | `/api/profile` | any | — | `{ id }` — cascades own trips + saved destinations |

## W3 — Itinerary items

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `/api/stops/[id]/items` | ownerOrAdmin | `{ activityId, date, startTime? "HH:mm", costOverride?>=0, notes? }` | `201 Item & { activity }` |
| PATCH | `/api/items/[id]` | ownerOrAdmin | `{ date?, startTime?, costOverride?, notes? }` | `Item & { activity }` |
| DELETE | `/api/items/[id]` | ownerOrAdmin | — | `{ id }` |
| POST | `/api/stops/[id]/items/reorder` | ownerOrAdmin | `{ date, orderedItemIds: string[] }` | `{ rows: Item[] }` |

Guards: the activity must belong to the stop's city (422 otherwise); `date` must fall inside the stop's
range; reorder ids must be exactly the item set for that stop and date.

## W3 — Expenses

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| GET | `/api/stops/[id]/expenses` | ownerOrAdmin | — | `{ rows: Expense[] }` |
| POST | `/api/stops/[id]/expenses` | ownerOrAdmin | `{ category TRANSPORT\|STAY\|MEALS\|OTHER, description 1-120, amount>=0, date? }` | `201 Expense` |
| PATCH | `/api/expenses/[id]` | ownerOrAdmin | partial | `Expense` |
| DELETE | `/api/expenses/[id]` | ownerOrAdmin | — | `{ id }` |

## W3 — Budget and itinerary payloads

`GET /api/trips/[id]/budget` — ownerOrAdmin

```json
{ "data": {
  "totals": { "transport": 0, "stay": 0, "activities": 0, "meals": 0, "other": 0, "grand": 0 },
  "avgPerDay": 0, "nights": 0, "budgetTotal": null, "overBudget": false, "dailyBudget": null,
  "perDay": [{ "date": "2026-09-01", "amount": 0, "overBudget": false }]
} }
```

`GET /api/trips/[id]/itinerary` — ownerOrAdmin

```json
{ "data": {
  "trip": { "id": "", "name": "", "startDate": "", "endDate": "", "coverPhotoUrl": null,
            "description": null, "isPublic": false, "publicSlug": null, "ownerName": "", "status": "upcoming" },
  "days": [{ "date": "2026-09-01", "dayNumber": 1,
             "stop": { "id": "", "notes": null, "city": { "id": "", "name": "", "country": "", "imageUrl": null } },
             "items": [{ "id": "", "startTime": "09:30", "notes": null, "order": 0, "effectiveCost": 0,
                         "activity": { "id": "", "name": "", "category": "", "durationHours": 0, "imageUrl": null, "description": null } }],
             "dayTotal": 0 }],
  "budget": { "...same shape as /budget..." }
} }
```

Days with no stop still appear with `stop: null` so gaps are visible in the timeline.

## W3 — Sharing

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `/api/trips/[id]/share` | ownerOrAdmin | — | `{ publicSlug, url, isPublic: true }` |
| POST | `/api/trips/[id]/unshare` | ownerOrAdmin | — | `{ isPublic: false, publicSlug }` |
| GET | `/api/public/trips/[slug]` | **public, no session** | — | same shape as `/itinerary` (404 when `isPublic=false`) |
| POST | `/api/public/trips/[slug]/copy` | any logged-in | — | `201 { id, name }` deep clone |

`src/middleware.ts` whitelists `/p` and the matcher already excludes `/api`; the public GET route calls no
auth guard at all. Demo-critical: verify logged out.

## W4 — Dashboard and admin

`GET /api/dashboard` — any

```json
{ "data": {
  "user": { "name": "", "photoUrl": null },
  "upcoming": [{ "...TripCard": "", "daysUntil": 12 }],
  "recommended": [{ "id": "", "name": "", "country": "", "region": "", "costIndex": 0, "popularity": 0, "imageUrl": null }],
  "budgetHighlights": { "tripId": "", "tripName": "", "grand": 0, "budgetTotal": null, "overBudget": false, "overBudgetDays": 0 },
  "recent": ["TripCard"],
  "counts": { "trips": 0, "cities": 0, "savedDestinations": 0 }
} }
```

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/admin/analytics` | ADMIN | `{ userStats: { total, newThisMonth, tripsPerUserAvg }, tripStats: { total, publicTotal }, tripsOverTime: [{ month, count }] (6 mo), topCities: [{ id, name, country, stopCount }], topActivities: [{ id, name, cityName, itemCount }] }`; `?format=csv` streams CSV |
| GET | `/api/admin/users` | ADMIN | `?q=&role=&isActive=&page=` → `{ rows: (User & { _count.trips })[], total, ... }`; `?format=csv` |
| PATCH | `/api/admin/users/[id]` | ADMIN | `{ isActive?, role? }` — an admin cannot demote or deactivate themselves (422) |

## Change policy

This contract is frozen. Any change is recorded in `docs/DECISIONS.md` with a date and a reason before the
code changes.
