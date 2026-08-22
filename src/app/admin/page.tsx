import type { Metadata } from "next";
import { Users, Map as MapIcon, Globe2, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "./header";
import { TripsOverTimeChart } from "./analytics-charts";
import { BlurFade } from "@/components/motion/blur-fade";
import { CountUp } from "@/components/motion/count-up";
import { round2 } from "@/lib/validators";

export const metadata: Metadata = { title: "Analytics · Admin" };

// S13 — docs/SPEC.md. Same numbers as GET /api/admin/analytics, read directly
// here so the page server-renders in one pass. The CSV buttons still hit the API.
export const dynamic = "force-dynamic";

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return {
      label: start.toLocaleString("en", { month: "short", timeZone: "UTC" }),
      start,
      end,
    };
  });
}

export default async function AdminAnalyticsPage() {
  const months = lastSixMonths();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  const [totalUsers, activeUsers, newThisMonth, totalTrips, publicTrips, perMonth, topCityRows, topActivityRows] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { isPublic: true } }),
      Promise.all(
        months.map((m) => prisma.trip.count({ where: { createdAt: { gte: m.start, lt: m.end } } })),
      ),
      prisma.stop.groupBy({
        by: ["cityId"],
        _count: { cityId: true },
        orderBy: { _count: { cityId: "desc" } },
        take: 8,
      }),
      prisma.itineraryItem.groupBy({
        by: ["activityId"],
        _count: { activityId: true },
        orderBy: { _count: { activityId: "desc" } },
        take: 8,
      }),
    ]);

  const [cities, activities] = await Promise.all([
    prisma.city.findMany({
      where: { id: { in: topCityRows.map((r) => r.cityId) } },
      select: { id: true, name: true, country: true, region: true },
    }),
    prisma.activity.findMany({
      where: { id: { in: topActivityRows.map((r) => r.activityId) } },
      select: { id: true, name: true, category: true, city: { select: { name: true } } },
    }),
  ]);

  const cityById = new Map(cities.map((c) => [c.id, c]));
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const topCities = topCityRows.flatMap((r) => {
    const c = cityById.get(r.cityId);
    return c ? [{ ...c, stopCount: r._count.cityId }] : [];
  });

  const topActivities = topActivityRows.flatMap((r) => {
    const a = activityById.get(r.activityId);
    return a ? [{ ...a, itemCount: r._count.activityId }] : [];
  });

  const series = months.map((m, i) => ({ label: m.label, count: perMonth[i] }));
  const maxStops = Math.max(1, ...topCities.map((c) => c.stopCount));
  const maxItems = Math.max(1, ...topActivities.map((a) => a.itemCount));

  const stats = [
    { icon: Users, label: "Total users", value: totalUsers, hint: `${activeUsers} active` },
    { icon: TrendingUp, label: "New this month", value: newThisMonth, hint: "signups" },
    { icon: MapIcon, label: "Trips created", value: totalTrips, hint: `${publicTrips} shared publicly` },
    {
      icon: Globe2,
      label: "Trips per user",
      value: totalUsers > 0 ? round2(totalTrips / totalUsers) : 0,
      hint: "average",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader
        title="Analytics"
        description="Platform adoption, the destinations people actually plan, and what they book."
        csvHref="/api/admin/analytics?format=csv&table=trips"
        csvLabel="Export trips CSV"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <BlurFade key={s.label} delay={i * 0.06} yOffset={10}>
            <div className="group relative h-full overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-4 transition-all duration-[var(--dur)] hover:border-border-strong hover:shadow-[var(--shadow)]">
              {/* A hairline that fills in from the left on hover. Mode A gets one
                  restrained signal that a tile is interactive, not a lift. */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[var(--dur)] ease-[var(--ease)] group-hover:scale-x-100"
              />
              <div className="flex items-center gap-2 text-foreground-subtle">
                <s.icon className="size-3.5" />
                <span className="text-[12px] font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="tnum mt-1.5 text-[26px] font-bold leading-none">
                <CountUp to={Number(s.value)} duration={1.1} />
              </p>
              <p className="mt-1 text-[12px] text-foreground-subtle">{s.hint}</p>
            </div>
          </BlurFade>
        ))}
      </div>

      <div className="mt-4 rounded-[var(--radius)] border border-border bg-surface p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Trips created</h2>
          <span className="text-[12px] text-foreground-subtle">Last 6 months</span>
        </div>
        <TripsOverTimeChart data={series} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankTable
          title="Top destinations"
          subtitle="By trip stops"
          csvHref="/api/admin/analytics?format=csv&table=cities"
          rows={topCities.map((c) => ({
            key: c.id,
            primary: c.name,
            secondary: `${c.country} · ${c.region}`,
            value: c.stopCount,
            pct: (c.stopCount / maxStops) * 100,
          }))}
        />
        <RankTable
          title="Top activities"
          subtitle="By times scheduled"
          csvHref="/api/admin/analytics?format=csv&table=activities"
          rows={topActivities.map((a) => ({
            key: a.id,
            primary: a.name,
            secondary: `${a.city.name} · ${a.category.toLowerCase()}`,
            value: a.itemCount,
            pct: (a.itemCount / maxItems) * 100,
          }))}
        />
      </div>
    </div>
  );
}

/** Dense ranked table with an inline bar — Mode A's substitute for a chart. */
function RankTable({
  title,
  subtitle,
  csvHref,
  rows,
}: {
  title: string;
  subtitle: string;
  csvHref: string;
  rows: { key: string; primary: string; secondary: string; value: number; pct: number }[];
}) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <p className="text-[12px] text-foreground-subtle">{subtitle}</p>
        </div>
        <a
          href={csvHref}
          className="text-[12px] font-medium text-primary underline-offset-2 hover:underline"
        >
          CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-foreground-subtle">No data yet.</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className="relative flex items-center gap-3 border-b border-border/60 py-2 last:border-0"
            >
              <span className="tnum w-5 shrink-0 text-[12px] text-foreground-subtle">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{r.primary}</p>
                <p className="truncate text-[12px] text-foreground-subtle">{r.secondary}</p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
              <span className="tnum shrink-0 text-[13px] font-semibold">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
