# DEV B — Frontend Prompt: GlobeTrotter Travel Planner (Claude Code)

> Inputs: this file + `GlobeTrotter.pdf` + `docs/SPEC.md` / `docs/API_CONTRACT.md` + the repo once W0+W1 is pushed. No wireframes — SPEC blueprints are ground truth for WHAT each screen contains; your research decides HOW it looks. You own: page routes, `src/components/`, `globals.css`, `src/config/*`. Never edit `prisma/`, `src/app/api/`, `src/lib/` server files.
>
> **This build is frontend-heavy by design (~5.5+ hrs of screen time)** — GlobeTrotter is a consumer product where the itinerary builder, calendar, and budget visuals ARE the product. Backend waves: W0+W1 auth/schema/catalog → W2 trips/search → W3 itinerary/budget/share → W4 dashboard/admin. `git pull --rebase` on each announcement; never idle — every phase has repo-independent work.

## PHASE F0 — Research + Design System (0:00–1:15, needs no repo)

1. **Deep web research, travel-product track.** Study the leading travel-planning products — Wanderlog, TripIt, Google Travel-style flows, Airbnb/Booking for cards+imagery+search UX, Kayak/Skyscanner for filters: how they lay out trip cards, day-by-day itineraries (vertical day timeline with city headers is the dominant pattern), city/activity discovery grids, budget summaries; where primary actions sit; how they make destination content feel alive with imagery. Collect concrete patterns.
2. **Landing-page research.** Travel SaaS marketing pages: hero with destination imagery/gradient + dual CTA, bento feature grid, "plan → build → share" step sections, social-proof strip, footer; motion — scroll reveals, staggered entrances, hover lift.
3. **Design system — LIGHT THEME, hard requirement, dual personality.** One token foundation (white/soft-neutral backgrounds, dark text, one typeface pairing) in two modes:
   - **Mode B — Consumer (everything traveler-facing, i.e., ~90% of the app):** warm, wanderlust-inducing, image-forward. Travel palette: one confident primary (ocean teal or sunset coral — pick and freeze) + soft sand/sky neutrals; big rounded cards; category color chips for the 8 activity categories (freeze a map); **image fallback system — cities/activities may lack imageUrls, so build a beautiful deterministic gradient-from-name + emoji/icon placeholder component and use it everywhere an image can appear** (never a broken img or gray box).
   - **Mode A — Analytical (Admin dashboard + user management only):** dense, muted, ERP-grade tables and charts.
   Same tokens, different register. **Motion budget — exactly three signature moments:** (1) adding a city/activity to a trip (card fly/checkmark pop + toast), (2) budget screen chart entrance + over-budget pulse on flagged days, (3) copy-trip success celebration. Everything else uses a shared framer-motion preset kit (fade/slide/hover-lift). Drag-and-drop reorder uses @dnd-kit with visible drop indicators — **and always render up/down arrow buttons as a fallback** so reorder works even if DnD misbehaves on mobile.
4. Write `docs/DESIGN_SYSTEM.md`: tokens, category-color map, mode assignment per screen, type scale, landing section plan + motion choices, nav per role, component inventory (TripCard, CityCard, ActivityCard, DayTimeline, ItineraryItemRow, BudgetDonut/Bars, CalendarView, StopChip, ImageFallback, PageHeader, DataTable for admin, ConfirmDialog, EmptyState, form field wrappers incl. date-range picker + file-to-base64 ≤2 MB). 5-line summary to humans; proceed unless they object.

## PHASE F1 — On W0+W1 (~1:15–2:15): shell, landing, auth

1. Tokens into `globals.css`; `src/config/{nav,category-colors,landing}.ts`.
2. Generic components from the inventory (props-driven, no domain assumptions in the primitives).
3. **Landing at `/`** (public, first impression): sticky translucent navbar → hero ("Plan multi-city trips, beautifully" energy, dual CTA, CSS-built itinerary-preview visual) → stats strip → bento grid (itinerary builder / budget tracking / discovery / sharing) → "How it works" (create → add stops → discover activities → budget → share) → CTA band → footer; scroll-reveals + hover lift; light and airy. Copy in `landing.ts`.
4. Auth screens consistent with landing; app shell: sidebar or top-nav (research decides — travel apps favor top-nav + user menu; admin keeps a sidebar), notification bell optional-low-priority here.

