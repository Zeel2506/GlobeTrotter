import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { createActivitySchema, serializeActivity } from "@/app/api/activities/route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole();
    const { id } = await params;
    const activity = await prisma.activity.findUnique({ where: { id }, include: { city: true } });
    if (!activity) throw new ApiError(404, "Activity not found");
    return ok(serializeActivity(activity));
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await parseBody(req, createActivitySchema.partial());
    const activity = await prisma.activity.update({
      where: { id },
      data: body,
      include: { city: true },
    });
    return ok(serializeActivity(activity));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const inUse = await prisma.itineraryItem.count({ where: { activityId: id } });
    if (inUse > 0) {
      throw new ApiError(409, `This activity is scheduled in ${inUse} itinerary item(s) and cannot be deleted`);
    }

    await prisma.activity.delete({ where: { id } });
    return ok({ id });
  });
}
