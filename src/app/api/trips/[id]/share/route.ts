import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole, logActivity } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Readable prefix + 12 random base36 characters (~62 bits). Readable enough to
 * paste into a chat, unguessable enough that the trip is not enumerable — the
 * slug is the only thing protecting a public trip.
 */
function generateSlug(name: string) {
  const prefix =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "trip";
  const suffix = BigInt(`0x${randomBytes(9).toString("hex")}`).toString(36).slice(0, 12);
  return `${prefix}-${suffix}`;
}

function publicUrl(req: NextRequest, slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
  return `${base}/p/${slug}`;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const trip = await requireTrip(id, user);

    // Re-sharing reuses the existing slug so links handed out earlier come back
    // to life instead of dying (docs/DECISIONS.md D-09).
    let slug = trip.publicSlug;
    if (!slug) {
      for (let attempt = 0; attempt < 5 && !slug; attempt++) {
        const candidate = generateSlug(trip.name);
        const taken = await prisma.trip.findUnique({ where: { publicSlug: candidate } });
        if (!taken) slug = candidate;
      }
      if (!slug) slug = `trip-${randomBytes(12).toString("hex")}`;
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: { isPublic: true, publicSlug: slug },
    });

    await logActivity({
      action: "TRIP_SHARED",
      entityType: "Trip",
      entityId: id,
      message: `${user.name} shared "${trip.name}" publicly`,
      userId: user.id,
    });

    return ok({
      isPublic: true,
      publicSlug: updated.publicSlug,
      url: publicUrl(req, updated.publicSlug!),
    });
  });
}
