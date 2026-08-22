import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";
import { cuid, dayString } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const createStopSchema = z
  .object({
    cityId: cuid,
    startDate: dayString,
    endDate: dayString,
    notes: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);
    const rows = await prisma.stop.findMany({
      where: { tripId: id },
      orderBy: { order: "asc" },
      include: { city: true, _count: { select: { items: true, expenses: true } } },
    });
    return ok({ rows });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const trip = await requireTrip(id, user);
    const body = await parseBody(req, createStopSchema);

    if (body.startDate < trip.startDate || body.endDate > trip.endDate) {
      throw new ApiError(422, "Stop dates must fall inside the trip dates");
    }

    const city = await prisma.city.findUnique({ where: { id: body.cityId } });
    if (!city) throw new ApiError(422, "That city is not in the catalog");

    // New stops go on the end; ordering is then owned by the reorder endpoint.
    const last = await prisma.stop.findFirst({
      where: { tripId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const stop = await prisma.stop.create({
      data: {
        tripId: id,
        cityId: body.cityId,
        startDate: body.startDate,
        endDate: body.endDate,
        notes: body.notes,
        order: (last?.order ?? -1) + 1,
      },
      include: { city: true, _count: { select: { items: true, expenses: true } } },
    });

    return ok(stop, 201);
  });
}
