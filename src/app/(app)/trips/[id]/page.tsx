import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Wallet, CalendarDays, MapPin } from "lucide-react";
import { auth } from "@/auth";
import { itineraryById } from "@/lib/itinerary";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ImageFallback } from "@/components/image-fallback";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItineraryViews } from "./itinerary-views";
import { ShareDialog } from "@/components/share-dialog";
import { formatDateRange, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Itinerary" };

// S6 + S10 — docs/SPEC.md. The polished read view. Same payload powers the
// timeline, the calendar and the public page.
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as { id: string; name: string; email: string; role: string };

  // Other people's trips 404 rather than 403 so ids are not enumerable (D-10).
  const owner = await prisma.trip.findUnique({ where: { id }, select: { userId: true } });
  if (!owner || !canAccess(owner.userId, user)) notFound();

  const itinerary = await itineraryById(id);
  if (!itinerary) notFound();

  const { trip, days, budget, stops } = itinerary;
  const cover = trip.coverPhotoUrl ?? stops[0]?.city.imageUrl ?? null;

  return (
    <div className="page-shell max-w-[1120px]">
      <section className="relative mb-8 overflow-hidden rounded-[var(--radius-xl)] border border-border">
        <ImageFallback
          src={cover}
          name={stops[0]?.city.name ?? trip.name}
          variant="trip"
          bare
          className="aspect-[21/9] w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/80 via-[#1c1917]/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={trip.status} />
            {trip.isPublic && <Badge variant="primary">Shared publicly</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trip.name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {stops.length} {stops.length === 1 ? "stop" : "stops"}
            </span>
            <span className="tnum inline-flex items-center gap-1.5 font-semibold">
              <Wallet className="size-4" />
              {formatMoney(budget.totals.grand)}
            </span>
          </p>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/trips/${trip.id}/build`}>
              <Pencil />
              Edit itinerary
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/trips/${trip.id}/budget`}>
              <Wallet />
              Budget
            </Link>
          </Button>
        </div>
        <ShareDialog
          tripId={trip.id}
          tripName={trip.name}
          isPublic={trip.isPublic}
          publicSlug={trip.publicSlug}
        />
      </div>

      {trip.description && (
        <p className="mb-8 max-w-2xl leading-relaxed text-foreground-muted">{trip.description}</p>
      )}

      <ItineraryViews days={days} />
    </div>
  );
}
