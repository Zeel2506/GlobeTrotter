// Seeds the catalog (31 cities x 10 activities) plus three demo accounts with
// trips covering every state the UI has to render: upcoming / ongoing / past,
// a public trip, a trip with a deliberate over-budget day.
//
//   npm run db:seed        (npm run db:reset to wipe and re-seed)
//
// Demo logins — all password Demo@123:
//   admin@demo.com   ADMIN, sees the analytics dashboard
//   user@demo.com    USER, the main demo account (3 trips)
//   friend@demo.com  USER, owns a public trip for the Copy Trip demo
import { PrismaClient, type ActivityCategory, type ExpenseCategory } from "@prisma/client";
import { hash } from "bcryptjs";
import { CATALOG, CITY_PHOTO, CATEGORY_PHOTO } from "./catalog";

const prisma = new PrismaClient();

const PASSWORD = "Demo@123";

// ── date helpers (UTC calendar days, same rule as src/lib/dates.ts) ──────────
const MS_PER_DAY = 86_400_000;
const today = (() => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
})();
const day = (offset: number) => new Date(today.getTime() + offset * MS_PER_DAY);

type ItemSeed = { activity: string; dayOffset: number; startTime: string; costOverride?: number };
type ExpenseSeed = { category: ExpenseCategory; description: string; amount: number; dayOffset?: number };
type StopSeed = {
  city: string;
  from: number; // offset from the trip start, in days
  to: number;
  notes?: string;
  items: ItemSeed[];
  expenses: ExpenseSeed[];
};
type TripSeed = {
  name: string;
  description: string;
  start: number; // offset from today
  end: number;
  budgetTotal?: number;
  isPublic?: boolean;
  publicSlug?: string;
  createdAtOffset?: number; // days before today, so the analytics chart has history
  stops: StopSeed[];
};

async function seedCatalog() {
  console.log(`Seeding catalog: ${CATALOG.length} cities…`);
  for (const c of CATALOG) {
    const city = await prisma.city.upsert({
      where: { name_country: { name: c.name, country: c.country } },
      update: {
        region: c.region,
        costIndex: c.costIndex,
        popularity: c.popularity,
        description: c.description,
        imageUrl: CITY_PHOTO[c.name] ?? null,
      },
      create: {
        name: c.name,
        country: c.country,
        region: c.region,
        costIndex: c.costIndex,
        popularity: c.popularity,
        description: c.description,
        imageUrl: CITY_PHOTO[c.name] ?? null,
      },
    });

    // Activities have no natural key, so replace the city's set wholesale.
    // Safe on a re-seed because demo itinerary items are recreated right after.
    await prisma.activity.deleteMany({ where: { cityId: city.id } });
    await prisma.activity.createMany({
      data: c.activities.map(([name, category, cost, durationHours, description]) => ({
        cityId: city.id,
        name,
        category: category as ActivityCategory,
        cost,
        durationHours,
        description,
        imageUrl: CATEGORY_PHOTO[category] ?? null,
      })),
    });
  }
  const activities = await prisma.activity.count();
  console.log(`  ${CATALOG.length} cities, ${activities} activities.`);
}

async function createUser(name: string, email: string, role: "USER" | "ADMIN") {
  const passwordHash = await hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, isActive: true },
    create: { name, email, role, passwordHash },
  });
}

