import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { cuid } from "@/lib/validators";

const saveSchema = z.object({ cityId: cuid });

export async function GET() {
  return handle(async () => {
    const { user } = await requireRole();
    const rows = await prisma.savedDestination.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { city: { include: { _count: { select: { activities: true } } } } },
    });
    return ok({ rows });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { user } = await requireRole();
    const { cityId } = await parseBody(req, saveSchema);

    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new ApiError(422, "That city is not in the catalog");

    const existing = await prisma.savedDestination.findUnique({
      where: { userId_cityId: { userId: user.id, cityId } },
    });
    if (existing) throw new ApiError(409, `${city.name} is already saved`);

    const saved = await prisma.savedDestination.create({
      data: { userId: user.id, cityId },
      include: { city: true },
    });
    return ok(saved, 201);
  });
}
