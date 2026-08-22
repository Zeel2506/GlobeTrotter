import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/access";
import { itineraryById } from "@/lib/itinerary";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { BudgetScreen } from "./budget-screen";
import type { SessionUser } from "@/lib/api-helpers";

export const metadata: Metadata = { title: "Budget" };

// S9 — docs/SPEC.md. All figures come from the shared server budget engine.
export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user as SessionUser;

  const owner = await prisma.trip.findUnique({ where: { id }, select: { userId: true } });
  if (!owner || !canAccess(owner.userId, user)) notFound();

  const itinerary = await itineraryById(id);
  if (!itinerary) notFound();

  const expenses = await prisma.expense.findMany({
    where: { stop: { tripId: id } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: { stop: { include: { city: { select: { name: true } } } } },
  });

  return (
    <div className="page-shell"><div className="mx-auto max-w-[1120px]">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={`/trips/${id}`}>
          <ArrowLeft />
          Back to itinerary
        </Link>
      </Button>

      <PageHeader
        eyebrow={itinerary.trip.name}
        title="Budget & cost breakdown"
        description="Activity costs come from your itinerary. Add transport, stay and meals as expenses per stop."
      />

      <BudgetScreen
        tripId={id}
        budget={itinerary.budget}
        stops={itinerary.stops.map((s) => ({
          id: s.id,
          cityName: s.city.name,
          startDate: String(s.startDate),
          endDate: String(s.endDate),
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          stopId: e.stopId,
          stopCity: e.stop.city.name,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
          date: e.date ? e.date.toISOString().slice(0, 10) : null,
        }))}
      />
    </div>
    </div>
  );
}
