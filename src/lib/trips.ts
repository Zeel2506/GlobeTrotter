// Trip list/card shaping, shared by /api/trips and /api/dashboard so the card a
// user sees on My Trips and the one on the dashboard can never drift apart.
import { prisma } from "@/lib/prisma";
import { tripStatus, type TripStatus } from "@/lib/trip-status";
import { num, round2 } from "@/lib/validators";

export type TripCard = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  coverPhotoUrl: string | null;
  budgetTotal: number | null;
  isPublic: boolean;
  publicSlug: string | null;
  status: TripStatus;
  stopCount: number;
  firstCityName: string | null;
  firstCityImage: string | null;
  cities: string[];
  totalCost: number;
};

/** The include every trip-card query uses. */
export const tripCardInclude = {
  stops: {
    orderBy: { order: "asc" },
    select: { id: true, city: { select: { name: true, imageUrl: true } } },
  },
} as const;

type TripWithStops = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  coverPhotoUrl: string | null;
  budgetTotal: unknown;
  isPublic: boolean;
  publicSlug: string | null;
  stops: { id: string; city: { name: string; imageUrl: string | null } }[];
};

/**
 * Total cost for many trips in two queries instead of N+1 — one groupBy over
 * itinerary items, one over expenses, both keyed by stop id.
 */
export async function totalsByTrip(trips: TripWithStops[]): Promise<Map<string, number>> {
  const stopIds = trips.flatMap((t) => t.stops.map((s) => s.id));
  const totals = new Map<string, number>(trips.map((t) => [t.id, 0]));
  if (stopIds.length === 0) return totals;

  const tripOfStop = new Map<string, string>();
  for (const t of trips) for (const s of t.stops) tripOfStop.set(s.id, t.id);

  const [items, expenses] = await Promise.all([
    prisma.itineraryItem.findMany({
      where: { stopId: { in: stopIds } },
      select: { stopId: true, costOverride: true, activity: { select: { cost: true } } },
    }),
    prisma.expense.groupBy({
      by: ["stopId"],
      where: { stopId: { in: stopIds } },
      _sum: { amount: true },
    }),
  ]);

  const add = (stopId: string, amount: number) => {
    const tripId = tripOfStop.get(stopId);
    if (tripId) totals.set(tripId, (totals.get(tripId) ?? 0) + amount);
  };

  for (const i of items) add(i.stopId, num(i.costOverride ?? i.activity.cost));
  for (const e of expenses) add(e.stopId, num(e._sum.amount));

  for (const [k, v] of totals) totals.set(k, round2(v));
  return totals;
}

export function toTripCard(trip: TripWithStops, totalCost: number): TripCard {
  const first = trip.stops[0]?.city ?? null;
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverPhotoUrl: trip.coverPhotoUrl,
    budgetTotal: trip.budgetTotal === null || trip.budgetTotal === undefined
      ? null
      : Number(String(trip.budgetTotal)),
    isPublic: trip.isPublic,
    publicSlug: trip.publicSlug,
    status: tripStatus(trip.startDate, trip.endDate),
    stopCount: trip.stops.length,
    firstCityName: first?.name ?? null,
    firstCityImage: first?.imageUrl ?? null,
    cities: trip.stops.map((s) => s.city.name),
    totalCost,
  };
}

/** Fetch + shape in one call — the whole point of this module. */
export async function toTripCards(trips: TripWithStops[]): Promise<TripCard[]> {
  const totals = await totalsByTrip(trips);
  return trips.map((t) => toTripCard(t, totals.get(t.id) ?? 0));
}
