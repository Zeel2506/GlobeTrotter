import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";
import { tripStatus } from "@/lib/trip-status";
import { nightsBetween } from "@/lib/dates";
import { base64Image, dayString, money, num, numOrNull, round2 } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const patchTripSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  startDate: dayString.optional(),
  endDate: dayString.optional(),
  coverPhotoUrl: base64Image.nullable().optional(),
  budgetTotal: money.nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);

    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { name: true } },
        stops: {
          orderBy: { order: "asc" },
          include: {
            city: true,
            _count: { select: { items: true, expenses: true } },
            items: { select: { costOverride: true, activity: { select: { cost: true } } } },
            expenses: { select: { amount: true } },
          },
        },
      },
    });

    // Per-stop subtotals, so the builder can show a running figure per city
    // without a second round trip.
    let totalCost = 0;
    const stops = trip.stops.map((s) => {
      const subtotal = round2(
        s.items.reduce((sum, i) => sum + num(i.costOverride ?? i.activity.cost), 0) +
          s.expenses.reduce((sum, e) => sum + num(e.amount), 0),
      );
      totalCost += subtotal;
      const { items: _items, expenses: _expenses, ...rest } = s;
      return { ...rest, subtotal };
    });

    return ok({
      ...trip,
      stops,
      budgetTotal: numOrNull(trip.budgetTotal),
      ownerName: trip.user.name,
      status: tripStatus(trip.startDate, trip.endDate),
      nights: nightsBetween(trip.startDate, trip.endDate),
      totalCost: round2(totalCost),
    });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const trip = await requireTrip(id, user);
    const body = await parseBody(req, patchTripSchema);

    const startDate = body.startDate ?? trip.startDate;
    const endDate = body.endDate ?? trip.endDate;
    if (endDate < startDate) throw new ApiError(422, "End date must be on or after the start date");

    // Narrowing the trip window would silently orphan stops (and their items)
    // outside it. Refuse and name the stop instead of corrupting the itinerary.
    if (body.startDate || body.endDate) {
      const orphan = await prisma.stop.findFirst({
        where: {
          tripId: id,
          OR: [{ startDate: { lt: startDate } }, { endDate: { gt: endDate } }],
        },
        include: { city: { select: { name: true } } },
        orderBy: { order: "asc" },
      });
      if (orphan) {
        throw new ApiError(
          422,
          `The ${orphan.city.name} stop falls outside the new dates — move or remove it first`,
        );
      }
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        startDate: body.startDate,
        endDate: body.endDate,
        coverPhotoUrl: body.coverPhotoUrl,
        budgetTotal: body.budgetTotal,
      },
    });

    return ok({ ...updated, budgetTotal: numOrNull(updated.budgetTotal) });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);
    // Cascades to stops, which cascade to items and expenses (docs/DATABASE.md).
    await prisma.trip.delete({ where: { id } });
    return ok({ id });
  });
}
