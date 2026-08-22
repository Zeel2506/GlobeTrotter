// Calendar-day helpers. Trip/stop/item dates are *days*, not instants, so every
// one of them is pinned to UTC midnight on the way in and compared date-only on
// the way out. Without this a user in IST creating a trip on "1 Sep" stores
// 31 Aug 18:30Z and the derived upcoming/ongoing/past filter drifts a day.
// See docs/DECISIONS.md D-03.

/** "2026-09-01" or a Date → that calendar day at 00:00:00.000 UTC. */
export function toUtcDay(input: string | Date): Date {
  if (typeof input === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Today as a UTC calendar day — the reference point for derived trip status. */
export function todayUtc(): Date {
  return toUtcDay(new Date());
}

/** "2026-09-01" — the stable key used to bucket items and expenses by day. */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MS_PER_DAY = 86_400_000;

/** Whole days between two calendar days (b - a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((toUtcDay(b).getTime() - toUtcDay(a).getTime()) / MS_PER_DAY);
}

/** Every calendar day from start to end, inclusive. */
export function eachUtcDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let t = toUtcDay(start).getTime(); t <= toUtcDay(end).getTime(); t += MS_PER_DAY) {
    days.push(new Date(t));
  }
  return days;
}

/**
 * Nights in a trip. A same-day trip still counts as 1 so per-day averages and
 * the daily budget never divide by zero.
 */
export function nightsBetween(start: Date, end: Date): number {
  return Math.max(1, daysBetween(start, end));
}

export function addDays(d: Date, n: number): Date {
  return new Date(toUtcDay(d).getTime() + n * MS_PER_DAY);
}
