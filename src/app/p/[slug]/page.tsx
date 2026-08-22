import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe2, CalendarDays, MapPin, Wallet, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { itineraryBySlug } from "@/lib/itinerary";
import { ImageFallback } from "@/components/image-fallback";
import { DayTimeline } from "@/components/itinerary/day-timeline";
import { PublicBudgetSummary } from "./budget-summary";
import { CopyTripButton } from "@/components/copy-trip-button";
import { UnshareBanner } from "./unshare-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange, formatMoney } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

// S11 — the shareable artifact. No session required; middleware whitelists "/p/"
// (with the trailing slash — see DECISIONS.md D-01).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const itinerary = await itineraryBySlug(slug);
  if (!itinerary) return { title: "Trip not found" };

  return {
    title: itinerary.trip.name,
    description:
      itinerary.trip.description ??
      `A ${itinerary.trip.nights}-night itinerary by ${itinerary.trip.ownerName}.`,
  };
}

export default async function PublicTripPage({ params }: Props) {
  const { slug } = await params;

  // Returns null for a private trip too, so an un-shared link 404s gracefully.
  const itinerary = await itineraryBySlug(slug);
  if (!itinerary) notFound();

  const { trip, days, budget, stops } = itinerary;

  // Read the session only to decide what the viewer can DO — the page content
  // renders identically whether or not anyone is logged in.
  const session = await auth();
  const viewer = session?.user as { id: string } | undefined;

  // The owner gets an un-share control; everyone else sees a pure read view.
  const owner = await prisma.trip.findUnique({
    where: { id: trip.id },
    select: { userId: true },
  });
  const isOwner = Boolean(viewer?.id) && owner?.userId === viewer?.id;
  const cover = trip.coverPhotoUrl ?? stops[0]?.city.imageUrl ?? null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <nav className="page-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
              <Globe2 className="size-[18px]" />
            </span>
            <span className="text-[17px] tracking-tight">GlobeTrotter</span>
          </Link>

          <div className="flex items-center gap-2">
            {viewer ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/signup">Plan your own</Link>
              </Button>
            )}
            <CopyTripButton slug={slug} signedIn={Boolean(viewer)} size="md" />
          </div>
        </nav>
      </header>

      <main className="flex-1 pb-20">
        <div className="page-shell max-w-[1120px] pt-8">
          <UnshareBanner tripId={trip.id} isOwner={isOwner} />

          <section className="relative mb-8 overflow-hidden rounded-[var(--radius-xl)] border border-border">
            <ImageFallback
              src={cover}
              name={stops[0]?.city.name ?? trip.name}
              variant="trip"
              bare
              priority
              className="aspect-[21/9] w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/85 via-[#1c1917]/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <Badge variant="primary" className="mb-3">
                Shared itinerary
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{trip.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-4" />
                  {trip.ownerName}
                </span>
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

          {trip.description && (
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-foreground-muted">
              {trip.description}
            </p>
          )}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h2 className="mb-5 text-xl font-bold tracking-tight">Day by day</h2>
              <DayTimeline days={days} />
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <PublicBudgetSummary budget={budget} />

              <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-center">
                <p className="text-sm font-semibold">Like this itinerary?</p>
                <p className="mt-1 text-[13px] text-foreground-muted">
                  Copy it into your own account and make it yours.
                </p>
                <div className="mt-4">
                  <CopyTripButton slug={slug} signedIn={Boolean(viewer)} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="page-shell flex flex-col items-center justify-between gap-3 py-8 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <Globe2 className="size-3.5" />
            </span>
            GlobeTrotter
          </Link>
          <p className="text-[13px] text-foreground-subtle">
            Plan and share your own multi-city trip.
          </p>
        </div>
      </footer>
    </>
  );
}
