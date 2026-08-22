import type { NextRequest } from "next/server";
import { z } from "zod";
import { ActivityCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, page, parseBody, parseListQuery, requireRole } from "@/lib/api-helpers";
import { cuid, money, num } from "@/lib/validators";

const activitySortable = ["cost", "durationHours", "name"] as const;

export const createActivitySchema = z.object({
  cityId: cuid,
  name: z.string().trim().min(2).max(120),
  category: z.enum(ActivityCategory),
  cost: money,
  durationHours: z.number().min(0.5).max(24),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(2_800_000).optional(),
});

/** Shared by this route and /api/activities/[id] so cost/duration always land as numbers. */
export function serializeActivity<T extends { cost: unknown; durationHours: unknown }>(a: T) {
  return { ...a, cost: num(a.cost as never), durationHours: num(a.durationHours as never) };
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireRole();
    const { q, skip, take, ...p } = parseListQuery(req);
    const sp = req.nextUrl.searchParams;

    const sortParam = sp.get("sort") ?? "name";
    const sort = (activitySortable as readonly string[]).includes(sortParam)
      ? (sortParam as (typeof activitySortable)[number])
      : "name";
    const dir = sp.get("dir") === "desc" ? "desc" : "asc";

    const maxCost = Number(sp.get("maxCost"));
    const maxDuration = Number(sp.get("maxDuration"));
    const category = sp.get("category");

    const where: Prisma.ActivityWhereInput = {
      ...(sp.get("cityId") ? { cityId: sp.get("cityId")! } : {}),
      ...(category && category in ActivityCategory
        ? { category: category as ActivityCategory }
        : {}),
      ...(Number.isFinite(maxCost) && sp.get("maxCost") ? { cost: { lte: maxCost } } : {}),
      ...(Number.isFinite(maxDuration) && sp.get("maxDuration")
        ? { durationHours: { lte: maxDuration } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { city: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: [{ [sort]: dir }, { name: "asc" }],
        skip,
        take,
        include: { city: { select: { id: true, name: true, country: true, imageUrl: true } } },
      }),
      prisma.activity.count({ where }),
    ]);

    return page(rows.map(serializeActivity), total, p);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const body = await parseBody(req, createActivitySchema);
    const activity = await prisma.activity.create({ data: body, include: { city: true } });
    return ok(serializeActivity(activity), 201);
  });
}
