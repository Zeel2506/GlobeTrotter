# TEST CASES

Manual suite covering both roles. Run `npm run db:reset` first — every expected
value below assumes a fresh seed.

**Accounts** (password `Demo@123`): `user@demo.com` (USER) · `friend@demo.com` (USER) ·
`admin@demo.com` (ADMIN).

| Legend | |
|---|---|
| 🔴 | Demo-path critical — a failure here breaks the presentation |
| 🔒 | Authorisation boundary — must hold against a hand-crafted request, not just a hidden button |

---

## A. Authentication (A1–A7)

### A1 🔴 Sign up creates a USER
**Steps:** `/signup` → name, unused email, password ≥6 → submit.
**Expected:** Account created, signed in, landed on `/dashboard`. Role is `USER`.
**Negative:** Confirm the signup form offers **no** role selector — ADMIN must not be self-assignable.

### A2 Duplicate email rejected
**Steps:** Sign up with `user@demo.com`.
**Expected:** `409` — "An account with this email already exists". No second account.

### A3 Password minimum enforced
**Steps:** Sign up with a 5-character password.
**Expected:** `422`, field-level error. No account created.

### A4 🔴 Log in and out
**Steps:** Log in as `user@demo.com` → sign out from the avatar menu.
**Expected:** Dashboard on login; landing page on logout; `/dashboard` then redirects to `/login`.

### A5 Wrong password rejected
**Expected:** Stays on `/login` with an error. No session cookie issued.

### A6 🔒 Suspended account cannot sign in
**Steps:** As admin, suspend a user → try to log in as them.
**Expected:** Login refused (`authorize()` checks `isActive`).

### A7 callbackUrl round-trip
**Steps:** Logged out, visit `/trips/new`.
**Expected:** Redirect to `/login?callbackUrl=%2Ftrips%2Fnew`; after login you land on `/trips/new`, not the dashboard.

---

## B. Trips (B1–B9)

### B1 🔴 Create a trip
**Steps:** `/trips/new` → name, start, end via the calendar → Create.
**Expected:** Trip created, redirected to `/trips/[id]/build`.

### B2 End date before start rejected
**Expected:** Inline error, submit blocked; the API also returns `422` if forced.

### B3 🔴 Derived status is correct
**Steps:** Open `/trips`, check the filter tabs.
**Expected:** European Summer Escape = **upcoming**, Japan Right Now = **ongoing**, Iceland Ring Road = **past**. Each tab returns only its own trips; **All** returns 3.

### B4 Trip card figures
**Expected:** European Summer Escape shows 3 stops and a total of **₹2,74,250**.

### B5 Cover photo size cap
**Steps:** Attempt an image > 2 MB.
**Expected:** Rejected client-side with a message; the API independently rejects an oversized base64 body.

### B6 Edit a trip
**Expected:** Changes persist after reload.

### B7 🔒 Narrowing dates that would orphan a stop
**Steps:** Edit European Summer Escape so the end date falls before the Barcelona stop.
**Expected:** `422` naming the offending stop. Nothing is silently detached.

### B8 🔴 Delete cascades
**Steps:** Delete a trip from `/trips` → confirm.
**Expected:** Gone from the list; its stops, items and expenses are removed. Confirm dialog required.

### B9 🔒 Another user's trip is invisible
**Steps:** As `friend@demo.com`, request `/api/trips/{a user@demo trip id}`.
**Expected:** **404**, not 403 — IDs must not be enumerable.

---

## C. Stops & Ordering (C1–C6)

### C1 🔴 Add a stop
**Steps:** Builder → Add Stop → pick a city → dates inside the trip window.
**Expected:** Stop appended at the end of the order.

### C2 🔒 Stop dates must sit inside the trip
**Steps:** Give a stop a date outside the trip range.
**Expected:** `422` — "Stop dates must fall inside the trip dates".

### C3 🔴 Reorder by drag
**Expected:** New order persists across reload; `order` renumbered `0..n-1`.

### C4 🔴 Reorder by arrow buttons
**Expected:** Identical result to C3 — reordering must work without a pointer.

### C5 🔒 Malformed reorder rejected
**Steps:** `POST /api/trips/[id]/stops/reorder` with one ID missing.
**Expected:** `422`; existing order unchanged.

