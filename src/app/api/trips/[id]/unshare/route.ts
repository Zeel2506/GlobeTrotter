import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);

    // The slug is kept, not cleared: shared links 404 while private and start
    // working again if the trip is re-shared (docs/DECISIONS.md D-09).
    const updated = await prisma.trip.update({
      where: { id },
      data: { isPublic: false },
    });

    return ok({ isPublic: false, publicSlug: updated.publicSlug });
  });
}
