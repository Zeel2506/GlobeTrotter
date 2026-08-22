import { handle, ok, requireRole } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * The country and region option lists for the City Search filters, plus the
 * catalog cost range. Derived from the catalog so a newly seeded city shows up
 * in the filters without a code change.
 */
export async function GET() {
  return handle(async () => {
    await requireRole();
    const [countries, regions, range] = await Promise.all([
      prisma.city.findMany({ distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
      prisma.city.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } }),
      prisma.city.aggregate({ _min: { costIndex: true }, _max: { costIndex: true } }),
    ]);

    return ok({
      countries: countries.map((c) => c.country),
      regions: regions.map((r) => r.region),
      costIndex: { min: range._min.costIndex ?? 1, max: range._max.costIndex ?? 100 },
    });
  });
}
