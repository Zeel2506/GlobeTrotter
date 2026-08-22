"use client";

import { Clock, MapPin, Plus } from "lucide-react";
import { ImageFallback } from "@/components/image-fallback";
import { CategoryChip } from "@/components/category-chip";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { GlareOverlay } from "@/components/motion/glare-hover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDuration } from "@/lib/format";
import type { ActivityRow } from "@/lib/api";
import { cn } from "@/lib/cn";

export function ActivityCard({
  activity,
  onQuickView,
  onAdd,
  className,
}: {
  activity: ActivityRow;
  onQuickView?: (a: ActivityRow) => void;
  onAdd?: (a: ActivityRow) => void;
  className?: string;
}) {
  return (
    <SpotlightCard
      chrome={false}
      className={cn(
        "hover-lift group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onQuickView?.(activity)}
        className="relative block overflow-hidden text-left"
        aria-label={`Quick view ${activity.name}`}
      >
        <GlareOverlay />
        <ImageFallback
          src={activity.imageUrl}
          name={activity.name}
          variant="activity"
          className="aspect-[16/10] w-full transition-transform duration-[600ms] ease-[var(--ease)] group-hover:scale-[1.07]"
        />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <CategoryChip category={activity.category} />
        </div>

        <button
          type="button"
          onClick={() => onQuickView?.(activity)}
          className="text-left text-[15px] font-semibold leading-snug hover:text-primary"
        >
          {activity.name}
        </button>

        {activity.city && (
          <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-foreground-muted">
            <MapPin className="size-3.5" />
            {activity.city.name}, {activity.city.country}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="md" className="tnum">
            {formatMoney(activity.cost)}
          </Badge>
          <Badge variant="outline">
            <Clock />
            {formatDuration(activity.durationHours)}
          </Badge>
        </div>

        {onAdd && (
          <Button variant="soft" size="sm" className="mt-4 w-full" onClick={() => onAdd(activity)}>
            <Plus />
            Add to a day
          </Button>
        )}
      </div>
    </SpotlightCard>
  );
}
