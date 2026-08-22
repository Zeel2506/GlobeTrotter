import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, requireRole, logActivity, notify, ApiError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Copy Trip: deep clone a publicly shared trip into the caller's account.
 * Reading the trip needs no session; copying it does.
 *
 * The clone is private and slug-less — copying someone's trip must not
 * re-publish it under a new link.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { slug } = await params;

    const source = await prisma.trip.findUnique({
      where: { publicSlug: slug },
      include: {
        user: { select: { id: true, name: true } },
        stops: {
          orderBy: { order: "asc" },
          include: { items: { orderBy: [{ date: "asc" }, { order: "asc" }] }, expenses: true },
        },
      },
    });
    if (!source || !source.isPublic) throw new ApiError(404, "This trip is not shared publicly");

    const copy = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          userId: user.id,
          name: `${source.name} (Copy)`,
          description: source.description,
          startDate: source.startDate,
          endDate: source.endDate,
          coverPhotoUrl: source.coverPhotoUrl,
          budgetTotal: source.budgetTotal,
          isPublic: false,
          publicSlug: null,
        },
      });

      for (const stop of source.stops) {
        const newStop = await tx.stop.create({
          data: {
            tripId: trip.id,
            cityId: stop.cityId,
            startDate: stop.startDate,
            endDate: stop.endDate,
            order: stop.order,
            notes: stop.notes,
          },
        });

        if (stop.items.length > 0) {
          await tx.itineraryItem.createMany({
            data: stop.items.map((i) => ({
              stopId: newStop.id,
              activityId: i.activityId,
              date: i.date,
              startTime: i.startTime,
              costOverride: i.costOverride,
              notes: i.notes,
              order: i.order,
            })),
          });
        }

        if (stop.expenses.length > 0) {
          await tx.expense.createMany({
            data: stop.expenses.map((e) => ({
              stopId: newStop.id,
              category: e.category,
              description: e.description,
              amount: e.amount,
              date: e.date,
            })),
          });
        }
      }

      return trip;
    });

    await logActivity({
      action: "TRIP_COPIED",
      entityType: "Trip",
      entityId: copy.id,
      message: `${user.name} copied "${source.name}" from ${source.user.name}`,
      userId: user.id,
    });

    // Copying your own trip should not notify you about it.
    if (source.user.id !== user.id) {
      await notify({
        userIds: [source.user.id],
        title: "Someone copied your trip",
        body: `${user.name} copied "${source.name}" into their own plans.`,
        link: `/p/${slug}`,
      });
    }

    return ok({ id: copy.id, name: copy.name, stopCount: source.stops.length }, 201);
  });
}
