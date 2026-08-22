import { BUDGET_COLORS, BUDGET_SEGMENTS } from "@/config/category-colors";
import { formatMoney } from "@/lib/format";
import type { Budget } from "@/lib/budget";

/**
 * Read-only budget summary for the public page — totals only, no expense
 * editing (docs/SPEC.md S11).
 *
 * Deliberately a server component with a CSS-only bar chart rather than the
 * recharts donut: the public page is the first thing a logged-out visitor sees,
 * and it should not ship a charting library to render five numbers.
 */
export function PublicBudgetSummary({ budget }: { budget: Budget }) {
  const { grand } = budget.totals;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h3 className="text-base font-semibold">Trip budget</h3>

      <p className="tnum mt-2 text-3xl font-bold text-primary">{formatMoney(grand)}</p>
      <p className="text-[13px] text-foreground-subtle">
        {formatMoney(budget.avgPerDay)} average per day · {budget.nights}{" "}
        {budget.nights === 1 ? "night" : "nights"}
      </p>

      {grand > 0 && (
        <>
          {/* Proportional stacked bar. Widths are percentages of a server-authored
              total — no money is re-derived here. */}
          <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            {BUDGET_SEGMENTS.map((s) => {
              const value = budget.totals[s.key];
              if (value <= 0) return null;
              return (
                <div
                  key={s.key}
                  style={{
                    width: `${(value / grand) * 100}%`,
                    backgroundColor: BUDGET_COLORS[s.key],
                  }}
                  title={`${s.label}: ${formatMoney(value)}`}
                />
              );
            })}
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {BUDGET_SEGMENTS.filter((s) => budget.totals[s.key] > 0).map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-[13px]">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: BUDGET_COLORS[s.key] }}
                />
                <span className="flex-1 text-foreground-muted">{s.label}</span>
                <span className="tnum font-semibold">{formatMoney(budget.totals[s.key])}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
