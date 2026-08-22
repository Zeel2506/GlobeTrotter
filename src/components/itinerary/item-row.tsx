"use client";

import { Clock, StickyNote, Trash2 } from "lucide-react";
import { CategoryChip } from "@/components/category-chip";
import { ReorderControls } from "@/components/reorder-controls";
import { formatMoney, formatDuration } from "@/lib/format";
import type { ItineraryItemView } from "@/lib/itinerary";
import { cn } from "@/lib/cn";

/**
 * One scheduled activity. Read-only in the itinerary + public views; the builder
 * passes the edit callbacks to turn on reorder and remove.
 *
 * effectiveCost arrives already resolved server-side (costOverride ?? activity.cost)
 * — never recomputed here.
 */
export function ItineraryItemRow({
  item,
  index,
  total,
  onMove,
  onRemove,
  className,
}: {
  item: ItineraryItemView;
  index?: number;
  total?: number;
  onMove?: (direction: -1 | 1) => void;
  onRemove?: () => void;
  className?: string;
}) {
  const editable = Boolean(onMove || onRemove);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-[var(--radius)] border border-border bg-surface p-3",
        className,
      )}
    >
      <span className="tnum w-12 shrink-0 pt-0.5 text-[13px] font-semibold text-foreground-subtle">
        {item.startTime ?? "—"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.activity.name}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <CategoryChip category={item.activity.category} />
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
            <Clock className="size-3" />
            {formatDuration(item.activity.durationHours)}
          </span>
        </div>

        {item.notes && (
          <p className="mt-1.5 inline-flex items-start gap-1.5 text-[13px] text-foreground-muted">
            <StickyNote className="mt-px size-3.5 shrink-0" />
            {item.notes}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="tnum text-sm font-semibold">{formatMoney(item.effectiveCost)}</span>

        {editable && (
          <div className="flex items-center">
            {onMove && index !== undefined && total !== undefined && (
              <ReorderControls
                index={index}
                total={total}
                onMove={onMove}
                label={item.activity.name}
              />
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${item.activity.name}`}
                className="rounded-[var(--radius-sm)] p-1.5 text-foreground-subtle transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
