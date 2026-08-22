"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CategoryDot } from "@/components/category-chip";
import { ItineraryItemRow } from "./item-row";
import { formatMoney, formatDate } from "@/lib/format";
import type { ItineraryDay } from "@/lib/itinerary";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-first weekday index for a UTC calendar day. */
function mondayIndex(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  return (d.getUTCDay() + 6) % 7;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * S10 — the calendar half of the timeline ⇄ calendar toggle. Renders the exact
 * same `days[]` the timeline does; only the layout differs.
 *
 * Trips can span a month boundary, so this groups into month blocks rather than
 * assuming one grid.
 */
export function CalendarView({ days }: { days: ItineraryDay[] }) {
  const [openDate, setOpenDate] = useState<string | null>(null);

  const months = useMemo(() => {
    const map = new Map<string, ItineraryDay[]>();
    for (const day of days) {
      const key = monthKey(day.date);
      const bucket = map.get(key);
      if (bucket) bucket.push(day);
      else map.set(key, [day]);
    }
    return [...map.entries()];
  }, [days]);

  return (
    <div className="flex flex-col gap-8">
      {months.map(([month, monthDays]) => (
        <section key={month}>
          <h3 className="mb-3 text-[15px] font-semibold">
            {formatDate(monthDays[0].date, { month: "long", year: "numeric", day: undefined })}
          </h3>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle"
              >
                {w}
              </div>
            ))}

            {/* Blank cells so day 1 lands under the right weekday. */}
            {Array.from({ length: mondayIndex(monthDays[0].date) }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {monthDays.map((day) => {
              const dayNum = Number(day.date.slice(8, 10));
              const planned = Boolean(day.stop);

              return (
                <Popover
                  key={day.date}
                  open={openDate === day.date}
                  onOpenChange={(o) => setOpenDate(o ? day.date : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Day ${day.dayNumber}, ${day.items.length} activities`}
                      className={cn(
                        "flex min-h-20 flex-col items-start gap-1 rounded-[var(--radius)] border p-1.5 text-left transition-colors",
                        planned
                          ? "border-border bg-surface hover:border-primary"
                          : "border-dashed border-border bg-surface-muted/50",
                      )}
                    >
                      <span className="tnum text-[12px] font-bold">{dayNum}</span>

                      {day.stop && (
                        <span className="w-full truncate text-[10px] font-medium text-primary">
                          {day.stop.city.name}
                        </span>
                      )}

                      {day.items.length > 0 && (
                        <>
                          <span className="flex flex-wrap gap-0.5">
                            {day.items.slice(0, 4).map((i) => (
                              <CategoryDot key={i.id} category={i.activity.category} />
                            ))}
                          </span>
                          <span className="tnum mt-auto text-[10px] font-semibold text-foreground-muted">
                            {formatMoney(day.dayTotal)}
                          </span>
                        </>
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-80">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Day {day.dayNumber}</p>
                        <p className="text-[13px] text-foreground-subtle">
                          {formatDate(day.date, {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                      {day.dayTotal > 0 && (
                        <span className="tnum text-sm font-semibold">
                          {formatMoney(day.dayTotal)}
                        </span>
                      )}
                    </div>

                    {day.stop ? (
                      <p className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                        <MapPin className="size-3.5" />
                        {day.stop.city.name}, {day.stop.city.country}
                      </p>
                    ) : (
                      <p className="mb-3 text-[13px] text-foreground-subtle">
                        No stop covers this day.
                      </p>
                    )}

                    {day.items.length > 0 ? (
                      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                        {day.items.map((item) => (
                          <ItineraryItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-foreground-subtle">
                        Nothing scheduled yet.
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
