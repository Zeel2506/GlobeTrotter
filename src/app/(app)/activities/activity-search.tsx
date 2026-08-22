"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityCard } from "@/components/activity-card";
import { ActivityQuickView } from "@/components/activity-quick-view";
import { EmptyState } from "@/components/empty-state";
import { CategoryChip } from "@/components/category-chip";
import { ACTIVITY_CATEGORIES } from "@/config/category-colors";
import { api, qs, type ActivityRow, type Paged } from "@/lib/api";
import { cn } from "@/lib/cn";

const SORTS = [
  { value: "name", label: "A–Z" },
  { value: "cost", label: "Cheapest first" },
  { value: "durationHours", label: "Shortest first" },
] as const;

const selectClass =
  "h-10 rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-sm";

export function ActivitySearch({ cityId }: { cityId?: string }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [sort, setSort] = useState<string>("name");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paged<ActivityRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<ActivityRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paged<ActivityRow>>(
        `/api/activities${qs({
          cityId,
          q,
          category,
          maxCost,
          maxDuration,
          sort,
          dir: "asc",
          page,
          pageSize: 12,
        })}`,
      );
      setData(res);
    } catch {
      toast.error("Could not load activities.");
    } finally {
      setLoading(false);
    }
  }, [cityId, q, category, maxCost, maxDuration, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);



  /** Any filter change returns to page 1 — otherwise you can land on an empty
   *  page. Set at the origin of the change, not in an effect reacting to it. */
  function changeFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const hasFilters = Boolean(q || category || maxCost || maxDuration);
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={q}
            onChange={(e) => changeFilter(setQ, e.target.value)}
            placeholder="Search activities…"
            className="pl-9"
            aria-label="Search activities"
          />
        </div>

        <Input
          type="number"
          min={0}
          value={maxCost}
          onChange={(e) => changeFilter(setMaxCost, e.target.value)}
          placeholder="Max cost"
          className="w-32"
          aria-label="Maximum cost"
        />

        <Input
          type="number"
          min={0}
          step={0.5}
          value={maxDuration}
          onChange={(e) => changeFilter(setMaxDuration, e.target.value)}
          placeholder="Max hours"
          className="w-32"
          aria-label="Maximum duration in hours"
        />

        <select
          value={sort}
          onChange={(e) => changeFilter(setSort, e.target.value)}
          className={selectClass}
          aria-label="Sort activities"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setCategory("");
              setMaxCost("");
              setMaxDuration("");
              setPage(1);
            }}
          >
            <SlidersHorizontal />
            Clear
          </Button>
        )}
      </div>

      {/* Category chips double as the filter control — same colour+icon language
          as everywhere else, so the filter reads as the thing it filters. */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => changeFilter(setCategory, "")}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
            category === ""
              ? "bg-primary text-primary-fg"
              : "bg-surface-muted text-foreground-muted hover:text-foreground",
          )}
        >
          All
        </button>
        {ACTIVITY_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => changeFilter(setCategory, category === c ? "" : c)}
            aria-pressed={category === c}
            className={cn(
              "rounded-full transition-opacity",
              category && category !== c && "opacity-45 hover:opacity-80",
            )}
          >
            <CategoryChip category={c} />
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : data && data.rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No activities match those filters"
          description="Try widening the cost or duration limits, or clearing the category."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data?.rows.map((a) => (
            <ActivityCard key={a.id} activity={a} onQuickView={setQuickView} />
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="tnum text-sm text-foreground-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ActivityQuickView activity={quickView} onOpenChange={(o) => !o && setQuickView(null)} />
    </>
  );
}
