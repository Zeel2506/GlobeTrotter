# GlobeTrotter — DESIGN SYSTEM

Frozen in Phase F0. Light theme only — no dark mode anywhere, per the frontend brief's hard
requirement. One token foundation, two registers: **Mode B (Consumer)** for the ~90% of the app a
traveler touches, **Mode A (Analytical)** for `/admin` only.

Ground truth for WHAT each screen contains stays `docs/SPEC.md`. This file is HOW it looks.

---

## 1. Verification against the problem statement

`GlobeTrotter.pdf` is an image-only PDF — it carries no text layer, so it cannot be diffed
mechanically. `docs/SPEC.md` records Dev A's verification that all 13 PDF screens are covered, and
each SPEC screen maps 1:1 onto a row of the `docs/API_CONTRACT.md` nav table. SPEC is treated as
ground truth per the brief's own instruction ("No wireframes — SPEC blueprints are ground truth").

Every visual requirement in the brief was checked against what the API actually returns:

| Requirement | Backing | Consequence for this design system |
|---|---|---|
| Image fallback everywhere | `City.imageUrl`, `Activity.imageUrl`, `Trip.coverPhotoUrl` all nullable | `ImageFallback` is mandatory, not decorative. Never render a bare `<img>`. |
| No client-side money math | `/budget` returns `totals`, `avgPerDay`, `perDay[]` as plain numbers | Components format currency; they never add, divide, or compare it. |
| Over-budget day flag | `perDay[i].overBudget` is server-computed | Pulse animation reads the boolean. No threshold logic in the client. |
| Timeline ⇄ calendar | One `/itinerary` payload with `days[]` + `dayNumber` | Both views are pure renderers over the same array. Toggle is client state only. |
| Gap days | `stop: null` returned deliberately (`DECISIONS.md` D-05) | **`EmptyDayRow`** added to the inventory — the brief omits it, the data demands it. |
| Budget donut segments | API returns `other` alongside transport/stay/activities/meals | **5 segments, not the 4 the brief lists.** |
| Reorder | `/reorder` endpoints validate exact set equality → 422 | Arrow fallback hits the same endpoint as DnD, so a mobile DnD failure costs nothing. |
| 8 activity categories | `ActivityCategory` enum | Colour map below is frozen against exactly those 8 members. |

Two gaps found in the brief, both closed above. No brief requirement lacks backend support.

---

## 2. Tokens

Defined as CSS custom properties on `:root` in `src/app/globals.css` and exposed to Tailwind v4
through `@theme inline`. The default `prefers-color-scheme: dark` block from the starter is deleted —
a dark mode would directly contradict the light-theme requirement.

### Colour — foundation

| Token | Value | Use |
|---|---|---|
| `--background` | `#fbfaf8` | App canvas. Warm off-white, not pure white — the "sand" in the palette. |
| `--surface` | `#ffffff` | Cards, dialogs, popovers. Sits above the canvas. |
| `--surface-muted` | `#f4f2ee` | Inset panels, table stripes, skeletons. |
| `--border` | `#e7e3dc` | Hairlines. Warm-tinted so it never looks blue-grey against the sand. |
| `--border-strong` | `#d5cfc4` | Input borders, focus-adjacent edges. |
| `--foreground` | `#1c1917` | Body text. Warm near-black, never `#000`. |
| `--foreground-muted` | `#57534e` | Secondary text, labels. |
| `--foreground-subtle` | `#8a8078` | Captions, placeholders, disabled. |

### Colour — brand

**Primary is ocean teal, frozen.** Chosen over sunset coral because this product has a real
over-budget red that must stay unambiguous; a coral primary would blunt that signal every time it
appeared next to a budget warning.

| Token | Value | Use |
|---|---|---|
| `--primary` | `#0d9488` | Primary buttons, active nav, links, focus ring, brand marks. |
| `--primary-hover` | `#0f766e` | Hover/active state. |
| `--primary-soft` | `#ccfbf1` | Tinted backgrounds, selected chips, badge fills. |
| `--primary-fg` | `#ffffff` | Text on `--primary`. |
| `--accent` | `#f97316` | Sparingly: countdown pills, "new", the hero's warm gradient stop. |
| `--accent-soft` | `#ffedd5` | Accent badge fill. |

### Colour — semantic

