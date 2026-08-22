// One owner-or-ADMIN guard, reused by every trip/stop/item/expense route so
// nested resources resolve up to their trip in exactly one place.
//
// Other people's trips return 404, not 403, so trip ids are not enumerable.
// See docs/DECISIONS.md D-10.
import { prisma } from "@/lib/prisma";
import { ApiError, type SessionUser } from "@/lib/api-helpers";

export function canAccess(ownerId: string, user: SessionUser) {
  return ownerId === user.id || user.role === "ADMIN";
}

/** Trip must exist and belong to the caller (or the caller is ADMIN). */
export async function requireTrip(tripId: string, user: SessionUser) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || !canAccess(trip.userId, user)) throw new ApiError(404, "Trip not found");
  return trip;
}

/** Stop must exist and its trip must be accessible. Returns stop + its trip. */
export async function requireStop(stopId: string, user: SessionUser) {
  const stop = await prisma.stop.findUnique({ where: { id: stopId }, include: { trip: true } });
  if (!stop || !canAccess(stop.trip.userId, user)) throw new ApiError(404, "Stop not found");
  return stop;
}

/** Itinerary item must exist and its trip must be accessible. */
export async function requireItem(itemId: string, user: SessionUser) {
  const item = await prisma.itineraryItem.findUnique({
    where: { id: itemId },
    include: { stop: { include: { trip: true } } },
  });
  if (!item || !canAccess(item.stop.trip.userId, user)) throw new ApiError(404, "Item not found");
  return item;
}

/** Expense must exist and its trip must be accessible. */
export async function requireExpense(expenseId: string, user: SessionUser) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { stop: { include: { trip: true } } },
  });
  if (!expense || !canAccess(expense.stop.trip.userId, user)) {
    throw new ApiError(404, "Expense not found");
  }
  return expense;
}
