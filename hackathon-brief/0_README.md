# GlobeTrotter Hackathon Kit — Read Me First

**Statement:** GlobeTrotter — personalized multi-city travel planner · **Team:** Dev A (backend, lean) · Dev B (frontend, the bigger share) · 8 hrs · No pre-built template (scaffold inside W0) · Next.js + Prisma + Neon + Auth.js + shadcn/ui + framer-motion + @dnd-kit

| File | When | Who |
|---|---|---|
| `1_TEAM_PLAN.md` | Open all day | Both — waves, hour-by-hour, demo path, scope tiers, git rules, checklist |
| `3_HACKATHON_PROMPT_BACKEND.md` | 0:00 | Dev A's Claude Code + GlobeTrotter.pdf + `starter-files/` |
| `4_HACKATHON_PROMPT_FRONTEND.md` | 0:00 (research needs no repo) | Dev B's Claude Code + GlobeTrotter.pdf |
| `starter-files/` | Consumed in W0 | Pre-written auth/DB/API-pattern code (see its README) |

## Pre-approved decisions baked into the prompts (override in Phase 0 review if you disagree)
Roles = USER/ADMIN only (screen 13 is the only admin surface, marked Optional in the PDF) · **no external travel APIs — a rich seeded city/activity catalog is the data source** · trip status (upcoming/ongoing/past) derived from dates, no enum · budget math fully server-side (activities from itinerary items; transport/stay/meals from an Expense model) · public sharing via unguessable slug at `/p/[slug]` whitelisted in middleware · Copy Trip = deep clone · cover photos/proof images as base64 ≤2 MB in Postgres · drag-reorder via @dnd-kit with arrow-button fallback · dual-personality UI: consumer Mode B everywhere, analytical Mode A for admin only.
