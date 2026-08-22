import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireItem } from "@/lib/access";
import { effectiveCost } from "@/lib/budget";
import { dayString, money, num, timeString } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const patchItemSchema = z.object({
  date: dayString.optional(),
  startTime: timeString.nullable().optional(),
  costOverride: money.nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const item = await requireItem(id, user);
    const body = await parseBody(req, patchItemSchema);

    if (body.date && (body.date < item.stop.startDate || body.date > item.stop.endDate)) {
      throw new ApiError(422, "That date is outside this stop's dates");
    }

    // Moving to another day puts the item at the end of that day's list rather
    // than colliding with whatever already holds its old order value.
    const movedDay = Boolean(body.date && body.date.getTime() !== item.date.getTime());
    const order = movedDay
      ? ((
          await prisma.itineraryItem.findFirst({
            where: { stopId: item.stopId, date: body.date },
            orderBy: { order: "desc" },
            select: { order: true },
          })
        )?.order ?? -1) + 1
      : undefined;

    const updated = await prisma.itineraryItem.update({
      where: { id },
      data: {
        date: body.date,
        startTime: body.startTime,
        costOverride: body.costOverride,
        notes: body.notes,
        order,
      },
      include: { activity: true },
    });

    return ok({
      ...updated,
      costOverride: updated.costOverride === null ? null : num(updated.costOverride),
      effectiveCost: effectiveCost(updated),
      activity: {
        ...updated.activity,
        cost: num(updated.activity.cost),
        durationHours: num(updated.activity.durationHours),
      },
    });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const item = await requireItem(id, user);

    await prisma.$transaction(async (tx) => {
      await tx.itineraryItem.delete({ where: { id } });
      const rest = await tx.itineraryItem.findMany({
        where: { stopId: item.stopId, date: item.date },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      await Promise.all(
        rest.map((r, order) => tx.itineraryItem.update({ where: { id: r.id }, data: { order } })),
      );
    });

    return ok({ id });
  });
}
