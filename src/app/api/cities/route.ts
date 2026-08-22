import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, page, parseBody, parseListQuery, requireRole } from "@/lib/api-helpers";

const citySortable = ["popularity", "costIndex", "name", "country"] as const;

export const createCitySchema = z.object({
  name: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(60),
  costIndex: z.number().int().min(1).max(100),
  popularity: z.number().int().min(0).max(100),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(2_800_000).optional(),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireRole(); // catalog is read-only but still behind the login
    const { q, skip, take, ...p } = parseListQuery(req);
    const sp = req.nextUrl.searchParams;

    const sortParam = sp.get("sort") ?? "popularity";
    const sort = (citySortable as readonly string[]).includes(sortParam)
      ? (sortParam as (typeof citySortable)[number])
      : "popularity";
    const dir = sp.get("dir") === "asc" ? "asc" : sort === "popularity" ? "desc" : "asc";

    const where = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { country: { contains: q, mode: "insensitive" as const } },
              { region: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(sp.get("country") ? { country: sp.get("country")! } : {}),
      ...(sp.get("region") ? { region: sp.get("region")! } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.city.findMany({
        where,
        orderBy: [{ [sort]: dir }, { name: "asc" }],
        skip,
        take,
        include: { _count: { select: { activities: true } } },
      }),
      prisma.city.count({ where }),
    ]);

    return page(rows, total, p);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const body = await parseBody(req, createCitySchema);
    const city = await prisma.city.create({ data: body });
    return ok(city, 201);
  });
}
