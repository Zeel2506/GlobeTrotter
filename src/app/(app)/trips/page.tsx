import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeBudget } from "@/lib/budget";
import { tripStatus } from "@/lib/trip-status";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TripsBrowser } from "./trips-browser";
import type { TripCard as TripCardData } from "@/lib/api";

export const metadata: Metadata = { title: "My Trips" };

// S4 — docs/SPEC.md. Filter tabs are derived from dates, so all trips load once
// and the tabs filter client-side; no refetch per tab.
export default async function TripsPage() {
  const session = await auth();
  const user = session!.user as { id: string };

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "desc" },
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

  const rows: TripCardData[] = trips.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    coverPhotoUrl: t.coverPhotoUrl,
    status: tripStatus(t.startDate, t.endDate),
    stopCount: t.stops.length,
    firstCityImage: t.stops[0]?.city.imageUrl ?? null,
    firstCityName: t.stops[0]?.city.name ?? null,
    totalCost: computeBudget(t).totals.grand,
    budgetTotal: t.budgetTotal ? Number(t.budgetTotal) : null,
    isPublic: t.isPublic,
  }));

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="My Trips"
        title="Your trips"
        description={
          rows.length
            ? `${rows.length} ${rows.length === 1 ? "trip" : "trips"} planned so far.`
            : "Everything you plan shows up here."
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
      <TripsBrowser trips={rows} />
    </div>
  );
}
