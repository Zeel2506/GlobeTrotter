import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../header";
import { CitiesTable, type AdminCityRow } from "./cities-table";

export const metadata: Metadata = { title: "Cities · Admin" };
export const dynamic = "force-dynamic";

/**
 * Catalog management for cities. The ADMIN-only CRUD endpoints on /api/cities
 * already existed; this is the surface for them.
 */
export default async function AdminCitiesPage() {
  const cities = await prisma.city.findMany({
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      country: true,
      region: true,
      costIndex: true,
      popularity: true,
      description: true,
      imageUrl: true,
      _count: { select: { activities: true, stops: true } },
    },
  });

  const rows: AdminCityRow[] = cities.map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    region: c.region,
    costIndex: c.costIndex,
    popularity: c.popularity,
    description: c.description,
    imageUrl: c.imageUrl,
    activityCount: c._count.activities,
    stopCount: c._count.stops,
  }));

  const regions = [...new Set(cities.map((c) => c.region))].sort();

  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader
        title="Cities"
        description="The destination catalog behind search, recommendations and every cost estimate."
        csvHref="/api/admin/analytics?format=csv&table=cities"
        csvLabel="Export top cities"
      />
      <CitiesTable rows={rows} regions={regions} />
    </div>
  );
}
