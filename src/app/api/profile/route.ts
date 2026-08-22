import type { NextRequest } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { base64Image } from "@/lib/validators";

const patchProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.email().optional(),
  photoUrl: base64Image.nullable().optional(),
  languagePref: z.string().trim().min(2).max(10).optional(),
  password: z.string().min(6).max(72).optional(),
});

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  photoUrl: true,
  languagePref: true,
  createdAt: true,
  _count: { select: { trips: true, savedDestinations: true } },
} as const;

export async function GET() {
  return handle(async () => {
    const { user } = await requireRole();
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: profileSelect });
    if (!row) throw new ApiError(404, "Profile not found");
    const { _count, ...rest } = row;
    return ok({ ...rest, counts: { trips: _count.trips, savedDestinations: _count.savedDestinations } });
  });
}

export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const { user } = await requireRole();
    const body = await parseBody(req, patchProfileSchema);

    const email = body.email?.toLowerCase();
    if (email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== user.id) {
        throw new ApiError(409, "An account with this email already exists");
      }
    }

    const row = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        email,
        photoUrl: body.photoUrl,
        languagePref: body.languagePref,
        ...(body.password ? { passwordHash: await hash(body.password, 10) } : {}),
      },
      select: profileSelect,
    });

    const { _count, ...rest } = row;
    return ok({
      ...rest,
      counts: { trips: _count.trips, savedDestinations: _count.savedDestinations },
      // The JWT still carries the old name/email until the client refreshes it.
      sessionStale: Boolean(body.name || email),
    });
  });
}

export async function DELETE() {
  return handle(async () => {
    const { user } = await requireRole();

    // Deleting the last admin would lock everyone out of the analytics screen.
    if (user.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (admins <= 1) throw new ApiError(422, "The last active admin account cannot be deleted");
    }

    // Cascades to trips (and their stops, items, expenses) and saved destinations.
    await prisma.user.delete({ where: { id: user.id } });
    return ok({ id: user.id });
  });
}