| Token | Value | Use |
|---|---|---|
| `--success` / `--success-soft` | `#16a34a` / `#dcfce7` | Under budget, saved, share-on. |
| `--warning` / `--warning-soft` | `#ca8a04` / `#fef9c3` | Approaching budget, unsaved changes. |
| `--danger` / `--danger-soft` | `#dc2626` / `#fee2e2` | **Over-budget days, destructive actions.** Reserved. Nothing else uses red. |

### Radius, elevation, spacing

| Token | Value |
|---|---|
| `--radius-sm` / `--radius` / `--radius-lg` / `--radius-xl` | `6px` / `12px` / `18px` / `28px` |
| `--shadow-sm` | `0 1px 2px rgb(28 25 23 / .05)` |
| `--shadow` | `0 2px 8px -2px rgb(28 25 23 / .08), 0 1px 3px rgb(28 25 23 / .04)` |
| `--shadow-lg` | `0 12px 32px -8px rgb(28 25 23 / .14)` |
| `--shadow-hover` | `0 16px 40px -12px rgb(13 148 136 / .22)` — teal-tinted lift |

Big rounded cards are the consumer signature: content cards use `--radius-lg`, the landing hero and
feature bento use `--radius-xl`, controls use `--radius`.

Spacing follows Tailwind's default 4px scale. Page gutter: `1rem` mobile, `2rem` from `md`, capped
at a `1280px` content column (`1120px` for reading-heavy pages like the public itinerary).

---

## 3. Type scale

One pairing: **Plus Jakarta Sans** for display, **Inter** for UI and body. Both via `next/font/google`
with `display: "swap"`. The starter's Geist pairing is replaced — Geist reads as developer-tool, and
Mode B needs warmth.

| Role | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display (hero) | Jakarta | `clamp(2.5rem, 6vw, 4.5rem)` / 1.05 | 800 | `-0.03em` |
| H1 (page title) | Jakarta | `2rem` / 1.15 | 700 | `-0.02em` |
| H2 (section) | Jakarta | `1.5rem` / 1.25 | 700 | `-0.015em` |
| H3 (card title) | Jakarta | `1.125rem` / 1.35 | 600 | `-0.01em` |
| Body | Inter | `0.9375rem` / 1.6 | 400 | `0` |
| Body-lg (hero sub, public page) | Inter | `1.125rem` / 1.65 | 400 | `0` |
| Label | Inter | `0.8125rem` / 1.4 | 500 | `0` |
| Caption | Inter | `0.75rem` / 1.4 | 500 | `0.01em` |
| Overline | Inter | `0.6875rem` / 1.2 | 700 | `0.08em`, uppercase |
| Numeric (money, counts) | Inter | inherits | 600 | `tabular-nums` |

`tabular-nums` on every money and count value — budget columns and day totals must align.

---

## 4. Activity category map — FROZEN

Eight members of `ActivityCategory`, each with a colour, a soft fill, and a lucide icon. **The icon is
load-bearing, not decorative:** amber (FOOD) and orange (ADVENTURE) are the closest pair on this
wheel, and colour alone would fail both that pair and colour-blind users. Every chip renders
icon + label + colour together.

| Category | Colour | Soft fill | Icon |
|---|---|---|---|
| `SIGHTSEEING` | `#0891b2` | `#cffafe` | `Landmark` |
| `CULTURE` | `#7c3aed` | `#ede9fe` | `Theater` |
| `FOOD` | `#d97706` | `#fef3c7` | `UtensilsCrossed` |
| `ADVENTURE` | `#ea580c` | `#ffedd5` | `Mountain` |
| `NIGHTLIFE` | `#4338ca` | `#e0e7ff` | `Music` |
| `SHOPPING` | `#db2777` | `#fce7f3` | `ShoppingBag` |
| `NATURE` | `#059669` | `#d1fae5` | `Trees` |
| `OTHER` | `#64748b` | `#f1f5f9` | `Sparkles` |

Lives in `src/config/category-colors.ts` as a typed record keyed by the enum, with an `OTHER`
fallback for any unknown string so an API change can never crash a chip.

### Expense / budget palette — separate on purpose

The donut splits spend, not activity type, so it must not read as the category map:

| Segment | Colour |
|---|---|
| Activities | `#0d9488` (primary) |
| Transport | `#0284c7` |
| Stay | `#7c3aed` |
| Meals | `#d97706` |
| Other | `#94a3b8` |

