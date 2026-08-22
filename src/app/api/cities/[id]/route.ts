import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { createCitySchema } from "@/app/api/cities/route";
import { num } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole();
    const { id } = await params;
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        activities: { orderBy: [{ category: "asc" }, { name: "asc" }] },
        _count: { select: { activities: true, stops: true } },
      },
    });
    if (!city) throw new ApiError(404, "City not found");

    return ok({
      ...city,
      activities: city.activities.map((a) => ({
        ...a,
        cost: num(a.cost),
        durationHours: num(a.durationHours),
      })),
    });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await parseBody(req, createCitySchema.partial());
    const city = await prisma.city.update({ where: { id }, data: body });
    return ok(city);
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    // A city in use by someone's itinerary is not deletable — say so instead of
    // letting the FK blow up as a 500.
    const inUse = await prisma.stop.count({ where: { cityId: id } });
    if (inUse > 0) {
      throw new ApiError(409, `This city is used by ${inUse} trip stop(s) and cannot be deleted`);
    }

    await prisma.city.delete({ where: { id } });
    return ok({ id });
  });
}
