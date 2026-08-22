// Trip status is DERIVED from dates, never stored (docs/SPEC.md §3).
import { todayUtc, toUtcDay, daysBetween } from "@/lib/dates";

export type TripStatus = "upcoming" | "ongoing" | "past";

export function tripStatus(startDate: Date, endDate: Date, now = todayUtc()): TripStatus {
  const start = toUtcDay(startDate);
  const end = toUtcDay(endDate);
  if (start > now) return "upcoming";
  if (end < now) return "past";
  return "ongoing";
}

/** Days until departure; 0 once the trip has started. */
export function daysUntil(startDate: Date, now = todayUtc()): number {
  return Math.max(0, daysBetween(now, startDate));
}

/**
 * Prisma `where` fragment for ?filter=. Kept next to tripStatus() so the SQL
 * filter and the computed badge can never disagree.
 */
export function statusWhere(filter: string | undefined, now = todayUtc()) {
  switch (filter) {
    case "upcoming":
      return { startDate: { gt: now } };
    case "ongoing":
      return { startDate: { lte: now }, endDate: { gte: now } };
    case "past":
      return { endDate: { lt: now } };
    default:
      return {};
  }
}
