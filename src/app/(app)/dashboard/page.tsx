import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Compass, Wallet, Map, Heart, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { TripCard } from "@/components/trip-card";
import { CityCard } from "@/components/city-card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { tripStatus, daysUntil } from "@/lib/trip-status";
import { computeBudget } from "@/lib/budget";
import type { TripCard as TripCardData, CityRow } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

// S2 — docs/SPEC.md. Rendered on the server so the dashboard has no loading
// flash. Reads the same tables /api/dashboard does; all money still comes from
// the shared server budget engine, never computed here.
export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as { id: string; name: string };
  const firstName = user.name?.split(" ")[0] ?? "traveller";

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "asc" },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          city: true,
          items: { include: { activity: true } },
          expenses: true,
        },
      },
    },
  });

  const toCard = (t: (typeof trips)[number]): TripCardData => {
    const budget = computeBudget(t);
    return {
      id: t.id,
      name: t.name,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      coverPhotoUrl: t.coverPhotoUrl,
      status: tripStatus(t.startDate, t.endDate),
      stopCount: t.stops.length,
      firstCityImage: t.stops[0]?.city.imageUrl ?? null,
      firstCityName: t.stops[0]?.city.name ?? null,
      totalCost: budget.totals.grand,
      budgetTotal: t.budgetTotal ? Number(t.budgetTotal) : null,
      isPublic: t.isPublic,
    };
  };

  const cards = trips.map(toCard);
  const upcoming = trips
    .filter((t) => tripStatus(t.startDate, t.endDate) === "upcoming")
    .slice(0, 3);

  // Budget highlights: the ongoing trip if there is one, else the next upcoming.
  const focusTrip =
    trips.find((t) => tripStatus(t.startDate, t.endDate) === "ongoing") ?? upcoming[0] ?? null;
  const focusBudget = focusTrip ? computeBudget(focusTrip) : null;

  const visitedCityIds = new Set(trips.flatMap((t) => t.stops.map((s) => s.cityId)));
  const recommended = (await prisma.city.findMany({
    where: { id: { notIn: [...visitedCityIds] } },
    orderBy: { popularity: "desc" },
    take: 4,
    include: { _count: { select: { activities: true } } },
  })) as unknown as CityRow[];

  const savedCount = await prisma.savedDestination.count({ where: { userId: user.id } });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}`}
        description={
          cards.length
            ? "Here is what is coming up and where your budget stands."
            : "Your upcoming trips, recommendations and budget highlights land here."
        }
        action={
          <Button asChild>
            <Link href="/trips/new">
              <Plus />
              Plan New Trip
            </Link>
          </Button>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing planned yet"
          description="Create your first trip and start adding city stops — the itinerary, budget and share link all build from there."
          action={
            <Button asChild size="lg">
              <Link href="/trips/new">
                <Plus />
                Plan your first trip
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Map} label="Trips planned" value={cards.length} />
            <StatCard
              icon={Wallet}
              label={focusTrip ? "Cost so far" : "Total planned"}
              value={formatMoney(focusBudget?.totals.grand ?? 0)}
              hint={focusTrip?.name}
              tone={focusBudget?.overBudget ? "danger" : "default"}
            />
            <StatCard
              icon={AlertTriangle}
              label="Over-budget days"
              value={focusBudget?.overBudgetDays ?? 0}
              tone={
                focusBudget?.overBudgetDays ? "danger" : "success"
              }
              hint={focusBudget?.budgetTotal ? undefined : "Set a budget to track this"}
            />
            <StatCard icon={Heart} label="Saved destinations" value={savedCount} />
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight">Upcoming trips</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((t) => (
                  <TripCard
                    key={t.id}
                    trip={toCard(t)}
                    daysUntil={daysUntil(t.startDate)}
                  />
                ))}
              </div>
            </section>
          )}

          {recommended.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">Recommended destinations</h2>
                <Button asChild variant="link" size="sm">
                  <Link href="/cities">Explore all</Link>
                </Button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((c) => (
                  <CityCard key={c.id} city={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
