import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Compass } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

// S2 — placeholder shell. Wired to GET /api/dashboard in phase F2; this exists
// now so the login redirect has a real destination to land on.
export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "traveller";

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${name}`}
        description="Your upcoming trips, recommended destinations and budget highlights land here."
        action={
          <Button asChild>
            <Link href="/trips/new">
              <Plus />
              Plan New Trip
            </Link>
          </Button>
        }
      />

      <EmptyState
        icon={Compass}
        title="Nothing planned yet"
        description="Create your first trip and start adding city stops — the itinerary, budget and share link all build from there."
        action={
          <Button asChild size="lg">
            <Link href="/trips/new">
              <Plus />
              Plan your first trip
            </Link>
          </Button>
        }
      />
    </div>
  );
}
