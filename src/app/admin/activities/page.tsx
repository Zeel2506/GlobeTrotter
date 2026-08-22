import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../header";
import { ActivitiesTable, type AdminActivityRow } from "./activities-table";

export const metadata: Metadata = { title: "Activities · Admin" };
export const dynamic = "force-dynamic";

/** Catalog management for activities — the ADMIN CRUD on /api/activities. */
export default async function AdminActivitiesPage() {
  const [activities, cities] = await Promise.all([
    prisma.activity.findMany({
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        cost: true,
        durationHours: true,
        description: true,
        cityId: true,
        city: { select: { name: true, country: true } },
        _count: { select: { itineraryItems: true } },
      },
    }),
    prisma.city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, country: true },
    }),
  ]);

  const rows: AdminActivityRow[] = activities.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    cost: Number(a.cost),
    durationHours: Number(a.durationHours),
    description: a.description,
    cityId: a.cityId,
    cityName: a.city.name,
    country: a.city.country,
    usageCount: a._count.itineraryItems,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader
        title="Activities"
        description="Everything travellers can drop onto a day. Costs here drive every budget in the product."
        csvHref="/api/admin/analytics?format=csv&table=activities"
        csvLabel="Export top activities"
      />
      <ActivitiesTable rows={rows} cities={cities} />
    </div>
  );
}
