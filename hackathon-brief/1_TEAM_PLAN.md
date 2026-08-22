# TEAM PLAN — GlobeTrotter (8 hrs, 2 devs, no pre-built template)

**Dev A = Schema + Backend (lean — done by ~H4, then support)** · **Dev B = Frontend (the bigger job — this product IS its frontend)**

## Waves

| Wave | Contents | Target |
|---|---|---|
| **W0+W1** | Scaffold + starter-files + schema + **catalog seed (30 cities × ~10 activities — the app's data source)** + auth (USER/ADMIN) | ~H1:15 |
| **W2** | Trips CRUD + stops + reorder, city/activity search, saved destinations, profile | ~H2:30 |
| **W3** | Itinerary items + expenses + budget engine + public sharing + copy trip | ~H4:00 |
| **W4** | Dashboard payload, admin analytics + user mgmt, CSV export, **deploy** | ~H5:00 |

## Hour-by-hour

| Time | Dev A (Backend) | Dev B (Frontend) |
|---|---|---|
| **0:00–0:20** | **TOGETHER:** Claude Code verifies the pre-baked spec against the PDF, writes SPEC + API_CONTRACT. Both approve; contract frozen. | Same. |
| **0:20–1:15** | W0+W1 (seed quality matters most — judges will search this catalog). **Push.** | Repo-free: travel-product + landing research → DESIGN_SYSTEM.md (light theme, dual personality, category colors, image-fallback system, motion budget). |
| **1:15–2:30** | W2. **Push.** | Pull → tokens, generic components, animated landing, auth, app shell. |
| **2:30–4:00** | W3 (budget engine + public routes — test `/p/[slug]` logged-out). **Push.** | Pull W2 → dashboard v1, create trip, my trips, city + activity search. |
| **4:00–5:00** | W4. **Push + deploy Vercel.** | Pull W3 → **itinerary builder** (start it the moment W3 lands — biggest screen). |
| **5:00–6:45** | QA all roles + logged-out public + deep-clone check; enrich seed; then Dev B support only. | Itinerary view (timeline ⇄ calendar), budget screen, share + public page + copy trip; then profile + admin + final dashboard. |
| **6:45–7:20** | **TOGETHER:** demo-path walkthrough on the deployed build; fix only what breaks it. | Same. |
| **7:20–8:00** | Seed reset, README, DEMO_SCRIPT.md, final deploy. | Polish: empty states, image fallbacks, mobile-responsive pass (PDF requirement), confirm dialogs, favicon. |

## THE demo path (the product; judge with it)

Signup → dashboard → Plan New Trip → City Search: add 2–3 stops with dates → Activity Search: assign activities to days → reorder stops + activities → Itinerary View: timeline, toggle calendar → Budget: category breakdown, avg/day, an over-budget day pulsing → Share public → open `/p/[slug]` in a logged-out window → log in as friend@demo → Copy Trip (celebration) → admin@demo → analytics dashboard.

## Scope tiers (pre-agreed cut order)

- **CORE (never cut):** demo path + my trips + both search screens + budget + public share/copy + mobile-not-broken.
- **STRETCH-1:** calendar view toggle (list timeline alone is acceptable), admin CSV export, saved destinations, cover-photo upload, social share buttons (copy-URL alone is fine).
- **STRETCH-2 (cut first):** admin user management (analytics view alone is fine — screen 13 is "Optional" in the PDF), language preference, delete account, activity quick-view dialogs (inline info is fine), drag-and-drop (arrow-button reorder alone is acceptable).

## Git rules

`main` only · ownership — Dev A: `prisma/`, `src/app/api/`, `src/lib/`, `src/auth*`; Dev B: pages, `src/components/`, `globals.css`, `src/config/*` · `git pull --rebase` before every push · announce waves + new deps · interrupts: demo-path breakage > Dev B blocked > all else.

## Start-of-day checklist

- [ ] Neon project + POOLED `DATABASE_URL`, `AUTH_SECRET` in both `.env`s
- [ ] Empty GitHub repo, both devs have access; Vercel linked with env vars
- [ ] Both Claude Code sessions authenticated; Dev A opens `3_...BACKEND.md`, Dev B opens `4_...FRONTEND.md`, PDF in the repo folder
