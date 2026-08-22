// The one runnable check behind the money and date logic — the two places where
// a silent bug costs the user real numbers on screen.
//
//   npm run check
//
// Pure functions only, no database: this is meant to run in a second.
import assert from "node:assert/strict";
import { computeBudget, effectiveCost, type BudgetSource } from "../src/lib/budget";
import { toUtcDay, dayKey, nightsBetween, eachUtcDay, daysBetween } from "../src/lib/dates";
import { tripStatus } from "../src/lib/trip-status";
import { round2 } from "../src/lib/validators";

const d = (s: string) => toUtcDay(s);

// ── dates ───────────────────────────────────────────────────────────────────
assert.equal(dayKey(d("2026-09-01")), "2026-09-01", "a date string round-trips unchanged");
assert.equal(
  dayKey(toUtcDay(new Date("2026-09-01T22:30:00+05:30"))),
  "2026-09-01",
  "an evening instant in IST stays on its own calendar day",
);
assert.equal(daysBetween(d("2026-09-01"), d("2026-09-05")), 4);
assert.equal(eachUtcDay(d("2026-09-01"), d("2026-09-05")).length, 5, "day ranges are inclusive");
assert.equal(nightsBetween(d("2026-09-01"), d("2026-09-01")), 1, "a same-day trip never divides by zero");

// ── derived status ──────────────────────────────────────────────────────────
const now = d("2026-09-10");
assert.equal(tripStatus(d("2026-09-20"), d("2026-09-25"), now), "upcoming");
assert.equal(tripStatus(d("2026-09-05"), d("2026-09-15"), now), "ongoing");
assert.equal(tripStatus(d("2026-09-05"), d("2026-09-09"), now), "past");
assert.equal(tripStatus(now, now, now), "ongoing", "a trip that starts and ends today is ongoing");

// ── effective cost: the override beats the catalog price ────────────────────
assert.equal(effectiveCost({ costOverride: null, activity: { cost: 40 } }), 40);
assert.equal(effectiveCost({ costOverride: 12.5, activity: { cost: 40 } }), 12.5);
assert.equal(effectiveCost({ costOverride: 0, activity: { cost: 40 } }), 0, "a free override is not treated as unset");

// ── budget ──────────────────────────────────────────────────────────────────
const trip: BudgetSource = {
  startDate: d("2026-09-01"),
  endDate: d("2026-09-04"), // 3 nights
  budgetTotal: 300,
  stops: [
    {
      startDate: d("2026-09-01"),
      endDate: d("2026-09-04"),
      items: [
        { date: d("2026-09-01"), costOverride: null, activity: { cost: 50 } },
        { date: d("2026-09-02"), costOverride: 20, activity: { cost: 200 } },
        { date: d("2026-09-03"), costOverride: null, activity: { cost: 30 } },
      ],
      expenses: [
        { category: "STAY", amount: 90, date: null }, // undated → spread over the stop's 4 days
        { category: "TRANSPORT", amount: 60, date: d("2026-09-02") },
        { category: "MEALS", amount: 25, date: d("2026-09-04") },
        { category: "OTHER", amount: 15, date: d("2026-09-04") },
      ],
    },
  ],
};

const b = computeBudget(trip);

assert.equal(b.nights, 3);
assert.equal(b.totals.activities, 100, "50 + 20 (overridden, not 200) + 30");
assert.equal(b.totals.stay, 90);
assert.equal(b.totals.transport, 60);
assert.equal(b.totals.meals, 25);
assert.equal(b.totals.other, 15);
assert.equal(b.totals.grand, 290);
assert.equal(b.avgPerDay, round2(290 / 3));

assert.equal(b.perDay.length, 4, "every calendar day in the range is present, gaps included");
assert.equal(
  round2(b.perDay.reduce((s, p) => s + p.amount, 0)),
  b.totals.grand,
  "no money is lost between the per-day series and the grand total",
);
// The undated 90 stay is spread over the stop's 4 days (22.50 each) instead of
// landing as one meaningless spike on day 1.
assert.equal(b.perDay[0].amount, 72.5, "50 activity + 22.50 share of the stay");
assert.equal(b.perDay[1].amount, 102.5, "20 activity + 60 transport + 22.50");
assert.equal(b.perDay[3].amount, 62.5, "no activity, 25 meals + 15 other + 22.50");

// budgetTotal 300 over 3 nights → 100/day. Only day 2 clears it.
assert.equal(b.dailyBudget, 100);
assert.equal(b.perDay[0].overBudget, false);
assert.equal(b.perDay[1].overBudget, true);
assert.equal(b.overBudgetDays, 1);
assert.equal(b.overBudget, false, "290 grand is still under the 300 total");

// Without a budgetTotal there are no alerts at all.
const noBudget = computeBudget({ ...trip, budgetTotal: null });
assert.equal(noBudget.dailyBudget, null);
assert.equal(noBudget.overBudget, false);
assert.equal(noBudget.overBudgetDays, 0);

// An expense dated outside the trip still counts — it is bucketed to day one
// rather than dropped, so the totals stay honest.
const strayDate = computeBudget({
  ...trip,
  stops: [
    {
      startDate: d("2026-09-01"),
      endDate: d("2026-09-04"),
      items: [],
      expenses: [{ category: "OTHER", amount: 10, date: d("2030-01-01") }],
    },
  ],
});
assert.equal(strayDate.totals.grand, 10);
assert.equal(strayDate.perDay[0].amount, 10);

console.log("budget + date checks passed");
