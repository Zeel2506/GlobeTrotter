import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireStop } from "@/lib/access";
import { dayString, idList } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

const reorderSchema = z.object({ date: dayString, orderedItemIds: idList });

/** Reorder happens within one day of one stop — that is the list drag-and-drop shows. */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireStop(id, user);
    const { date, orderedItemIds } = await parseBody(req, reorderSchema);

    const current = await prisma.itineraryItem.findMany({
      where: { stopId: id, date },
      select: { id: true },
    });

    const currentIds = new Set(current.map((i) => i.id));
    const sameSet =
      current.length === orderedItemIds.length && orderedItemIds.every((i) => currentIds.has(i));
    if (!sameSet) {
      throw new ApiError(422, "The list must contain exactly this day's activities, once each");
    }

    await prisma.$transaction(
      orderedItemIds.map((itemId, order) =>
        prisma.itineraryItem.update({ where: { id: itemId }, data: { order } }),
      ),
    );

    const rows = await prisma.itineraryItem.findMany({
      where: { stopId: id, date },
      orderBy: { order: "asc" },
      include: { activity: { select: { id: true, name: true, category: true } } },
    });
    return ok({ rows });
  });
}
