"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Mode A chart: muted, gridded, no entrance animation. The consumer budget
 * screen is where motion earns its place — an admin reading a table does not
 * want the numbers to move.
 */
export function TripsOverTimeChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="tripsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--foreground-subtle)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 12, fill: "var(--foreground-subtle)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 13,
              boxShadow: "var(--shadow)",
            }}
            labelStyle={{ fontWeight: 600 }}
            formatter={(value) => `${value} trips`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#tripsFill)"
            isAnimationActive={false}
            dot={{ r: 3, fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
