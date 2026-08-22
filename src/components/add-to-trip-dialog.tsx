"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/ui/field";
import { api, ApiClientError, type CityRow, type TripCard, type Paged } from "@/lib/api";
import { formatDate } from "@/lib/format";

/**
 * S7 "Add to Trip" — pick a trip, give the stop a date range, POST a Stop.
 * The API guards that the stop range sits inside the trip range, so the date
 * inputs are clamped to the selected trip's dates to prevent the 422 up front.
 *
 * State is set where each change originates (the select's onChange, the fetch
 * callback) rather than in effects reacting to it — synchronous setState inside
 * an effect causes cascading renders.
 */
export function AddToTripDialog({
  city,
  onOpenChange,
}: {
  city: CityRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [tripId, setTripId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(city);
  const selected = trips.find((t) => t.id === tripId);

  /** Selecting a trip defaults the stop range to that trip's own dates. */
  function selectTrip(id: string, from: TripCard[] = trips) {
    setTripId(id);
    const trip = from.find((t) => t.id === id);
    setStartDate(trip ? trip.startDate.slice(0, 10) : "");
    setEndDate(trip ? trip.endDate.slice(0, 10) : "");
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    api
      .get<Paged<TripCard>>("/api/trips?filter=all&pageSize=100")
      .then((res) => {
        if (cancelled) return;
        setTrips(res.rows);
        setError(null);
        // Preselect when there is only one trip — saves the obvious click.
        if (res.rows.length === 1) selectTrip(res.rows[0].id, res.rows);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your trips.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit() {
    if (!city || !tripId) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/trips/${tripId}/stops`, {
        cityId: city.id,
        startDate,
        endDate,
      });
      toast.success(`${city.name} added to "${selected?.name}"`, {
        action: { label: "Open builder", onClick: () => router.push(`/trips/${tripId}/build`) },
      });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not add that stop. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Add {city?.name} to a trip</DialogTitle>
          <DialogDescription>
            This creates a stop with its own date range inside the trip.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <FormError message={error} />

          {trips.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              You have no trips yet. Create one first, then add stops to it.
            </p>
          ) : (
            <>
              <Field label="Trip" htmlFor="trip" required>
                <select
                  id="trip"
                  value={tripId}
                  onChange={(e) => selectTrip(e.target.value)}
                  className="h-10 w-full rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-sm"
                >
                  <option value="">Choose a trip…</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({formatDate(t.startDate)} – {formatDate(t.endDate)})
                    </option>
                  ))}
                </select>
              </Field>

              {selected && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Arrive" htmlFor="stop-start" required>
                    <Input
                      id="stop-start"
                      type="date"
                      value={startDate}
                      min={selected.startDate.slice(0, 10)}
                      max={selected.endDate.slice(0, 10)}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Leave" htmlFor="stop-end" required>
                    <Input
                      id="stop-end"
                      type="date"
                      value={endDate}
                      min={startDate || selected.startDate.slice(0, 10)}
                      max={selected.endDate.slice(0, 10)}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            loading={loading}
            disabled={!tripId || !startDate || !endDate}
          >
            <Check />
            Add stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
