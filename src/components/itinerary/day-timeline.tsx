"use client";

import { MapPin, CalendarOff, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ItineraryItemRow } from "./item-row";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";
import type { ItineraryDay } from "@/lib/itinerary";
import { riseIn, stagger, reveal } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * The dominant travel-app pattern: a vertical day timeline with city headers.
 * Shared by the itinerary view, the builder preview and the public page — one
 * payload, one renderer (docs/API_CONTRACT.md W3).
 */
export function DayTimeline({
  days,
  onAddActivity,
  className,
}: {
  days: ItineraryDay[];
  onAddActivity?: (day: ItineraryDay) => void;
  className?: string;
}) {
  return (
    <motion.ol
      {...reveal}
      variants={stagger(0.04)}
      className={cn("relative flex flex-col gap-5", className)}
    >
      {/* The spine. Sits behind the day markers. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-[15px] top-2 w-px bg-border"
      />

      {days.map((day) => (
        <motion.li key={day.date} variants={riseIn} className="relative pl-10">
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border text-[11px] font-bold",
              day.stop
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface-muted text-foreground-subtle",
            )}
          >
            {day.dayNumber}
          </span>

          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-snug">
                {day.stop ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" />
                    {day.stop.city.name}
                    <span className="font-normal text-foreground-muted">
                      {day.stop.city.country}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-foreground-subtle">
                    <CalendarOff className="size-4" />
                    No city planned
                  </span>
                )}
              </h3>
              <p className="text-[13px] text-foreground-subtle">
                {formatDate(day.date, { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>

            {day.dayTotal > 0 && (
              <span className="tnum text-sm font-semibold text-foreground-muted">
                {formatMoney(day.dayTotal)}
              </span>
            )}
          </div>

          {day.items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {day.items.map((item) => (
                <ItineraryItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyDayRow day={day} onAddActivity={onAddActivity} />
          )}
        </motion.li>
      ))}
    </motion.ol>
  );
}

/**
 * A day with nothing on it. The API deliberately returns gap days with
 * `stop: null` (DECISIONS.md D-05) because a planning gap is exactly what the
 * traveller needs to see — so it gets a real, honest state rather than being
 * silently dropped.
 */
export function EmptyDayRow({
  day,
  onAddActivity,
}: {
  day: ItineraryDay;
  onAddActivity?: (day: ItineraryDay) => void;
}) {
  const noCity = !day.stop;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-dashed border-border-strong px-3.5 py-3">
      <p className="text-[13px] text-foreground-subtle">
        {noCity
          ? "This day is not covered by any stop yet."
          : "Nothing scheduled for this day."}
      </p>
      {onAddActivity && !noCity && (
        <Button variant="ghost" size="sm" onClick={() => onAddActivity(day)}>
          <Plus />
          Add activity
        </Button>
      )}
    </div>
  );
}