---

## 5. Mode assignment per screen

| Screen | Route | Mode |
|---|---|---|
| Landing | `/` | B — maximal. Imagery, gradients, motion. |
| Login / Signup | `/login`, `/signup` | B — split layout, brand panel beside the form. |
| Dashboard | `/dashboard` | B |
| My Trips | `/trips` | B |
| Create Trip | `/trips/new` | B — single centred card. |
| Itinerary Builder | `/trips/[id]/build` | B, working register — denser than the dashboard, still warm. Two-column from `lg`. |
| Itinerary View | `/trips/[id]` | B — the polished read view. |
| Budget | `/trips/[id]/budget` | B with analytical charts. Warm frame, precise data. |
| City / Activity Search | `/cities`, `/activities` | B — image-forward grids. |
| Profile | `/profile` | B |
| Public itinerary | `/p/[slug]` | B — maximal, widest margins. This is the shareable artifact. |
| Admin | `/admin` | **A** — dense tables, muted chart palette, `--radius-sm`, no entrance motion beyond a single fade. |

Mode A reuses the identical tokens. It only changes register: tighter row height (`36px` vs `52px`),
`--surface-muted` table stripes, `13px` body, charts desaturated to slate + one teal accent, and
motion reduced to nothing but a page fade.

---

## 6. Navigation per role

Top-nav for the consumer app (travel products favour it, and the builder needs full horizontal width),
sidebar for admin only.

- **Logged out:** translucent sticky navbar — logo, "Explore", "How it works", `Log in`, `Sign up` (primary).
- **`USER`:** logo, Dashboard · My Trips · Explore Cities · Activities, then a right cluster of
  "Plan New Trip" (primary) + avatar menu (Profile, Saved destinations, Sign out).
- **`ADMIN`:** everything a `USER` sees, plus an "Admin" entry in the avatar menu. `/admin` renders
  its own left sidebar (Analytics, Users) inside the Mode A shell.
- **Mobile:** nav collapses to a sheet; "Plan New Trip" persists as the only visible action.

Lives in `src/config/nav.ts` as role-filtered arrays so the navbar stays a dumb renderer.

---

## 7. Landing page plan (`/`)

Sections top to bottom, copy in `src/config/landing.ts`:

1. **Hero** — warm sand→teal gradient wash, headline "Plan multi-city trips, beautifully", subhead,
   dual CTA (`Start planning free` primary + `See a sample trip` ghost → a public itinerary).
   Visual is a **CSS-built itinerary preview** — a tilted stack of day cards with city chips and
   category dots. No stock photography dependency, nothing to 404.
2. **Stats strip** — cities in the catalog, activities, average plan time. Thin, bordered, muted.
3. **Bento grid** — 4 tiles, unequal spans: Itinerary builder (large, with a mini timeline), Budget
   tracking (donut sliver), Discovery (city card fan), Sharing (public-link mock).
4. **How it works** — 5 numbered steps: create → add stops → discover activities → track budget →
   share. Connected by a rule that draws in on scroll.
5. **CTA band** — full-bleed teal, single primary action.
6. **Footer** — logo, nav columns, credit line.

Motion: scroll-reveal (fade + 16px rise, 60ms stagger) via a shared `useReveal`; hover lift on every
card. All of it respects `prefers-reduced-motion`.

---

## 8. Motion — budget of exactly three

Three signature moments. Everything else uses the shared preset kit in `src/lib/motion.ts`
(`fadeIn`, `riseIn`, `stagger`, `hoverLift`, `popIn`).

1. **Add city/activity to a trip** — the source card scales down and flies toward the trip target,
   a checkmark pops at the destination, a `sonner` toast confirms with an Undo action.
2. **Budget entrance + over-budget pulse** — donut sweeps from 0°, bars grow from baseline with a
   40ms stagger; any day where `perDay[i].overBudget` is true pulses its bar between `--danger` and
   `--danger-soft`, twice, then holds a static red with a warning icon. It must not pulse forever —
   an endless animation reads as a broken page during a demo.
3. **Copy-trip success** — on the public page, a confetti burst plus the new trip card sliding in,
   then routing to the clone's builder.

