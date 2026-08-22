"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The arrow fallback for every reorderable row — DESIGN_SYSTEM.md §8.
 *
 * These are NOT a progressive-enhancement afterthought. They are the primary
 * guarantee that reorder works on a phone, where drag-and-drop is unreliable,
 * and they hit the same /reorder endpoint the drag does. Always rendered.
 */
export function ReorderControls({
  index,
  total,
  onMove,
  label,
  className,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  label: string;
  className?: string;
}) {
  const btn =
    "rounded-[var(--radius-sm)] p-1 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className={cn("flex flex-col", className)}>
      <button
        type="button"
        className={btn}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={`Move ${label} up`}
      >
        <ChevronUp className="size-3.5" />
      </button>
      <button
        type="button"
        className={btn}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        aria-label={`Move ${label} down`}
      >
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  );
}

/** Move an item within an array, returning a new array. Used by both reorder paths. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
