import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireStop } from "@/lib/access";
import { dayString } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const patchStopSchema = z.object({
  startDate: dayString.optional(),
  endDate: dayString.optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const stop = await requireStop(id, user);
    const body = await parseBody(req, patchStopSchema);

    const startDate = body.startDate ?? stop.startDate;
    const endDate = body.endDate ?? stop.endDate;

    if (endDate < startDate) throw new ApiError(422, "End date must be on or after the start date");
    if (startDate < stop.trip.startDate || endDate > stop.trip.endDate) {
      throw new ApiError(422, "Stop dates must fall inside the trip dates");
    }

    // Same rule as the trip: narrowing the window must not orphan scheduled
    // activities. Name the offending day rather than silently detaching items.
    if (body.startDate || body.endDate) {
      const orphan = await prisma.itineraryItem.findFirst({
        where: { stopId: id, OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }] },
        include: { activity: { select: { name: true } } },
        orderBy: { date: "asc" },
      });
      if (orphan) {
        throw new ApiError(
          422,
          `"${orphan.activity.name}" on ${orphan.date.toISOString().slice(0, 10)} falls outside the new dates — move or remove it first`,
        );
      }
    }

    const updated = await prisma.stop.update({
      where: { id },
      data: { startDate: body.startDate, endDate: body.endDate, notes: body.notes },
      include: { city: true, _count: { select: { items: true, expenses: true } } },
    });

    return ok(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const stop = await requireStop(id, user);

    // Delete then close the gap in `order` so the sequence stays 0..n-1.
    await prisma.$transaction(async (tx) => {
      await tx.stop.delete({ where: { id } });
      const rest = await tx.stop.findMany({
        where: { tripId: stop.tripId },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      await Promise.all(
        rest.map((s, order) => tx.stop.update({ where: { id: s.id }, data: { order } })),
      );
    });

    return ok({ id });
  });
}