Global rules: durations `150ms` (micro) / `240ms` (standard) / `420ms` (entrance); easing
`cubic-bezier(.32,.72,0,1)`. **Every animation is wrapped so `prefers-reduced-motion: reduce`
collapses it to an instant state change** — including the three signatures.

Drag-and-drop uses `@dnd-kit` with a visible teal drop indicator between rows, a lifted drag overlay,
and **up/down arrow buttons always rendered beside every draggable row**. Arrows are not a
progressive-enhancement afterthought; they are the primary guarantee that reorder works on a phone.

---

## 9. Component inventory

Primitives are prop-driven with no domain knowledge. `src/components/ui/` holds shadcn-derived
primitives; `src/components/` holds the domain components.

**Primitives (`ui/`)** — Button, Input, Textarea, Select, Checkbox, Label, Badge, Card, Dialog,
Sheet, Popover, Tabs, Tooltip, Skeleton, Separator, Avatar, DropdownMenu, Calendar, Toaster.

**Shared**
- `ImageFallback` — the keystone. Given `src`, `name`, and a `variant` (`city` | `activity` | `trip`),
  renders the image when present, otherwise a deterministic gradient derived from a hash of `name`
  (stable across renders and reloads — the same city is always the same gradient) with a centred
  icon and the initial. Also the `onError` target, so a broken URL degrades into the same fallback
  rather than a browser icon.
- `PageHeader` — title, optional description, breadcrumb, right-aligned action slot.
- `EmptyState` — icon, headline, body, CTA. The zero-trip dashboard variant is deliberately inviting.
- `ConfirmDialog` — destructive confirmation, with a `requireDoubleConfirm` prop for delete-account.
- `StatCard`, `CategoryChip`, `CostChip`, `StatusBadge`, `CountdownPill`.
- Form wrappers: `Field` (label + control + error + hint), `DateRangeField` (react-day-picker,
  clamped to a parent range for stop dates), `ImageUploadField` (file → base64, **rejects > 2 MB
  before encoding**, previews through `ImageFallback`).

**Domain**
- `TripCard`, `CityCard`, `ActivityCard` (+ `ActivityQuickView` dialog).
- `DayTimeline`, `DayCard`, `ItineraryItemRow`, `EmptyDayRow`, `StopChip`, `StopCard`.
- `CalendarView` — month grid with per-day cost + category dots, expandable day popover.
- `BudgetDonut`, `BudgetBars`, `PerDayBarChart`, `BudgetProgress`, `ExpenseRow`.
- `AddToTripDialog`, `ShareDialog`, `CopyTripButton`.
- `ReorderControls` — the arrow-button fallback, shared by stops and items.

**Admin (Mode A)** — `DataTable` (sortable, paginated, CSV-export slot), `AdminStatCard`,
`TripsOverTimeChart`, `TopListTable`, `UserRow`.

---

## 10. Rules this system enforces

1. No component computes money. Totals, averages, and over-budget flags arrive from the API.
2. No bare `<img>`. Every image path goes through `ImageFallback`.
3. Red is reserved for over-budget and destructive actions. Nothing decorative is red.
4. Every category chip carries an icon and a label, never colour alone.
5. Every destructive action goes through `ConfirmDialog`.
6. Every list has a skeleton and an empty state before it ships.
7. Every reorderable row has arrow buttons regardless of DnD.
8. The builder and the public page are checked at 375px width before any phase is called done.

---

## Summary for humans

1. **Light theme, ocean teal primary, warm sand neutrals** — teal is frozen over coral so the
   over-budget red stays unambiguous. Plus Jakarta Sans + Inter replace the starter's Geist.
2. **The 8 activity categories get a frozen colour + icon map**; chips always show both, because two
   of the eight hues are close and colour alone would fail colour-blind users.
3. **`ImageFallback` is mandatory infrastructure** — every image field in the schema is nullable, so
   a deterministic gradient-from-name is the normal case, not the error case.
4. **Motion is capped at three signature moments** (add-to-trip, budget entrance + over-budget pulse,
   copy-trip celebration); everything else uses one shared preset kit, and all of it collapses under
   `prefers-reduced-motion`.
5. **Two corrections to the brief, from checking it against the live API**: the budget donut needs
   **5** segments (the API returns `other`), and the timeline needs an **`EmptyDayRow`** because
   `/itinerary` deliberately returns gap days as `stop: null`.

Proceeding on this unless objected to.
