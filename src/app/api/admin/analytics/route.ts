import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole, csv } from "@/lib/api-helpers";
import { round2 } from "@/lib/validators";

/** Last 6 calendar months, oldest first, as UTC month starts. */
function lastSixMonths() {
  const now = new Date();
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    months.push({
      key: start.toISOString().slice(0, 7),
      label: start.toLocaleString("en", { month: "short", year: "numeric", timeZone: "UTC" }),
      start,
      end,
    });
  }
  return months;
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireRole(["ADMIN"]);

    const months = lastSixMonths();
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

    const [totalUsers, activeUsers, newThisMonth, totalTrips, publicTrips, tripsPerMonth, topCityRows, topActivityRows] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.trip.count(),
        prisma.trip.count({ where: { isPublic: true } }),
        Promise.all(
          months.map((m) =>
            prisma.trip.count({ where: { createdAt: { gte: m.start, lt: m.end } } }),
          ),
        ),
        prisma.stop.groupBy({
          by: ["cityId"],
          _count: { cityId: true },
          orderBy: { _count: { cityId: "desc" } },
          take: 10,
        }),
        prisma.itineraryItem.groupBy({
          by: ["activityId"],
          _count: { activityId: true },
          orderBy: { _count: { activityId: "desc" } },
          take: 10,
        }),
      ]);

    // groupBy returns ids only — resolve the names in one query each, not per row.
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
      const city = cityById.get(r.cityId);
      return city
        ? [{ id: city.id, name: city.name, country: city.country, region: city.region, stopCount: r._count.cityId }]
        : [];
    });

    const topActivities = topActivityRows.flatMap((r) => {
      const a = activityById.get(r.activityId);
      return a
        ? [{ id: a.id, name: a.name, category: a.category, cityName: a.city.name, itemCount: r._count.activityId }]
        : [];
    });

    const payload = {
      userStats: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth,
        tripsPerUserAvg: totalUsers > 0 ? round2(totalTrips / totalUsers) : 0,
      },
      tripStats: { total: totalTrips, public: publicTrips },
      tripsOverTime: months.map((m, i) => ({ month: m.key, label: m.label, count: tripsPerMonth[i] })),
      topCities,
      topActivities,
    };

    // ?format=csv on the same endpoint — cheap export, no second route to keep in sync.
    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      const table = req.nextUrl.searchParams.get("table") ?? "cities";
      if (table === "activities") {
        return csv(topActivities, ["name", "cityName", "category", "itemCount"], "top-activities.csv");
      }
      if (table === "trips") {
        return csv(payload.tripsOverTime, ["month", "label", "count"], "trips-over-time.csv");
      }
      return csv(topCities, ["name", "country", "region", "stopCount"], "top-cities.csv");
    }

    return ok(payload);
  });
}
