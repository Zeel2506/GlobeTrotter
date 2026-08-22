// The single source of truth for trip money. Every figure the budget screen,
// the itinerary day totals and the public page show comes from here — the
// frontend never adds anything up itself (docs/SPEC.md §4).
import { prisma } from "@/lib/prisma";
import { dayKey, eachUtcDay, nightsBetween, toUtcDay } from "@/lib/dates";
import { num, numOrNull, round2 } from "@/lib/validators";

export type BudgetTotals = {
  transport: number;
  stay: number;
  activities: number;
  meals: number;
  other: number;
  grand: number;
};

export type BudgetDay = { date: string; amount: number; overBudget: boolean };

export type Budget = {
  totals: BudgetTotals;
  avgPerDay: number;
  nights: number;
  budgetTotal: number | null;
  dailyBudget: number | null;
  overBudget: boolean;
  overBudgetDays: number;
  perDay: BudgetDay[];
};

/** The rows the budget needs. Loaded once and reused by the itinerary builder. */
export type BudgetSource = {
  startDate: Date;
  endDate: Date;
  budgetTotal: unknown;
  stops: {
    startDate: Date;
    endDate: Date;
    items: { date: Date; costOverride: unknown; activity: { cost: unknown } }[];
    expenses: { category: string; amount: unknown; date: Date | null }[];
  }[];
};

export const budgetInclude = {
  stops: {
    select: {
      startDate: true,
      endDate: true,
      items: { select: { date: true, costOverride: true, activity: { select: { cost: true } } } },
      expenses: { select: { category: true, amount: true, date: true } },
    },
  },
} as const;

/** Effective cost of a scheduled activity: the per-trip override wins over the catalog price. */
export function effectiveCost(item: { costOverride: unknown; activity: { cost: unknown } }): number {
  return num((item.costOverride ?? item.activity.cost) as never);
}

export function computeBudget(trip: BudgetSource): Budget {
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const budgetTotal = numOrNull(trip.budgetTotal as never);

  const totals: BudgetTotals = {
    transport: 0,
    stay: 0,
    activities: 0,
    meals: 0,
    other: 0,
    grand: 0,
  };

  // Bucket by calendar day. Every day in the range is present so the chart has
  // no holes, and nothing is ever dropped — sum(perDay) === totals.grand always.
  const buckets = new Map<string, number>(eachUtcDay(trip.startDate, trip.endDate).map((d) => [dayKey(d), 0]));
  const firstDay = dayKey(toUtcDay(trip.startDate));
  const addToDay = (key: string, amount: number) => {
    const target = buckets.has(key) ? key : firstDay;
    buckets.set(target, (buckets.get(target) ?? 0) + amount);
  };

  for (const stop of trip.stops) {
    for (const item of stop.items) {
      const cost = effectiveCost(item);
      totals.activities += cost;
      addToDay(dayKey(toUtcDay(item.date)), cost);
    }

    // An undated expense is one that covers the whole stop — "hotel, 4 nights",
    // "groceries for the week". Spreading it evenly across the stop's days is
    // what the traveller actually spent per day; dumping the lump on day one
    // produced a single meaningless spike and flagged it as over budget
    // (docs/DECISIONS.md D-06).
    const stopDays = eachUtcDay(stop.startDate, stop.endDate).map(dayKey);
    const spread = stopDays.length > 0 ? stopDays : [firstDay];

    for (const expense of stop.expenses) {
      const amount = num(expense.amount as never);
      switch (expense.category) {
        case "TRANSPORT":
          totals.transport += amount;
          break;
        case "STAY":
          totals.stay += amount;
          break;
        case "MEALS":
          totals.meals += amount;
          break;
        default:
          totals.other += amount;
      }

      if (expense.date) {
        addToDay(dayKey(toUtcDay(expense.date)), amount);
      } else {
        const share = amount / spread.length;
        for (const key of spread) addToDay(key, share);
      }
    }
  }

  totals.grand =
    totals.transport + totals.stay + totals.activities + totals.meals + totals.other;
  for (const k of Object.keys(totals) as (keyof BudgetTotals)[]) totals[k] = round2(totals[k]);

  const dailyBudget = budgetTotal === null ? null : round2(budgetTotal / nights);

  const perDay: BudgetDay[] = [...buckets.entries()].map(([date, amount]) => ({
    date,
    amount: round2(amount),
    overBudget: dailyBudget !== null && round2(amount) > dailyBudget,
  }));

  return {
    totals,
    avgPerDay: round2(totals.grand / nights),
    nights,
    budgetTotal,
    dailyBudget,
    overBudget: budgetTotal !== null && totals.grand > budgetTotal,
    overBudgetDays: perDay.filter((d) => d.overBudget).length,
    perDay,
  };
}

/** Load + compute in one call, for routes that only need the budget. */
export async function tripBudget(tripId: string): Promise<Budget> {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { startDate: true, endDate: true, budgetTotal: true, ...budgetInclude },
  });
  return computeBudget(trip);
}
