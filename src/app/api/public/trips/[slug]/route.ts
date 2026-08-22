import type { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/lib/api-helpers";
import { itineraryBySlug } from "@/lib/itinerary";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * PUBLIC — no session, no requireRole(), by design. This is the endpoint behind
 * /p/[slug]; the middleware whitelists that prefix and never touches /api at
 * all. Demo-critical: verify it logged out before shipping.
 *
 * A private trip returns 404 rather than 403 so an un-shared link leaks nothing
 * about whether the trip exists.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { slug } = await params;
    const itinerary = await itineraryBySlug(slug);
    if (!itinerary) throw new ApiError(404, "This trip is not shared publicly");

    // The owner's personal budget target and over-budget flags are private —
    // a viewer sees what the trip costs, not what the owner meant to spend.
    const { budgetTotal: _budgetTotal, ...trip } = itinerary.trip;

    return ok({
      trip,
      stops: itinerary.stops,
      days: itinerary.days,
      budget: {
        totals: itinerary.budget.totals,
        avgPerDay: itinerary.budget.avgPerDay,
        nights: itinerary.budget.nights,
        perDay: itinerary.budget.perDay.map((d) => ({ date: d.date, amount: d.amount })),
      },
    });
  });
}