### C6 Deleting a stop closes the gap
**Expected:** Remaining stops renumber contiguously — no gap at the deleted index.

---

## D. Activities & Itinerary (D1–D6)

### D1 🔴 Assign an activity to a day
**Expected:** Appears under that day with time, category chip and effective cost.

### D2 🔴🔒 Cross-city assignment refused
**Steps:** Try to add a **Tokyo** activity to a **Paris** stop.
**Expected:** `422` — "That activity belongs to a different city than this stop".

### D3 🔒 Date outside the stop refused
**Expected:** `422` — "That date is outside this stop's dates".

### D4 Cost override is per-trip
**Steps:** Override an activity's cost on one trip.
**Expected:** The trip total changes; the catalog price on `/activities` is unchanged for everyone.

### D5 🔴 Timeline ⇄ calendar toggle
**Expected:** Both views show the same days, activities and totals. Days with no stop still appear (planning gaps must be visible).

### D6 Per-day reorder
**Expected:** Order within a day persists; moving an item to another day appends it to the end of that day.

---

## E. Budget (E1–E7)

### E1 🔴 Category breakdown
**Steps:** Open the budget screen for European Summer Escape.
**Expected:** Transport **₹49,800**, Stay **₹94,200**, Activities **₹90,400**, Meals **₹34,850**, Other **₹5,000**, Grand **₹2,74,250**.

### E2 🔴 Totals reconcile
**Expected:** `sum(perDay) === totals.grand` exactly. No rounding drift.

### E3 Average per day
**Expected:** 12 nights, **₹22,854**/day.

### E4 🔴 Over-budget day flagged
**Expected:** Budget ₹3,65,200 → daily ₹30,433. The Versailles + Moulin Rouge day exceeds it and pulses red, then holds a static red.

### E5 Overall over-budget
**Steps:** Open Japan Right Now.
**Expected:** ₹1,58,350 spent against ₹1,49,400 — flagged as over budget overall.

### E6 No budget → no alerts
**Steps:** Clear `budgetTotal`.
**Expected:** `dailyBudget: null`, `overBudget: false`, no day flags. Totals still computed.

### E7 Undated expense spreads across its stop
**Steps:** Add an expense with no date to a 4-day stop.
**Expected:** Divided evenly across those 4 days — **not** dumped on day one. Grand total unchanged.

---

## F. Sharing & Copy (F1–F7)

### F1 🔴 Share a trip
**Expected:** Returns `publicSlug` + absolute URL; trip marked public.

### F2 🔴🔒 Public page works logged out
**Steps:** Open `/p/[slug]` in a **private window**.
**Expected:** `200`, full itinerary and cost summary, no redirect to login.

### F3 🔒 Owner's budget target is private
**Expected:** The public payload contains **no** `budgetTotal` and no over-budget flags — viewers see cost, not intent.

### F4 🔒 Un-shared link 404s
**Steps:** Un-share, reload the public URL.
**Expected:** `404`, not 403 — reveals nothing about whether the trip exists.

### F5 🔴 Re-share reuses the slug
**Expected:** The **same** slug returns, so links already sent out start working again.

### F6 🔒 Copy requires authentication
**Steps:** `POST /api/public/trips/[slug]/copy` logged out.
**Expected:** `401`.

### F7 🔴 Copy Trip deep-clones
**Steps:** As `friend@demo.com`, copy `/p/iceland-ring-road-demo`.
**Expected:** New trip named "… (Copy)" with all stops, items and expenses and an **identical grand total**. The clone is **private** with `publicSlug: null`.

---

## G. Discovery & Profile (G1–G7)

### G1 City search
**Expected:** Searching `Paris` returns Paris; `Japan` returns Tokyo and Kyoto; `Europe` returns the European cities.

### G2 Filters and sort
**Expected:** Region and country narrow results; sorting by cost index and popularity both order correctly.

### G3 Activity filters
**Expected:** Category, max cost and max duration all narrow results; combining them ANDs correctly.

### G4 Save and unsave a destination
**Expected:** Heart persists across reload; appears in `/profile`; removing it there removes it everywhere. Saving twice returns `409`.

### G5 Update profile
**Expected:** Name, email, language and photo persist. Changing to a taken email returns `409`.

