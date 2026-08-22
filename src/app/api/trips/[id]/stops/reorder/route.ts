import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";
import { idList } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const reorderSchema = z.object({ orderedStopIds: idList });

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);
    const { orderedStopIds } = await parseBody(req, reorderSchema);

    const current = await prisma.stop.findMany({
      where: { tripId: id },
      select: { id: true },
    });

    // Set equality, not just length: a partial or foreign list would silently
    // corrupt the ordering (docs/DECISIONS.md D-13).
    const currentIds = new Set(current.map((s) => s.id));
    const sameSet =
      current.length === orderedStopIds.length && orderedStopIds.every((s) => currentIds.has(s));
    if (!sameSet) throw new ApiError(422, "The list must contain exactly this trip's stops, once each");

    await prisma.$transaction(
      orderedStopIds.map((stopId, order) =>
        prisma.stop.update({ where: { id: stopId }, data: { order } }),
      ),
    );

    const rows = await prisma.stop.findMany({
      where: { tripId: id },
      orderBy: { order: "asc" },
      include: { city: true },
    });
    return ok({ rows });
  });
}
