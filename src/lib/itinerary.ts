// One itinerary payload powers three surfaces: the timeline view, the calendar
// view and the public shared page. They render the same data, so they read the
// same shape from the same function (docs/API_CONTRACT.md W3).
import { prisma } from "@/lib/prisma";
import { computeBudget, effectiveCost, type Budget } from "@/lib/budget";
import { dayKey, eachUtcDay, nightsBetween, toUtcDay } from "@/lib/dates";
import { tripStatus, type TripStatus } from "@/lib/trip-status";
import { num, numOrNull, round2 } from "@/lib/validators";

export type ItineraryItemView = {
  id: string;
  startTime: string | null;
  notes: string | null;
  order: number;
  effectiveCost: number;
  activity: {
    id: string;
    name: string;
    category: string;
    durationHours: number;
    description: string | null;
    imageUrl: string | null;
  };
};

export type ItineraryDay = {
  date: string;
  dayNumber: number;
  stop: {
    id: string;
    notes: string | null;
    city: { id: string; name: string; country: string; imageUrl: string | null };
  } | null;
  items: ItineraryItemView[];
  dayTotal: number;
};

export type Itinerary = {
  trip: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    coverPhotoUrl: string | null;
    budgetTotal: number | null;
    isPublic: boolean;
    publicSlug: string | null;
    ownerName: string;
    status: TripStatus;
    nights: number;
  };
  stops: {
    id: string;
    order: number;
    startDate: Date;
    endDate: Date;
    notes: string | null;
    city: { id: string; name: string; country: string; imageUrl: string | null; costIndex: number };
  }[];
  days: ItineraryDay[];
  budget: Budget;
};

const itineraryInclude = {
  user: { select: { name: true } },
  stops: {
    orderBy: { order: "asc" as const },
    include: {
      city: true,
      items: {
        orderBy: [{ date: "asc" as const }, { order: "asc" as const }],
        include: { activity: true },
      },
      expenses: { select: { category: true, amount: true, date: true } },
    },
  },
};

type LoadedTrip = Awaited<ReturnType<typeof loadTrip>>;

async function loadTrip(where: { id: string } | { publicSlug: string }) {
  return prisma.trip.findUnique({ where, include: itineraryInclude });
}

export function buildItinerary(trip: NonNullable<LoadedTrip>): Itinerary {
  const days = eachUtcDay(trip.startDate, trip.endDate);

  // A stop may overlap another on a travel day. Each date is attributed to the
  // covering stop with the lowest order so the timeline reads as one journey;
  // both stops still contribute their full costs to the budget (D-04).
  const stopForDay = (date: Date) =>
    trip.stops.find((s) => toUtcDay(s.startDate) <= date && date <= toUtcDay(s.endDate)) ?? null;

  const itemsByDay = new Map<string, ItineraryItemView[]>();
  for (const stop of trip.stops) {
    for (const item of stop.items) {
      const key = dayKey(toUtcDay(item.date));
      const view: ItineraryItemView = {
        id: item.id,
        startTime: item.startTime,
        notes: item.notes,
        order: item.order,
        effectiveCost: effectiveCost(item),
        activity: {
          id: item.activity.id,
          name: item.activity.name,
          category: item.activity.category,
          durationHours: num(item.activity.durationHours),
          description: item.activity.description,
          imageUrl: item.activity.imageUrl,
        },
      };
      const bucket = itemsByDay.get(key);
      if (bucket) bucket.push(view);
      else itemsByDay.set(key, [view]);
    }
  }
  // Ordering is per stop+day in the DB; a day fed by two overlapping stops needs
  // re-sorting so the merged list still reads in time order.
  for (const list of itemsByDay.values()) {
    list.sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") || a.order - b.order);
  }

  return {
    trip: {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverPhotoUrl: trip.coverPhotoUrl,
      budgetTotal: numOrNull(trip.budgetTotal),
      isPublic: trip.isPublic,
      publicSlug: trip.publicSlug,
      ownerName: trip.user.name,
      status: tripStatus(trip.startDate, trip.endDate),
      nights: nightsBetween(trip.startDate, trip.endDate),
    },
    stops: trip.stops.map((s) => ({
      id: s.id,
      order: s.order,
      startDate: s.startDate,
      endDate: s.endDate,
      notes: s.notes,
      city: {
        id: s.city.id,
        name: s.city.name,
        country: s.city.country,
        imageUrl: s.city.imageUrl,
        costIndex: s.city.costIndex,
      },
    })),
    // Days with no stop are still returned, with stop: null — a planning gap is
    // exactly what the traveller needs to see (D-05).
    days: days.map((date, index) => {
      const key = dayKey(date);
      const stop = stopForDay(date);
      const items = itemsByDay.get(key) ?? [];
      return {
        date: key,
        dayNumber: index + 1,
        stop: stop
          ? {
              id: stop.id,
              notes: stop.notes,
              city: {
                id: stop.city.id,
                name: stop.city.name,
                country: stop.city.country,
                imageUrl: stop.city.imageUrl,
              },
            }
          : null,
        items,
        dayTotal: round2(items.reduce((sum, i) => sum + i.effectiveCost, 0)),
      };
    }),
    budget: computeBudget(trip),
  };
}

export async function itineraryById(tripId: string): Promise<Itinerary | null> {
  const trip = await loadTrip({ id: tripId });
  return trip ? buildItinerary(trip) : null;
}

/** Public route: only a trip that is currently shared resolves. */
export async function itineraryBySlug(slug: string): Promise<Itinerary | null> {
  const trip = await loadTrip({ publicSlug: slug });
  return trip && trip.isPublic ? buildItinerary(trip) : null;
}
