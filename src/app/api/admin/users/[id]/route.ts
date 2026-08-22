import type { NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchUserSchema = z
  .object({ isActive: z.boolean().optional(), role: z.enum(Role).optional() })
  .refine((d) => d.isActive !== undefined || d.role !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await parseBody(req, patchUserSchema);

    // Locking yourself out mid-demo is unrecoverable without database access
    // (docs/DECISIONS.md D-14).
    if (id === user.id) {
      throw new ApiError(422, "You cannot change your own role or deactivate your own account");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new ApiError(404, "User not found");

    // Nor can the last remaining active admin be demoted or switched off by another.
    const losingAdmin =
      target.role === "ADMIN" && (body.role === "USER" || body.isActive === false);
    if (losingAdmin) {
      const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (admins <= 1) throw new ApiError(422, "The last active admin cannot be demoted or deactivated");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive, role: body.role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return ok(updated);
  });
}
