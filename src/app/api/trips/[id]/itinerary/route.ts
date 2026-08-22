import type { NextRequest } from "next/server";
import { handle, ok, requireRole, ApiError } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";
import { itineraryById } from "@/lib/itinerary";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);

    const itinerary = await itineraryById(id);
    if (!itinerary) throw new ApiError(404, "Trip not found");
    return ok(itinerary);
  });
}
