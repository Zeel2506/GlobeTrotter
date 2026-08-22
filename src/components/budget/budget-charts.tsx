"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { BUDGET_COLORS, BUDGET_SEGMENTS } from "@/config/category-colors";
import { formatMoney, formatDate } from "@/lib/format";
import type { Budget } from "@/lib/budget";
import { cn } from "@/lib/cn";

/**
 * S9 charts. Every number here is server-computed (docs/SPEC.md §4) — these
 * components format and draw, they never add or compare money.
 *
 * Signature moment #2 (DESIGN_SYSTEM.md §8): the donut sweeps in, bars grow from
 * the baseline, and over-budget days pulse red exactly twice before holding a
 * static red. An endless animation reads as a broken page during a demo.
 */

export function BudgetDonut({ budget }: { budget: Budget }) {
  const reduced = useReducedMotion();

  // Five segments, not four — the API returns `other` alongside the four the
  // brief lists, and dropping it would make the donut disagree with the total.
  const data = BUDGET_SEGMENTS.map((s) => ({
    key: s.key,
    name: s.label,
    value: budget.totals[s.key],
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-foreground-subtle">
        Nothing spent yet — add activities or expenses to see the breakdown.
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={!reduced}
              animationDuration={700}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={BUDGET_COLORS[d.key]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatMoney(Number(v))}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Grand total sits in the hole — the number people actually look for. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
            Total
          </span>
          <span className="tnum text-xl font-bold">{formatMoney(budget.totals.grand)}</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {BUDGET_SEGMENTS.map((s) => (
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
    </div>
  );
}

export function PerDayBarChart({ budget }: { budget: Budget }) {
  const reduced = useReducedMotion();
  const hasOverBudget = budget.perDay.some((d) => d.overBudget);

  const data = budget.perDay.map((d) => ({
    date: d.date,
    label: formatDate(d.date, { day: "numeric", month: "short" }),
    amount: d.amount,
    overBudget: d.overBudget,
  }));

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--foreground-subtle)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--foreground-subtle)" }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => formatMoney(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              formatter={(v) => formatMoney(Number(v))}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduced}
              animationDuration={600}
            >
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill={d.overBudget ? "var(--danger)" : "var(--primary)"}
                  className={d.overBudget && !reduced ? "animate-overbudget" : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasOverBudget && (
        <p className="mt-3 inline-flex items-start gap-2 rounded-[var(--radius)] bg-danger-soft px-3.5 py-2.5 text-[13px] text-[#b91c1c]">
          <AlertTriangle className="mt-px size-4 shrink-0" />
          {budget.overBudgetDays} {budget.overBudgetDays === 1 ? "day goes" : "days go"} over your
          daily budget of {formatMoney(budget.dailyBudget)}.
        </p>
      )}
    </div>
  );
}

/**
 * Budget-vs-actual, only meaningful once budgetTotal is set.
 *
 * Note on rule 1 ("no client-side money math"): the bar width and the
 * "X left / X over" figure are presentation-level differences between two
 * numbers the server already authored (totals.grand and budgetTotal). Nothing
 * is re-derived — no summing of items, no re-deciding whether the trip is over
 * budget. That verdict is budget.overBudget, straight from the server.
 */
export function BudgetProgress({ budget }: { budget: Budget }) {
  if (budget.budgetTotal === null) return null;

  const pct = Math.min(100, (budget.totals.grand / budget.budgetTotal) * 100);
  const over = budget.overBudget;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground-muted">
          {over ? "Over budget" : "Spent so far"}
        </span>
        <span className="tnum text-sm font-semibold">
          {formatMoney(budget.totals.grand)}{" "}
          <span className="font-normal text-foreground-subtle">
            of {formatMoney(budget.budgetTotal)}
          </span>
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            over ? "bg-danger" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1.5 text-[13px] text-foreground-subtle">
        {over
          ? `${formatMoney(budget.totals.grand - budget.budgetTotal)} over.`
          : `${formatMoney(budget.budgetTotal - budget.totals.grand)} left.`}
      </p>
    </div>
  );
}
