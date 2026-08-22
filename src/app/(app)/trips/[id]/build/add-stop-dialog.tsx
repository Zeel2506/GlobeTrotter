"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Check, MapPinOff } from "lucide-react";
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
import { DateField } from "@/components/ui/date-field";
import { Field, FormError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ImageFallback } from "@/components/image-fallback";
import { api, qs, ApiClientError, type CityRow, type Paged } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Add a city stop. Dates are clamped to the trip range so the API guard
 *  (stop range must sit inside the trip range) cannot fire. */
export function AddStopDialog({
  open,
  onOpenChange,
  tripId,
  tripStart,
  tripEnd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripStart: string;
  tripEnd: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CityRow | null>(null);
  const [startDate, setStartDate] = useState(tripStart.slice(0, 10));
  const [endDate, setEndDate] = useState(tripEnd.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paged<CityRow>>(
        `/api/cities${qs({ q, sort: "popularity", dir: "desc", pageSize: 40 })}`,
      );
      setRows(res.rows);
    } catch {
      setError("Could not load cities.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, load, q]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/api/trips/${tripId}/stops`, {
        cityId: selected.id,
        startDate,
        endDate,
      });
      toast.success(`${selected.name} added to the trip.`);
      setQ("");
      setSelected(null);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not add that stop.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add a city stop</DialogTitle>
          <DialogDescription>
            Choose a city and the dates you will be there. It must sit inside the trip dates.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <FormError message={error} />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a city or country…"
              className="pl-9"
              aria-label="Search cities"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-[var(--radius)] border border-border">
            {loading && rows.length === 0 ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={MapPinOff}
                title="No cities found"
                description="Try a different search."
                className="border-0 py-8"
              />
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      aria-pressed={selected?.id === c.id}
                      className={cn(
                        "flex w-full items-center gap-3 p-2.5 text-left transition-colors",
                        selected?.id === c.id ? "bg-primary-soft" : "hover:bg-surface-muted",
                      )}
                    >
                      <ImageFallback
                        src={c.imageUrl}
                        name={c.name}
                        variant="city"
                        className="size-11 shrink-0 rounded-[var(--radius-sm)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="text-[11px] text-foreground-subtle">
                          {c.country} · {c.region}
                        </p>
                      </div>
                      <Badge variant="outline">Cost {c.costIndex}</Badge>
                      {selected?.id === c.id && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Arrive" htmlFor="stop-start" required>
                <DateField
                  id="stop-start"
                  value={startDate}
                  min={tripStart.slice(0, 10)}
                  max={tripEnd.slice(0, 10)}
                  onChange={setStartDate}
                  placeholder="Arrival date"
                />
              </Field>
              <Field label="Leave" htmlFor="stop-end" required>
                <DateField
                  id="stop-end"
                  value={endDate}
                  min={startDate}
                  max={tripEnd.slice(0, 10)}
                  onChange={setEndDate}
                  placeholder="Departure date"
                />
              </Field>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!selected}>
            <Check />
            Add stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
