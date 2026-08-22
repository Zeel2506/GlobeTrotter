import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, page, parseBody, parseListQuery, requireRole, logActivity } from "@/lib/api-helpers";
import { statusWhere } from "@/lib/trip-status";
import { tripCardInclude, toTripCards } from "@/lib/trips";
import { base64Image, dayString, money } from "@/lib/validators";

export const createTripSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    startDate: dayString,
    endDate: dayString,
    coverPhotoUrl: base64Image.optional().nullable(),
    budgetTotal: money.optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { user } = await requireRole();
    const { q, skip, take, ...p } = parseListQuery(req);
    const filter = req.nextUrl.searchParams.get("filter") ?? "all";

    const where = {
      userId: user.id,
      ...statusWhere(filter),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: tripCardInclude,
        orderBy: filter === "past" ? { endDate: "desc" } : { startDate: "asc" },
        skip,
        take,
      }),
      prisma.trip.count({ where }),
    ]);

    return page(await toTripCards(trips), total, p);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { user } = await requireRole();
    const body = await parseBody(req, createTripSchema);

    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description,
        startDate: body.startDate,
        endDate: body.endDate,
        coverPhotoUrl: body.coverPhotoUrl ?? undefined,
        budgetTotal: body.budgetTotal ?? undefined,
      },
    });

    await logActivity({
      action: "TRIP_CREATED",
      entityType: "Trip",
      entityId: trip.id,
      message: `${user.name} created the trip "${trip.name}"`,
      userId: user.id,
    });

    return ok(trip, 201);
  });
}