async function createTrip(userId: string, seed: TripSeed) {
  const start = day(seed.start);

  const trip = await prisma.trip.create({
    data: {
      userId,
      name: seed.name,
      description: seed.description,
      startDate: start,
      endDate: day(seed.end),
      budgetTotal: seed.budgetTotal,
      isPublic: seed.isPublic ?? false,
      publicSlug: seed.publicSlug,
      ...(seed.createdAtOffset === undefined ? {} : { createdAt: day(-seed.createdAtOffset) }),
    },
  });

  for (const [order, s] of seed.stops.entries()) {
    const city = await prisma.city.findFirst({ where: { name: s.city } });
    if (!city) throw new Error(`Seed error: city "${s.city}" is not in the catalog`);

    const stop = await prisma.stop.create({
      data: {
        tripId: trip.id,
        cityId: city.id,
        startDate: day(seed.start + s.from),
        endDate: day(seed.start + s.to),
        order,
        notes: s.notes,
      },
    });

    for (const [i, it] of s.items.entries()) {
      const activity = await prisma.activity.findFirst({
        where: { cityId: city.id, name: it.activity },
      });
      if (!activity) throw new Error(`Seed error: "${it.activity}" is not an activity in ${s.city}`);
      await prisma.itineraryItem.create({
        data: {
          stopId: stop.id,
          activityId: activity.id,
          date: day(seed.start + it.dayOffset),
          startTime: it.startTime,
          costOverride: it.costOverride,
          order: i,
        },
      });
    }

    for (const e of s.expenses) {
      await prisma.expense.create({
        data: {
          stopId: stop.id,
          category: e.category,
          description: e.description,
          amount: e.amount,
          date: e.dayOffset === undefined ? null : day(seed.start + e.dayOffset),
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      action: "TRIP_CREATED",
      entityType: "Trip",
      entityId: trip.id,
      message: `Seeded trip "${trip.name}"`,
      userId,
    },
  });

  return trip;
}

// ── Demo trips ──────────────────────────────────────────────────────────────

/**
 * The demo-path trip. Three cities, fully built, comfortably inside its overall
 * budget but with the Versailles + Moulin Rouge day clearing the daily budget —
 * that is the single pulsing bar the budget screen is built around. The Japan
 * trip below is the one that busts its budget overall, so the two states are
 * demonstrable side by side.
 */
const EUROPE_TRIP: TripSeed = {
  name: "European Summer Escape",
  description: "Two weeks through Paris, Rome and Barcelona — museums, markets and a lot of walking.",
  start: 24,
  createdAtOffset: 40,
  end: 36,
  budgetTotal: 4400,
  stops: [
    {
      city: "Paris",
      from: 0,
      to: 4,
      notes: "Staying in the 11th, walking distance to everything that matters.",
      items: [
        { activity: "Eiffel Tower Summit Access", dayOffset: 0, startTime: "10:00" },
        { activity: "Seine River Dinner Cruise", dayOffset: 0, startTime: "19:30" },
        { activity: "Louvre Museum Guided Tour", dayOffset: 1, startTime: "09:30" },
        { activity: "Musée d'Orsay Entry", dayOffset: 1, startTime: "15:00" },
        { activity: "Versailles Day Trip", dayOffset: 2, startTime: "08:00" },
        { activity: "Moulin Rouge Show", dayOffset: 2, startTime: "21:00" },
        { activity: "Montmartre Walking Tour", dayOffset: 3, startTime: "10:00" },
        { activity: "Latin Quarter Food Crawl", dayOffset: 3, startTime: "18:00" },
        { activity: "Luxembourg Gardens Picnic", dayOffset: 4, startTime: "12:00" },
      ],
      expenses: [
        { category: "STAY", description: "Marais apartment, 4 nights", amount: 520 },
        { category: "TRANSPORT", description: "Flights into Paris", amount: 340 },
        { category: "MEALS", description: "Breakfasts and lunches", amount: 160 },
        { category: "TRANSPORT", description: "Metro carnet", amount: 20, dayOffset: 0 },
      ],
    },
    {
      city: "Rome",
      from: 5,
      to: 8,
      notes: "Night train down. Trastevere for dinner every evening.",
      items: [
        { activity: "Colosseum & Roman Forum", dayOffset: 5, startTime: "09:00" },
        { activity: "Campo de' Fiori Wine Bars", dayOffset: 5, startTime: "20:00" },
        { activity: "Vatican Museums & Sistine Chapel", dayOffset: 6, startTime: "08:00" },
        { activity: "Pantheon & Piazza Navona Walk", dayOffset: 6, startTime: "17:00" },
        { activity: "Pasta-Making Class", dayOffset: 7, startTime: "11:00" },
        { activity: "Trastevere Food Tour", dayOffset: 7, startTime: "19:00" },
        { activity: "Appian Way Bike Ride", dayOffset: 8, startTime: "09:30" },
      ],
      expenses: [
        { category: "STAY", description: "Trastevere guesthouse, 3 nights", amount: 330 },
        { category: "TRANSPORT", description: "Paris to Rome night train", amount: 145, dayOffset: 4 },
        { category: "MEALS", description: "Coffee, gelato and market lunches", amount: 120 },
      ],
    },
    {
      city: "Barcelona",
      from: 9,
      to: 12,
      notes: "Beach mornings, Gaudí afternoons.",
      items: [
        { activity: "Sagrada Família with Tower", dayOffset: 9, startTime: "10:00" },
        { activity: "Tapas & Vermouth Crawl", dayOffset: 9, startTime: "19:00" },
        { activity: "Park Güell Entry", dayOffset: 10, startTime: "09:00" },
        { activity: "Casa Batlló Audio Tour", dayOffset: 10, startTime: "16:00" },
        { activity: "Costa Brava Kayak Trip", dayOffset: 11, startTime: "08:30" },
        { activity: "Barceloneta Beach Day", dayOffset: 12, startTime: "11:00" },
        { activity: "Flamenco at Palau Dalmases", dayOffset: 12, startTime: "20:30" },
      ],
      expenses: [
        { category: "STAY", description: "Eixample hotel, 3 nights", amount: 285 },
        { category: "TRANSPORT", description: "Rome to Barcelona flight", amount: 95, dayOffset: 8 },
        { category: "MEALS", description: "Dinners and beach snacks", amount: 140 },
        { category: "OTHER", description: "Travel insurance", amount: 60 },
      ],
    },
  ],
};

const JAPAN_TRIP: TripSeed = {
  name: "Japan Right Now",
  description: "Tokyo and Kyoto, currently in progress.",
  start: -3,
  createdAtOffset: 20,
  end: 4,
  budgetTotal: 1800,
  stops: [
    {
      city: "Tokyo",
      from: 0,
      to: 3,
      notes: "Base in Shinjuku, JR pass activated on arrival.",
      items: [
        { activity: "Tsukiji Outer Market Breakfast", dayOffset: 0, startTime: "07:00" },
        { activity: "Senso-ji Temple & Nakamise", dayOffset: 0, startTime: "10:30" },
        { activity: "Shibuya Crossing & Sky", dayOffset: 1, startTime: "17:00" },
        { activity: "Golden Gai Bar Hopping", dayOffset: 1, startTime: "21:00" },
        { activity: "TeamLab Digital Art Museum", dayOffset: 2, startTime: "11:00" },
        { activity: "Sushi Omakase Counter", dayOffset: 2, startTime: "19:00" },
        { activity: "Mount Fuji & Hakone Day Trip", dayOffset: 3, startTime: "07:30" },
      ],
      expenses: [
        { category: "STAY", description: "Shinjuku hotel, 4 nights", amount: 430 },
        { category: "TRANSPORT", description: "JR Pass, 7 days", amount: 240, dayOffset: 0 },
        { category: "MEALS", description: "Konbini and ramen", amount: 110 },
      ],
    },
    {
      city: "Kyoto",
      from: 4,
      to: 7,
      notes: "Shinkansen across. Temples before breakfast.",
      items: [
        { activity: "Fushimi Inari Shrine Hike", dayOffset: 4, startTime: "06:30" },
        { activity: "Nishiki Market Food Walk", dayOffset: 4, startTime: "12:00" },
        { activity: "Arashiyama Bamboo Grove", dayOffset: 5, startTime: "06:45" },
        { activity: "Tea Ceremony in Gion", dayOffset: 5, startTime: "15:00" },
        { activity: "Kinkaku-ji Golden Pavilion", dayOffset: 6, startTime: "09:00" },
        { activity: "Kaiseki Dinner", dayOffset: 6, startTime: "18:30" },
        { activity: "Nara Deer Park Day Trip", dayOffset: 7, startTime: "08:30" },
      ],
      expenses: [
        { category: "STAY", description: "Gion machiya, 4 nights", amount: 380 },
        { category: "MEALS", description: "Breakfasts and coffee", amount: 90 },
      ],
    },
  ],
};

const ICELAND_TRIP: TripSeed = {
  name: "Iceland Ring Road",
  description: "Last winter's northern lights run — kept for reference and for the photos.",
  start: -95,
  createdAtOffset: 130,
  end: -88,
  budgetTotal: 2000,
  isPublic: true,
  publicSlug: "iceland-ring-road-demo",
  stops: [
    {
      city: "Reykjavik",
      from: 0,
      to: 7,
      notes: "Everything is a day trip from here in winter.",
      items: [
        { activity: "Blue Lagoon Entry", dayOffset: 0, startTime: "14:00" },
        { activity: "Hallgrímskirkja Tower", dayOffset: 1, startTime: "10:00" },
        { activity: "National Museum of Iceland", dayOffset: 1, startTime: "13:30" },
        { activity: "Golden Circle Tour", dayOffset: 2, startTime: "08:00" },
        { activity: "Northern Lights Hunt", dayOffset: 2, startTime: "21:00" },
        { activity: "Glacier Hike on Sólheimajökull", dayOffset: 3, startTime: "08:30" },
        { activity: "Whale Watching from Old Harbour", dayOffset: 4, startTime: "09:00" },
        { activity: "Icelandic Seafood Dinner", dayOffset: 4, startTime: "19:30" },
        { activity: "Reykjavik Bar Rúntur", dayOffset: 5, startTime: "22:00" },
        { activity: "Laugavegur Design Shops", dayOffset: 6, startTime: "11:00" },
      ],
      expenses: [
        { category: "STAY", description: "Downtown apartment, 7 nights", amount: 690 },
        { category: "TRANSPORT", description: "4x4 rental with winter tyres", amount: 420 },
        { category: "MEALS", description: "Groceries and eating out", amount: 260 },
        { category: "OTHER", description: "Fuel", amount: 130 },
      ],
    },
  ],
};

const FRIEND_TRIP: TripSeed = {
  name: "Southeast Asia on a Shoestring",
  description: "Three weeks, two countries, under a thousand dollars. Copy it and make it yours.",
  start: 45,
  createdAtOffset: 75,
  end: 58,
  budgetTotal: 1100,
  isPublic: true,
  publicSlug: "sea-shoestring-demo",
  stops: [
    {
      city: "Bangkok",
      from: 0,
      to: 5,
      notes: "Fly in here, it is always the cheapest hub.",
      items: [
        { activity: "Grand Palace & Wat Phra Kaew", dayOffset: 0, startTime: "09:00" },
        { activity: "Wat Arun at Sunset", dayOffset: 0, startTime: "17:30" },
        { activity: "Street Food Tour in Chinatown", dayOffset: 1, startTime: "18:00" },
        { activity: "Chao Phraya Longtail Boat", dayOffset: 2, startTime: "09:30" },
        { activity: "Thai Cooking Class", dayOffset: 3, startTime: "10:00" },
        { activity: "Ayutthaya Ruins Day Trip", dayOffset: 4, startTime: "07:30" },
        { activity: "Traditional Thai Massage", dayOffset: 5, startTime: "16:00" },
      ],
      expenses: [
        { category: "STAY", description: "Hostel in Phra Nakhon, 5 nights", amount: 75 },
        { category: "TRANSPORT", description: "Return flights", amount: 380 },
        { category: "MEALS", description: "Street food, all week", amount: 55 },
      ],
    },
    {
      city: "Hanoi",
      from: 6,
      to: 13,
      notes: "Cheap flight up from Bangkok. Old Quarter, walkable.",
      items: [
        { activity: "Old Quarter Street Food Walk", dayOffset: 6, startTime: "18:00" },
        { activity: "Hoan Kiem Lake & Ngoc Son", dayOffset: 7, startTime: "06:30" },
        { activity: "Temple of Literature", dayOffset: 7, startTime: "10:00" },
        { activity: "Ha Long Bay Day Cruise", dayOffset: 8, startTime: "07:00" },
        { activity: "Water Puppet Theatre", dayOffset: 9, startTime: "17:00" },
        { activity: "Vietnamese Cooking Class", dayOffset: 10, startTime: "10:00" },
        { activity: "Train Street Coffee", dayOffset: 11, startTime: "15:30" },
        { activity: "Bia Hoi Corner Evening", dayOffset: 12, startTime: "19:00" },
        { activity: "Dong Xuan Market", dayOffset: 13, startTime: "10:00" },
      ],
      expenses: [
        { category: "STAY", description: "Old Quarter guesthouse, 8 nights", amount: 96 },
        { category: "TRANSPORT", description: "Bangkok to Hanoi flight", amount: 85, dayOffset: 5 },
        { category: "MEALS", description: "Phở, banh mi, egg coffee", amount: 70 },
      ],
    },
  ],
};

/**
 * Background community: without it the admin analytics screen shows one month
 * of history and every city tied at a single stop, which reads as broken rather
 * than as new. These users give trips-over-time a curve and the top-cities table
 * a ranking. Deterministic — no Math.random, so a re-seed reproduces the charts.
 */
const COMMUNITY_NAMES = [
  "Ananya Iyer", "Rohan Desai", "Meera Nair", "Kabir Shah", "Ishita Rao",
  "Arjun Menon", "Sara Khan", "Vikram Joshi", "Neha Kulkarni", "Dev Bhatt",
  "Priya Ramesh", "Aditya Verma",
];

/** Weighted so the top-cities table has a clear head and a long tail. */
const COMMUNITY_ROUTES: string[][] = [
  ["Paris", "Rome"], ["Tokyo", "Kyoto"], ["Bangkok", "Hanoi"], ["Paris", "Barcelona"],
  ["Rome", "Santorini"], ["Tokyo"], ["New York City"], ["Lisbon", "Barcelona"],
  ["Dubai", "Istanbul"], ["Paris"], ["Bali-less", "Ubud"], ["Cape Town"],
  ["Kyoto", "Seoul"], ["Rome"], ["Prague", "Amsterdam"], ["Tokyo", "Seoul"],
  ["Marrakech"], ["Mexico City"], ["Paris", "Amsterdam"], ["Bangkok"],
];

async function seedCommunity() {
  const passwordHash = await hash(PASSWORD, 10);
  const cityRows = await prisma.city.findMany({ select: { id: true, name: true } });
  const cities = new Map(cityRows.map((c) => [c.name, c.id]));

  const activitiesByCity = new Map<string, string[]>();
  for (const a of await prisma.activity.findMany({
    select: { id: true, cityId: true },
    orderBy: { name: "asc" },
  })) {
    const list = activitiesByCity.get(a.cityId);
    if (list) list.push(a.id);
    else activitiesByCity.set(a.cityId, [a.id]);
  }

  for (const [i, name] of COMMUNITY_NAMES.entries()) {
    const email = `${name.split(" ")[0].toLowerCase()}${i}@globetrotter.demo`;
    const createdAt = day(-((i * 13) % 170) - 5);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, role: "USER", createdAt },
    });

    // 1-2 trips each, spread back over the last six months.
    const tripCount = (i % 2) + 1;
    for (let t = 0; t < tripCount; t++) {
      const route = COMMUNITY_ROUTES[(i * 2 + t) % COMMUNITY_ROUTES.length].filter((c) => cities.has(c));
      if (route.length === 0) continue;

      const startOffset = ((i * 17 + t * 29) % 240) - 120; // some past, some future
      const trip = await prisma.trip.create({
        data: {
          userId: user.id,
          name: `${route.join(" & ")} trip`,
          startDate: day(startOffset),
          endDate: day(startOffset + route.length * 3),
          createdAt: day(-((i * 11 + t * 23) % 165) - 3),
        },
      });

      for (const [order, cityName] of route.entries()) {
        const cityId = cities.get(cityName)!;
        const stop = await prisma.stop.create({
          data: {
            tripId: trip.id,
            cityId,
            startDate: day(startOffset + order * 3),
            endDate: day(startOffset + order * 3 + 3),
            order,
          },
        });

        // A rotating slice of each city's catalog, so the top-activities table
        // ranks instead of showing everything tied at one.
        const pool = activitiesByCity.get(cityId) ?? [];
        const picks = [0, 1, 2].map((n) => pool[(i + t + n * 3) % Math.max(1, pool.length)]).filter(Boolean);
        for (const [n, activityId] of [...new Set(picks)].entries()) {
          await prisma.itineraryItem.create({
            data: {
              stopId: stop.id,
              activityId,
              date: day(startOffset + order * 3 + n),
              order: n,
            },
          });
        }
      }
    }
  }
}