### G6 🔒 Delete account
**Steps:** Profile → Danger zone → type `DELETE`.
**Expected:** Double-confirm required; account and all its trips removed; signed out.

### G7 Every image degrades gracefully
**Steps:** Point a city's `imageUrl` at a dead URL.
**Expected:** Deterministic gradient fallback — never a broken-image icon. The same city always gets the same gradient.

---

## H. Admin (H1–H12)

### H1 🔴🔒 USER cannot reach `/admin`
**Steps:** As `user@demo.com`, visit `/admin`.
**Expected:** Redirected to `/dashboard`. `GET /api/admin/analytics` returns **403**.

### H2 🔴 Analytics loads
**Expected:** 15 users, 22 trips, a 6-month trips curve with varying values (not one bar), ranked top cities and top activities.

### H3 Top destinations ranked
**Expected:** Paris leads, followed by Barcelona / Bangkok / Rome. Counts match stop counts.

### H4 CSV export
**Steps:** Export cities, activities, trips and users.
**Expected:** Each downloads with a header row and correct values. The **users** export contains every filtered row, not just the current page.

### H5 User search and filters
**Expected:** Name/email search, plus Admins and Suspended filters, narrow correctly.

### H6 Change a role
**Expected:** Role updates optimistically and persists after reload.

### H7 🔒 Admin cannot change their own role or suspend themselves
**Expected:** Buttons disabled; a forced `PATCH /api/admin/users/{self}` returns **422**.

### H8 🔴 City catalog management
**Steps:** `/admin/cities` → search, filter by region, add a city, edit it.
**Expected:** Table reflects changes after save. Cost index accepts 1–100 only.

### H9 🔒 A city in use cannot be deleted
**Steps:** Try to delete Paris (used by trip stops).
**Expected:** Delete disabled with a tooltip; a forced `DELETE /api/cities/{id}` returns **409** naming the stop count.

### H10 Activity catalog management
**Steps:** `/admin/activities` → filter by city and category, add an activity, edit its cost.
**Expected:** Changes persist. The new cost appears on `/activities` and in any *future* budget — existing itinerary items keep their own `costOverride` if set.

### H11 🔒 A scheduled activity cannot be deleted
**Expected:** Delete disabled; a forced request returns **409**.

### H12 🔒 Last active admin protected
**Steps:** With one admin remaining, try to demote or suspend them.
**Expected:** **422** — the platform must not become unadministrable.

---

## I. Cross-Cutting (I1–I6)

### I1 🔴 Mobile responsive
**Steps:** 375px width across dashboard, builder, budget, public page.
**Expected:** No horizontal scroll; the builder and public page remain usable. (PDF requirement.)

### I2 No hydration errors
**Steps:** Open the console on `/`, `/dashboard`, `/trips`, `/p/[slug]`.
**Expected:** No hydration warnings — including with **Reduced Motion enabled**, which is what previously exposed one.

### I3 Reduced motion honoured
**Steps:** Enable Reduced Motion at OS level and reload.
**Expected:** Entrances and transitions suppressed; the app stays fully usable and nothing disappears.

### I4 Favicon loads logged out
**Steps:** Request `/icon` with no session.
**Expected:** **200** image — not a 307 to `/login`.

### I5 Empty states
**Steps:** Sign up fresh; visit `/trips`, `/profile`.
**Expected:** Inviting empty states with a clear next action — never a blank panel.

### I6 Budget maths self-check
**Steps:** `npm run check`.
**Expected:** Passes. Covers effective-cost precedence, category totals, per-day reconciliation, daily-budget flags, same-day trips, and timezone drift.

---

## Coverage Summary

| Area | Cases | Critical | Authorisation |
|---|:---:|:---:|:---:|
| Authentication | 7 | 2 | 1 |
| Trips | 9 | 3 | 2 |
| Stops & ordering | 6 | 2 | 2 |
| Activities & itinerary | 6 | 2 | 2 |
| Budget | 7 | 3 | — |
| Sharing & copy | 7 | 3 | 4 |
| Discovery & profile | 7 | — | 1 |
| Admin | 12 | 3 | 6 |
| Cross-cutting | 6 | 1 | — |
| **Total** | **67** | **19** | **18** |