## PHASE F2 — On W2 (~2:15–3:45): trips + discovery

- **Dashboard v1**: welcome, upcoming trip cards with countdown, "Plan New Trip" primary CTA, recommended destinations row (city cards), budget highlights strip. (Refine with W4 data later.)
- **Create Trip**: name, date range picker, description, optional cover upload → on save go straight to the builder.
- **My Trips**: filter tabs (Upcoming/Ongoing/Past/All — derived), trip cards (cover-or-fallback, name, dates, stop count, total cost chip, view/edit/delete w/ confirm).
- **City Search**: search bar + country/region filters + sort (popularity/cost index); city cards with cost-index badge + popularity; "Add to Trip" (picker dialog: which trip + dates → creates stop) + save-destination heart.
- **Activity Search**: per-city or global; filters (category chips, max cost, duration) ; activity cards with quick-view dialog (description, image-or-fallback, cost, duration) and add/remove to a stop.

## PHASE F3 — On W3 (~3:45–5:45): itinerary builder, views, budget, sharing — THE PRODUCT

- **Itinerary Builder** (`/trips/[id]/build`): stop list with city chips + date ranges, add/edit/remove stop, **reorder stops** (@dnd-kit + arrow fallback); per-stop day sections where activities are assigned (from Activity Search inline or dialog), each item row: time, name, category chip, effective cost, notes, remove; per-day reorder; running trip total always visible. This is the screen judges will poke — make interactions crisp.
- **Itinerary View** (`/trips/[id]`): the polished read view — day-wise vertical timeline with city headers, activity blocks (time + cost), day totals, **view toggle: timeline ⇄ calendar** (month grid from shadcn calendar-style layout, expandable day popovers). Quick-edit links back to builder.
- **Budget screen**: totals by Transport/Stay/Activities/Meals (donut + bar), avg per day, per-day bar chart with over-budget days pulsing red (signature moment #2), budget-vs-actual progress bar when budgetTotal set, expense add/edit inline per stop.
- **Sharing**: share dialog (make public → copy URL + social share buttons), **public page `/p/[slug]`** — read-only, logged-out-safe, beautiful (this is what gets shown around): trip hero, day timeline, budget summary, "Copy Trip" (→ login if needed → clone → celebrate, signature moment #3), un-share control for the owner.

## PHASE F4 — On W4 (~5:45–6:45): dashboard final, profile, admin

- Dashboard wired to `/api/dashboard` fully.
- **Profile/Settings**: editable name/photo/email, language preference select, saved destinations grid (remove hearts), delete account (double-confirm).
- **Admin (Mode A)**: analytics — trips-over-time line, top cities/activities tables, user stats cards; user management table (activate/deactivate, role); CSV export buttons. Dense, muted, minimal motion.

## PHASE F5 — Polish + demo (6:45–8:00)

1. Walk THE demo path with Dev A on the deployed build — signup → create trip → add 2–3 city stops → discover + assign activities → reorder → itinerary timeline + calendar toggle → budget with over-budget alert → share public → open logged-out → copy trip → admin analytics. Fixing this path outranks everything.
2. Polish: empty states (esp. brand-new user with zero trips — make it inviting), skeletons, confirm dialogs, image fallbacks everywhere, **mobile-responsive check is a PDF requirement — builder and public page must not break on a phone**, favicon, page titles.
3. Optional fidelity cross-check: if humans provide official mockups now, diff for missing elements only — add, don't restyle.
4. Keep `docs/FRONTEND.md` updated.

## Rules

Blocked on an endpoint → report to Dev A (top interrupt), switch to repo-independent work. Never compute budget/cost math client-side — display API values. Data-shaping ambiguity → API_CONTRACT.md then ask; visual gaps → decide + log DECISIONS.md. Commit small; `git pull --rebase` before push; never touch Dev A's folders.
