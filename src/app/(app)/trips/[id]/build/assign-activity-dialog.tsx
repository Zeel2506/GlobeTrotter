"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Check, SearchX } from "lucide-react";
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
import { CategoryChip } from "@/components/category-chip";
import { EmptyState } from "@/components/empty-state";
import { ImageFallback } from "@/components/image-fallback";
import { formatMoney, formatDuration, formatDate } from "@/lib/format";
import { api, qs, ApiClientError, type ActivityRow, type Paged } from "@/lib/api";
import { cn } from "@/lib/cn";

export type AssignTarget = {
  stopId: string;
  cityId: string;
  cityName: string;
  date: string;
  /** Bounds from the stop, so the date picker cannot produce a 422. */
  minDate: string;
  maxDate: string;
};

/**
 * Assign a catalog activity to a specific day of a stop.
 *
 * Scoped to the stop's city because the API rejects an activity that does not
 * belong to that city with a 422 — filtering by cityId here means the user never
 * sees a choice that would fail.
 */
export function AssignActivityDialog({
  target,
  onOpenChange,
}: {
  target: AssignTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ActivityRow | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(target);

  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await api.get<Paged<ActivityRow>>(
        `/api/activities${qs({ cityId: target.cityId, q, sort: "name", pageSize: 50 })}`,
      );
      setRows(res.rows);
    } catch {
      setError("Could not load activities for this city.");
    } finally {
      setLoading(false);
    }
  }, [target, q]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, load, q]);

  function reset() {
    setQ("");
    setSelected(null);
    setStartTime("");
    setError(null);
  }

  async function save() {
    if (!target || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/api/stops/${target.stopId}/items`, {
        activityId: selected.id,
        date: date || target.date,
        startTime: startTime || undefined,
      });

      // Signature moment #1 — confirmation toast on add.
      toast.success(`${selected.name} added to ${formatDate(date || target.date)}`);
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not add that activity.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add an activity in {target?.cityName}</DialogTitle>
          <DialogDescription>
            Pick from the catalog for this city, then choose the day and time.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <FormError message={error} />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search activities in ${target?.cityName ?? ""}…`}
              className="pl-9"
              aria-label="Search activities"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-[var(--radius)] border border-border">
            {loading && rows.length === 0 ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No activities found"
                description="Try a different search term."
                className="border-0 py-8"
              />
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(a)}
                      aria-pressed={selected?.id === a.id}
                      className={cn(
                        "flex w-full items-center gap-3 p-2.5 text-left transition-colors",
                        selected?.id === a.id ? "bg-primary-soft" : "hover:bg-surface-muted",
                      )}
                    >
                      <ImageFallback
                        src={a.imageUrl}
                        name={a.name}
                        variant="activity"
                        className="size-12 shrink-0 rounded-[var(--radius-sm)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <CategoryChip category={a.category} />
                          <span className="text-[11px] text-foreground-subtle">
                            {formatDuration(a.durationHours)}
                          </span>
                        </div>
                      </div>
                      <span className="tnum shrink-0 text-sm font-semibold">
                        {formatMoney(a.cost)}
                      </span>
                      {selected?.id === a.id && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && target && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Day" htmlFor="assign-date" required>
                <DateField
                  id="assign-date"
                  value={date || target.date}
                  min={target.minDate}
                  max={target.maxDate}
                  onChange={setDate}
                  clearable={false}
                />
              </Field>
              <Field label="Start time" htmlFor="assign-time" hint="Optional.">
                <Input
                  id="assign-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
            Add to itinerary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
