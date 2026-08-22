import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireStop } from "@/lib/access";
import { effectiveCost } from "@/lib/budget";
import { num } from "@/lib/validators";
import { cuid, dayString, money, timeString } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const createItemSchema = z.object({
  activityId: cuid,
  date: dayString,
  startTime: timeString.optional(),
  costOverride: money.optional().nullable(),
  notes: z.string().trim().max(500).optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireStop(id, user);
    const rows = await prisma.itineraryItem.findMany({
      where: { stopId: id },
      orderBy: [{ date: "asc" }, { order: "asc" }],
      include: { activity: true },
    });
    return ok({
      rows: rows.map((r) => ({
        ...r,
        costOverride: r.costOverride === null ? null : num(r.costOverride),
        effectiveCost: effectiveCost(r),
        activity: { ...r.activity, cost: num(r.activity.cost), durationHours: num(r.activity.durationHours) },
      })),
    });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const stop = await requireStop(id, user);
    const body = await parseBody(req, createItemSchema);

    if (body.date < stop.startDate || body.date > stop.endDate) {
      throw new ApiError(422, "That date is outside this stop's dates");
    }

    // An activity can only be scheduled in the city its stop is in — otherwise
    // the itinerary would claim you are in two places at once.
    const activity = await prisma.activity.findUnique({ where: { id: body.activityId } });
    if (!activity) throw new ApiError(422, "That activity is not in the catalog");
    if (activity.cityId !== stop.cityId) {
      throw new ApiError(422, "That activity belongs to a different city than this stop");
    }

    const last = await prisma.itineraryItem.findFirst({
      where: { stopId: id, date: body.date },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const item = await prisma.itineraryItem.create({
      data: {
        stopId: id,
        activityId: body.activityId,
        date: body.date,
        startTime: body.startTime,
        costOverride: body.costOverride ?? undefined,
        notes: body.notes,
        order: (last?.order ?? -1) + 1,
      },
      include: { activity: true },
    });

    return ok(
      {
        ...item,
        costOverride: item.costOverride === null ? null : num(item.costOverride),
        effectiveCost: effectiveCost(item),
        activity: {
          ...item.activity,
          cost: num(item.activity.cost),
          durationHours: num(item.activity.durationHours),
        },
      },
      201,
    );
  });
}