async function main() {
  console.log("GlobeTrotter seed starting…");

  // Wipe demo trip data; the catalog is upserted, the three demo logins are kept
  // so a re-seed mid-demo does not invalidate an open session.
  await prisma.trip.deleteMany({
    where: { user: { email: { in: ["user@demo.com", "friend@demo.com", "admin@demo.com"] } } },
  });
  // Community accounts are disposable — remove them wholesale so a re-seed does
  // not stack duplicate trips onto them.
  await prisma.user.deleteMany({ where: { email: { endsWith: "@globetrotter.demo" } } });

  await seedCatalog();

  const admin = await createUser("Aarti Mehta", "admin@demo.com", "ADMIN");
  const user = await createUser("Zeel Patel", "user@demo.com", "USER");
  const friend = await createUser("Riya Shah", "friend@demo.com", "USER");

  await createTrip(user.id, EUROPE_TRIP);
  await createTrip(user.id, JAPAN_TRIP);
  await createTrip(user.id, ICELAND_TRIP);
  await createTrip(friend.id, FRIEND_TRIP);

  await seedCommunity();

  // A couple of saved destinations so the profile screen is not empty.
  const savedCities = await prisma.city.findMany({
    where: { name: { in: ["Kyoto", "Cape Town", "Queenstown"] } },
    select: { id: true },
  });
  await prisma.savedDestination.deleteMany({ where: { userId: user.id } });
  await prisma.savedDestination.createMany({
    data: savedCities.map((c) => ({ userId: user.id, cityId: c.id })),
  });

  console.log(`
Seed complete.
  cities            ${await prisma.city.count()}
  activities        ${await prisma.activity.count()}
  trips             ${await prisma.trip.count()}
  itinerary items   ${await prisma.itineraryItem.count()}
  expenses          ${await prisma.expense.count()}

Logins (password ${PASSWORD}):
  ${admin.email}   ADMIN
  ${user.email}    USER   — 3 trips: upcoming / ongoing / past(public)
  ${friend.email}  USER   — 1 public trip for the Copy Trip demo

Public demo links:
  /p/${ICELAND_TRIP.publicSlug}
  /p/${FRIEND_TRIP.publicSlug}
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
