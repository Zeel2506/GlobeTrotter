"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, SlidersHorizontal, MapPinOff } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCard } from "@/components/city-card";
import { EmptyState } from "@/components/empty-state";
import { AddToTripDialog } from "@/components/add-to-trip-dialog";
import { api, qs, type CityRow, type Paged, type CityFacets } from "@/lib/api";

const SORTS = [
  { value: "popularity", label: "Most popular" },
  { value: "costIndex", label: "Cheapest first" },
  { value: "name", label: "A–Z" },
] as const;

export function CitySearch() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState<string>("popularity");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paged<CityRow> | null>(null);
  const [facets, setFacets] = useState<CityFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [addTarget, setAddTarget] = useState<CityRow | null>(null);

  useEffect(() => {
    api.get<CityFacets>("/api/cities/facets").then(setFacets).catch(() => {});
    api
      .get<{ rows: { cityId: string }[] }>("/api/saved-destinations")
      .then((r) => setSavedIds(new Set(r.rows.map((s) => s.cityId))))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dir = sort === "popularity" ? "desc" : "asc";
      const res = await api.get<Paged<CityRow>>(
        `/api/cities${qs({ q, country, region, sort, dir, page, pageSize: 12 })}`,
      );
      setData(res);
    } catch {
      toast.error("Could not load cities.");
    } finally {
      setLoading(false);
    }
  }, [q, country, region, sort, page]);

  // Debounce so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);


  async function toggleSave(city: CityRow) {
    const wasSaved = savedIds.has(city.id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(city.id);
      else next.add(city.id);
      return next;
    });

    try {
      if (wasSaved) await api.del(`/api/saved-destinations/${city.id}`);
      else await api.post("/api/saved-destinations", { cityId: city.id });
    } catch {
      // Roll the optimistic toggle back so the heart never lies.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(city.id);
        else next.delete(city.id);
        return next;
      });
      toast.error("Could not update your saved destinations.");
    }
  }


  /** Any filter change returns to page 1 — otherwise you can land on an empty
   *  page. Set at the origin of the change, not in an effect reacting to it. */
  function changeFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={q}
            onChange={(e) => changeFilter(setQ, e.target.value)}
            placeholder="Search a city or country…"
            className="pl-9"
            aria-label="Search cities"
          />
        </div>

        <Select
          value={country}
          onChange={(e) => changeFilter(setCountry, e.target.value)}
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {facets?.countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={region}
          onChange={(e) => changeFilter(setRegion, e.target.value)}
          aria-label="Filter by region"
        >
          <option value="">All regions</option>
          {facets?.regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <Select
          value={sort}
          onChange={(e) => changeFilter(setSort, e.target.value)}
          aria-label="Sort cities"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        {(q || country || region) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setCountry("");
              setRegion("");
              setPage(1);
            }}
          >
            <SlidersHorizontal />
            Clear
          </Button>
        )}
      </div>

      {loading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : data && data.rows.length === 0 ? (
        <EmptyState
          icon={MapPinOff}
          title="No cities match those filters"
          description="Try clearing a filter or searching for something broader."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data?.rows.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              saved={savedIds.has(city.id)}
              onToggleSave={toggleSave}
              onAddToTrip={setAddTarget}
            />
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

      <AddToTripDialog city={addTarget} onOpenChange={(o) => !o && setAddTarget(null)} />
    </>
  );
}
