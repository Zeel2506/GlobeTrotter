// Display formatting only. This file never computes money — every total,
// average and over-budget flag arrives already computed from the API
// (docs/SPEC.md §4, DESIGN_SYSTEM.md §10 rule 1).

// en-IN gives the lakh/crore grouping (1,23,456) that Indian users expect —
// en-US with an INR symbol would render 123,456 and read as foreign.
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const moneyPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | null | undefined, precise = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return precise ? moneyPrecise.format(value) : money.format(value);
}

/** Dates from the API are ISO calendar days pinned to UTC midnight (DECISIONS D-03).
 *  Formatting must stay in UTC or a user east of GMT sees the previous day. */
export function formatDate(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...opts,
  }).format(d);
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth();
  if (sameMonth) {
    return `${s.getUTCDate()}–${e.getUTCDate()} ${formatDate(e, { day: undefined, month: "short", year: "numeric" })}`;
  }
  return `${formatDate(s)} – ${formatDate(e, { year: "numeric" })}`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

/** "in 12 days" / "today" / "ended". `daysUntil` comes from the API. */
export function formatCountdown(daysUntil: number): string {
  if (daysUntil === 0) return "Starts today";
  if (daysUntil === 1) return "Starts tomorrow";
  if (daysUntil > 0) return `In ${daysUntil} days`;
  return "Started";
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
