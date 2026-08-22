# DECISIONS

Judgment calls and gaps found while verifying the pre-baked spec against `GlobeTrotter.pdf`.
Newest first. Each entry: what, why, what it costs.

## Gaps found in the plan / starter files (fixed before they could bite)

### D-01 · `PUBLIC_PATHS.startsWith("/p")` also matches `/profile` — **bug**
The starter middleware gates by prefix. Adding `"/p"` for public itineraries would have made
`/profile` a public, session-free page and, worse, redirected logged-in users away from it.
**Fix:** whitelist the prefix `"/p/"` (with the trailing slash), never `"/p"`.

### D-02 · Logged-in users were redirected off public pages — **bug**
The starter treats one list, `PUBLIC_PATHS`, as both "no session needed" and "logged-in users must be
bounced to /dashboard". A logged-in user opening a shared link `/p/abc123` would be thrown to the
dashboard instead of seeing the trip — and the demo path opens a public link in both states.
**Fix:** split into `AUTH_PAGES` (bounce logged-in users: `/login`, `/signup`, `/forgot-password`,
`/reset-password`) and `PUBLIC_PATHS` (no session needed: `/`, `/p/`, plus the auth pages).

### D-03 · Dates stored as UTC midnight
Trip/stop/item dates are calendar days, not instants. Stored as `DateTime` pinned to UTC midnight and
compared date-only. Without this, a user in IST creating a trip "1 Sep" gets 31 Aug in the DB and the
derived upcoming/ongoing/past filter and the per-day budget buckets drift by a day.
Helper: `src/lib/dates.ts` (`toUtcDay`, `eachUtcDay`, `dayKey`).

### D-04 · One stop per itinerary day
Stops may overlap on a travel day (leave Paris, arrive Rome). The itinerary payload buckets each date to
exactly **one** stop — the covering stop with the lowest `order` — so the timeline stays readable.
Both stops still contribute their own costs to the budget, so no money is lost.
Ceiling: a same-day two-city header is not shown. Upgrade path: return `stops[]` per day.

### D-05 · Days with no stop are still returned
`/itinerary` returns every date in the trip range; uncovered days come back with `stop: null`.
Silently dropping them would hide planning gaps, which is exactly what the user needs to see.

### D-06 · Undated expenses bucket to the trip start date
`Expense.date` is optional (a flight booked for the whole trip). For the per-day series such expenses are
attributed to the trip's first day rather than dropped, so `sum(perDay) == totals.grand` always holds.

### D-07 · `DocumentSequence` and `nextDocNumber()` removed
No entity in GlobeTrotter has a human-readable document number. Carrying a sequence table and its helper
would be dead weight and an extra write per create.

### D-08 · Neon Auth not used
The user has Neon Auth enabled. It is a hosted identity product that would replace the entire Auth.js
credentials layer that the starter files already ship, pre-wired, with role claims in the JWT. Swapping it
in buys nothing this problem asks for and costs the role plumbing. Sticking with Auth.js v5 + bcrypt.

### D-09 · Un-share retains the slug
Re-sharing reuses the same slug, so links previously handed out start working again instead of dying.
While private the public route returns 404, which is the correct "not visible to you" answer.

### D-10 · Owner-or-ADMIN guard is one helper
`assertTripAccess(tripId, user)` in `src/lib/access.ts`, reused by every trip/stop/item/expense route so
nested resources resolve up to their trip once, in one place, instead of each route re-implementing it.
Returns 404 (not 403) for other users' trips so trip ids are not enumerable.

### D-11 · `costOverride` is on the itinerary item, not the activity
Catalog activity costs are shared master data. A per-trip price edit must never mutate the catalog for
every other user. Effective cost = `costOverride ?? activity.cost`, resolved server-side.

### D-12 · Base64 images capped at 2 MB, validated server-side
`coverPhotoUrl` and `photoUrl` accept `data:image/...;base64,...` only, length-checked at the API boundary.
A client-side-only cap is not a cap.

### D-13 · Reorder validates set equality
`orderedStopIds` / `orderedItemIds` must be exactly the current id set — no missing, extra or foreign ids —
then renumbers `0..n-1` in one transaction. A partial list would silently corrupt ordering.

### D-14 · Admins cannot demote or deactivate themselves
`PATCH /api/admin/users/[id]` rejects self-targeted role/isActive changes (422). Locking the only admin out
mid-demo is unrecoverable without DB access.

### D-15 · Repo layout
The Next.js app is scaffolded at the repository root (not in a subfolder) so Vercel needs no root-directory
override. `hackathon-brief/` is kept as reference material; `starter-files/` is consumed and deleted.

### D-16 · Undated expenses are spread across their stop, not dumped on day one
Found during W3 smoke-testing: with every hotel and flight attributed to the trip's first day, the
per-day chart showed a single outsized spike and twelve flat days, and that one artificial spike was the
only thing tripping the over-budget flag. An undated expense is one that covers the whole stop
("hotel, 4 nights"), so it is now divided evenly across that stop's days. Totals are unchanged and
`sum(perDay) === totals.grand` still holds; the chart now reads as a real spending pattern.

### D-17 · `middleware.ts` kept despite the Next 16 deprecation notice
Next 16 asks for `proxy.ts` instead. The file works as-is, the starter and the team plan both refer to
it by name, and renaming it mid-hackathon buys nothing. Revisit after the event.

### D-18 · Community accounts in the seed
Twelve extra users with 22 trips between them, deterministic (no `Math.random`, so a re-seed
reproduces the same charts). Without them the admin analytics screen showed one month of history and
every city tied at a single stop, which reads as a broken screen rather than a new product.
Their emails all end `@globetrotter.demo` and are deleted wholesale on re-seed.
