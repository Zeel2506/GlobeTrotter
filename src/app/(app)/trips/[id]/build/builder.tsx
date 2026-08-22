"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, MapPinPlus, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ItineraryItemRow } from "@/components/itinerary/item-row";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { moveItem } from "@/components/reorder-controls";
import { StopList, type StopRow } from "./stop-list";
import { AssignActivityDialog, type AssignTarget } from "./assign-activity-dialog";
import { AddStopDialog } from "./add-stop-dialog";
import { formatMoney, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import type { ItineraryDay } from "@/lib/itinerary";
import type { ItineraryItemView } from "@/lib/itinerary";

/**
 * S5 — the itinerary builder. Left rail is the ordered stop list, right pane is
 * the day-by-day assignment surface for the selected stop. The running trip
 * total is always visible, as the brief requires.
 */
export function Builder({
  tripId,
  tripName,
  tripStart,
  tripEnd,
  stops,
  days,
  grandTotal,
}: {
  tripId: string;
  tripName: string;
  tripStart: string;
  tripEnd: string;
  stops: StopRow[];
  days: ItineraryDay[];
  grandTotal: number;
}) {
  const router = useRouter();
  const [activeStopId, setActiveStopId] = useState<string | null>(stops[0]?.id ?? null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [addingStop, setAddingStop] = useState(false);
  const [pendingItem, setPendingItem] = useState<ItineraryItemView | null>(null);
  const [removing, setRemoving] = useState(false);
  const [dayItems, setDayItems] = useState<Record<string, ItineraryItemView[]>>({});

  const activeStop = stops.find((s) => s.id === activeStopId) ?? null;

  // Days belonging to the selected stop. The itinerary payload already assigns
  // each date to exactly one stop (D-04), so this is a filter, not a join.
  const stopDays = activeStop
    ? days.filter((d) => d.stop?.id === activeStop.id)
    : [];

  const itemsFor = (day: ItineraryDay) => dayItems[day.date] ?? day.items;

  async function reorderItems(day: ItineraryDay, from: number, to: number) {
    const current = itemsFor(day);
    const next = moveItem(current, from, to);
    setDayItems((prev) => ({ ...prev, [day.date]: next }));

    try {
      await api.post(`/api/stops/${day.stop!.id}/items/reorder`, {
        date: day.date,
        orderedItemIds: next.map((i) => i.id),
      });
      router.refresh();
    } catch {
      setDayItems((prev) => ({ ...prev, [day.date]: current }));
      toast.error("Could not reorder those activities.");
    }
  }

  async function removeItem() {
    if (!pendingItem) return;
    setRemoving(true);
    try {
      await api.del(`/api/items/${pendingItem.id}`);
      toast.success(`${pendingItem.activity.name} removed.`);
      setPendingItem(null);
      setDayItems({});
      router.refresh();
    } catch {
      toast.error("Could not remove that activity.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {/* Running total — always visible, per the brief. */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Wallet className="size-4" />
            Running trip total
          </div>
          <span className="tnum text-lg font-bold text-primary">{formatMoney(grandTotal)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Stops</CardTitle>
              <Button size="sm" variant="soft" onClick={() => setAddingStop(true)}>
                <Plus />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {stops.length === 0 ? (
                <p className="text-[13px] text-foreground-subtle">
                  No stops yet. Add the first city to start building.
                </p>
              ) : (
                <StopList
                  tripId={tripId}
                  stops={stops}
                  activeStopId={activeStopId}
                  onSelect={setActiveStopId}
                />
              )}
            </CardContent>
          </Card>
        </aside>

        <section>
          {stops.length === 0 ? (
            <EmptyState
              icon={MapPinPlus}
              title="Add your first city stop"
              description={`"${tripName}" has no stops yet. Pick a city and give it a date range — then you can start filling the days with activities.`}
              action={
                <Button size="lg" onClick={() => setAddingStop(true)}>
                  <Plus />
                  Add a city stop
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {stopDays.map((day) => {
                const items = itemsFor(day);
                return (
                  <Card key={day.date}>
                    <CardHeader className="flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Day {day.dayNumber}</CardTitle>
                        <p className="text-[13px] text-foreground-subtle">
                          {formatDate(day.date, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {day.dayTotal > 0 && (
                          <span className="tnum text-sm font-semibold text-foreground-muted">
                            {formatMoney(day.dayTotal)}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() =>
                            activeStop &&
                            setAssignTarget({
                              stopId: activeStop.id,
                              cityId: day.stop!.city.id,
                              cityName: day.stop!.city.name,
                              date: day.date,
                              minDate: activeStop.startDate.slice(0, 10),
                              maxDate: activeStop.endDate.slice(0, 10),
                            })
                          }
                        >
                          <Plus />
                          Activity
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {items.length === 0 ? (
                        <p className="rounded-[var(--radius)] border border-dashed border-border-strong px-3.5 py-3 text-[13px] text-foreground-subtle">
                          Nothing scheduled for this day yet.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {items.map((item, index) => (
                            <ItineraryItemRow
                              key={item.id}
                              item={item}
                              index={index}
                              total={items.length}
                              onMove={(dir) => reorderItems(day, index, index + dir)}
                              onRemove={() => setPendingItem(item)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AddStopDialog
        open={addingStop}
        onOpenChange={setAddingStop}
        tripId={tripId}
        tripStart={tripStart}
        tripEnd={tripEnd}
      />

      <AssignActivityDialog
        target={assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingItem)}
        onOpenChange={(o) => !o && setPendingItem(null)}
        title="Remove this activity?"
        description={pendingItem?.activity.name}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={removeItem}
      />
    </>
  );
}
