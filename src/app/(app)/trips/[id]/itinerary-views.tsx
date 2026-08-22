"use client";

import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayTimeline } from "@/components/itinerary/day-timeline";
import { CalendarView } from "@/components/itinerary/calendar-view";
import type { ItineraryDay } from "@/lib/itinerary";

/** S6 ⇄ S10 toggle. Both modes render the same `days[]`; only layout differs. */
export function ItineraryViews({ days }: { days: ItineraryDay[] }) {
  const [view, setView] = useState<"timeline" | "calendar">("timeline");

  return (
    <>
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList className="mb-6">
          <TabsTrigger value="timeline">
            <span className="inline-flex items-center gap-1.5">
              <List className="size-3.5" />
              Timeline
            </span>
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Calendar
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "timeline" ? <DayTimeline days={days} /> : <CalendarView days={days} />}
    </>
  );
}
