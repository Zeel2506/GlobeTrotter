import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole } from "@/lib/api-helpers";
import { tripCardInclude, toTripCards } from "@/lib/trips";
import { tripBudget } from "@/lib/budget";
import { todayUtc } from "@/lib/dates";
import { daysUntil } from "@/lib/trip-status";

/** Welcome payload for the home screen — one request, everything above the fold. */
export async function GET() {
  return handle(async () => {
    const { user } = await requireRole();
    const now = todayUtc();

    const [me, upcomingTrips, recentTrips, activeTrip, visitedCityIds, counts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, photoUrl: true },
      }),
      prisma.trip.findMany({
        where: { userId: user.id, startDate: { gt: now } },
        include: tripCardInclude,
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      prisma.trip.findMany({
        where: { userId: user.id },
        include: tripCardInclude,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Budget highlights follow the trip you are on now; if none, the next one.
      prisma.trip.findFirst({
        where: { userId: user.id, endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        select: { id: true, name: true },
      }),
      prisma.stop.findMany({
        where: { trip: { userId: user.id } },
        select: { cityId: true },
        distinct: ["cityId"],
      }),
      prisma.$transaction([
        prisma.trip.count({ where: { userId: user.id } }),
        prisma.city.count(),
        prisma.savedDestination.count({ where: { userId: user.id } }),
      ]),
    ]);

    // Recommend popular cities the user has not already planned a stop in —
    // suggesting somewhere they are already going is not a recommendation.
    const recommended = await prisma.city.findMany({
      where: { id: { notIn: visitedCityIds.map((c) => c.cityId) } },
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        country: true,
        region: true,
        costIndex: true,
        popularity: true,
        imageUrl: true,
        description: true,
        _count: { select: { activities: true } },
      },
    });

    const [upcoming, recent] = await Promise.all([
      toTripCards(upcomingTrips),
      toTripCards(recentTrips),
    ]);

    const budget = activeTrip ? await tripBudget(activeTrip.id) : null;

    return ok({
      user: { name: me?.name ?? user.name, photoUrl: me?.photoUrl ?? null },
      upcoming: upcoming.map((t) => ({ ...t, daysUntil: daysUntil(t.startDate, now) })),
      recommended,
      budgetHighlights:
        activeTrip && budget
          ? {
              tripId: activeTrip.id,
              tripName: activeTrip.name,
              grand: budget.totals.grand,
              budgetTotal: budget.budgetTotal,
              overBudget: budget.overBudget,
              overBudgetDays: budget.overBudgetDays,
              avgPerDay: budget.avgPerDay,
            }
          : null,
      recent,
      counts: { trips: counts[0], cities: counts[1], savedDestinations: counts[2] },
    });
  });
}
