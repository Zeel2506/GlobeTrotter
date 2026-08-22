# DEMO SCRIPT

Run `npm run db:reset` right before presenting — it restores every trip, slug and budget figure
below to the exact state described here.

Accounts, all password `Demo@123`: `user@demo.com` (Zeel Patel) · `friend@demo.com` (Riya Shah) ·
`admin@demo.com` (Aarti Mehta).

---

## 0. Before you start

| Check | |
|---|---|
| `npm run db:reset` | Fresh seed |
| Second browser window in **private mode** | For the logged-out public page — do not skip this |
| `npm run check` | Proves the budget math, useful if a judge asks |

---

## 1. Signup → Dashboard (30s)

Sign up a brand-new account to show the empty state, then log in as `user@demo.com` for the real data.

Dashboard shows: welcome line, **European Summer Escape** counting down 24 days, recommended
destinations the user has no stop in, and budget highlights for **Japan Right Now** — the trip that
is currently over budget ($1,908 spent against a $1,800 budget).

> Talking point: the recommendation list excludes cities already on the user's itinerary.

## 2. Plan a new trip (45s)

**Plan New Trip** → name, date range, description → save lands directly in the itinerary builder.

## 3. City Search → add stops (1 min)

Search the catalog — 31 cities, filterable by country and region, sortable by popularity or cost index.
Add two or three cities to the new trip with date ranges. Heart one to save it to the profile.

> Talking point: no external travel API. The catalog is seeded, which is why search is instant and
> every city has a cost index the budget can reason about.

## 4. Activity Search → assign to days (1 min)

Filter by category, max cost, max duration. Assign several activities to specific days.

Try adding a **Tokyo** activity to a **Paris** stop — the API refuses it:
`"That activity belongs to a different city than this stop"`.

## 5. Reorder (30s)

Drag a stop to a new position, then drag an activity within a day. Use the arrow buttons too — the
reorder works without drag-and-drop, which matters on a phone.

> A partial or foreign id list is rejected with 422 rather than silently corrupting the order.

## 6. Itinerary View — timeline ⇄ calendar (45s)

Open **European Summer Escape**. Day-wise vertical timeline, city header per day, activity blocks with
time and cost, day totals. Toggle to calendar. Days with no stop still appear — a planning gap should
be visible, not hidden.

## 7. Budget (1 min) — the centrepiece

Open the budget screen for **European Summer Escape**.

| | |
|---|---|
| Grand total | **$3,303** |
| Budget | **$4,400** |
| Nights | 12 |
| Average per day | **$275.25** |
| Daily budget | **$366.67** |
| Over-budget days | the Versailles + Moulin Rouge day pulses red |

> Talking point: an undated expense like "hotel, 4 nights" is spread across that stop's days, not
> dumped on day one. That is why the per-day chart reads as a real spending pattern. And
> `sum(per-day) === grand total` always — nothing is lost or double-counted.

Now open **Japan Right Now** to show the other state: overall over budget, $1,908 against $1,800.

## 8. Share → public page (1 min)

Share the trip. Copy the URL. **Open it in the private window** — no login, the itinerary and budget
summary render in full.

Then, still in the owner's window, un-share it and refresh the private window: 404. Re-share it — the
**same slug comes back**, so a link already sent to a friend starts working again.

> Talking point: the owner's personal budget target is never exposed on the public page. Viewers see
> what the trip costs, not what the owner meant to spend.

## 9. Copy Trip (45s)

In the private window open `/p/sea-shoestring-demo` (Riya's trip). Log in as `friend@demo.com` — or
any account — and hit **Copy Trip**.

The clone lands in My Trips as *"Southeast Asia on a Shoestring (Copy)"* with all stops, all
activities, all expenses and an identical total — and it is **private**, with no public slug. Copying
someone's trip does not republish it.

## 10. Admin analytics (45s)

Log in as `admin@demo.com`.

| | |
|---|---|
| Users | 15 total, 5 new this month, 1.47 trips per user |
| Trips | 22, of which 2 are public |
| Trips over 6 months | a real curve, not one bar |
| Top cities | Paris (6), Barcelona (4), Bangkok (4), Rome (4)… |
| Top activities | ranked by how often they are actually scheduled |

Hit a CSV export button. Then show that `user@demo.com` gets **403** on the same endpoint.

---

## If something breaks

| Symptom | Fix |
|---|---|
| Wrong trip totals or dates | `npm run db:reset` |
| Public link 404s | The trip is un-shared — re-share it, the slug is reused |
| Login fails | Check `AUTH_SECRET` is set in the deployed environment |
| Everything looks empty | `DATABASE_URL` is pointing at an unseeded database |

## The one-line pitch

> Most trip planners handle one city. GlobeTrotter handles the multi-city trip the way people actually
> take them — ordered stops, day-by-day activities, a budget that tells you which day you overspent,
> and a link you can hand to a friend who can copy the whole plan in one click.
