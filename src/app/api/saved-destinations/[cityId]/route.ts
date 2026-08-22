import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole, ApiError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ cityId: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { cityId } = await params;

    const saved = await prisma.savedDestination.findUnique({
      where: { userId_cityId: { userId: user.id, cityId } },
    });
    if (!saved) throw new ApiError(404, "That destination is not in your saved list");

    await prisma.savedDestination.delete({ where: { id: saved.id } });
    return ok({ cityId });
  });
}
