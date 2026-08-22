"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Luggage, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/trip-card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api";
import type { TripCard as TripCardData } from "@/lib/api";

const TABS = ["upcoming", "ongoing", "past", "all"] as const;
type Tab = (typeof TABS)[number];

const LABEL: Record<Tab, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  past: "Past",
  all: "All",
};

export function TripsBrowser({ trips }: { trips: TripCardData[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [pending, setPending] = useState<TripCardData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(
    () => ({
      upcoming: trips.filter((t) => t.status === "upcoming").length,
      ongoing: trips.filter((t) => t.status === "ongoing").length,
      past: trips.filter((t) => t.status === "past").length,
      all: trips.length,
    }),
    [trips],
  );

  const visible = tab === "all" ? trips : trips.filter((t) => t.status === tab);

  async function onDelete() {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.del(`/api/trips/${pending.id}`);
      toast.success(`"${pending.name}" deleted.`);
      setPending(null);
      router.refresh();
    } catch {
      toast.error("Could not delete that trip. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Luggage}
        title="No trips yet"
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
    );
  }

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-6">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {LABEL[t]}
              <span className="ml-1.5 tnum opacity-60">{counts[t]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title={`No ${LABEL[tab].toLowerCase()} trips`}
          description="Try another tab, or plan something new."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={setPending} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(o) => !o && setPending(null)}
        title={`Delete "${pending?.name}"?`}
        description="This removes the trip along with every stop, activity and expense on it. This cannot be undone."
        confirmLabel="Delete trip"
        loading={deleting}
        onConfirm={onDelete}
      />
    </>
  );
}
