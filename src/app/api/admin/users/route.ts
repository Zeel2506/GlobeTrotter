import type { NextRequest } from "next/server";
import { Role, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, page, parseListQuery, requireRole, csv } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireRole(["ADMIN"]);
    const { q, skip, take, ...p } = parseListQuery(req);
    const sp = req.nextUrl.searchParams;
    const role = sp.get("role");
    const isActive = sp.get("isActive");

    const where: Prisma.UserWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role && role in Role ? { role: role as Role } : {}),
      ...(isActive === "true" || isActive === "false" ? { isActive: isActive === "true" } : {}),
    };

    const select = {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { trips: true, savedDestinations: true } },
    } as const;

    // CSV exports the whole filtered set, not just the current page — a paginated
    // export is a bug report waiting to happen.
    if (req.nextUrl.searchParams.get("format") === "csv") {
      const all = await prisma.user.findMany({ where, select, orderBy: { createdAt: "desc" } });
      return csv(
        all.map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          trips: u._count.trips,
          savedDestinations: u._count.savedDestinations,
          joined: u.createdAt.toISOString().slice(0, 10),
        })),
        ["name", "email", "role", "isActive", "trips", "savedDestinations", "joined"],
        "users.csv",
      );
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({ where, select, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.user.count({ where }),
    ]);

    return page(
      rows.map(({ _count, ...u }) => ({
        ...u,
        tripCount: _count.trips,
        savedCount: _count.savedDestinations,
      })),
      total,
      p,
    );
  });
}
