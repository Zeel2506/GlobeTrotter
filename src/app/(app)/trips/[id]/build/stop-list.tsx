"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical, MapPin, Trash2, CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReorderControls, moveItem } from "@/components/reorder-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDateRange } from "@/lib/format";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export type StopRow = {
  id: string;
  order: number;
  cityName: string;
  country: string;
  startDate: string;
  endDate: string;
  itemCount: number;
};

/**
 * Ordered stop list with drag reorder AND arrow buttons.
 *
 * The arrows are not a fallback in the "nice to have" sense — DnD is unreliable
 * on touch, and the PDF requires the builder to work on a phone, so both paths
 * are first-class and both call the same /reorder endpoint.
 */
export function StopList({
  tripId,
  stops: initialStops,
  activeStopId,
  onSelect,
}: {
  tripId: string;
  stops: StopRow[];
  activeStopId: string | null;
  onSelect: (stopId: string) => void;
}) {
  const router = useRouter();
  const [stops, setStops] = useState(initialStops);
  const [pendingDelete, setPendingDelete] = useState<StopRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persist(next: StopRow[], previous: StopRow[]) {
    setStops(next);
    try {
      await api.post(`/api/trips/${tripId}/stops/reorder`, {
        orderedStopIds: next.map((s) => s.id),
      });
      router.refresh();
    } catch {
      setStops(previous); // Roll back so the list never lies about its order.
      toast.error("Could not reorder the stops.");
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = stops.findIndex((s) => s.id === active.id);
    const to = stops.findIndex((s) => s.id === over.id);
    persist(moveItem(stops, from, to), stops);
  }

  function onArrow(index: number, direction: -1 | 1) {
    persist(moveItem(stops, index, index + direction), stops);
  }

  async function removeStop() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.del(`/api/stops/${pendingDelete.id}`);
      setStops((prev) => prev.filter((s) => s.id !== pendingDelete.id));
      toast.success(`${pendingDelete.cityName} removed.`);
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Could not remove that stop.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {stops.map((stop, index) => (
              <SortableStop
                key={stop.id}
                stop={stop}
                index={index}
                total={stops.length}
                active={stop.id === activeStopId}
                onSelect={() => onSelect(stop.id)}
                onMove={(dir) => onArrow(index, dir)}
                onDelete={() => setPendingDelete(stop)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Remove ${pendingDelete?.cityName}?`}
        description="This deletes the stop along with every activity and expense recorded against it."
        confirmLabel="Remove stop"
        loading={deleting}
        onConfirm={removeStop}
      />
    </>
  );
}

function SortableStop({
  stop,
  index,
  total,
  active,
  onSelect,
  onMove,
  onDelete,
}: {
  stop: StopRow;
  index: number;
  total: number;
  active: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: stop.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative rounded-[var(--radius)] border bg-surface",
        active ? "border-primary ring-1 ring-primary" : "border-border",
        isDragging && "z-10 opacity-90 shadow-[var(--shadow-lg)]",
        // Visible drop indicator, per the design system's DnD rule.
        isOver && !isDragging && "before:absolute before:-top-1 before:left-0 before:right-0 before:h-0.5 before:rounded-full before:bg-primary",
      )}
    >
      <div className="flex items-center gap-1 p-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${stop.cityName} to reorder`}
          className="cursor-grab touch-none rounded-[var(--radius-sm)] p-1 text-foreground-subtle hover:bg-surface-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            {stop.cityName}
            <span className="truncate font-normal text-foreground-subtle">{stop.country}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground-subtle">
            <CalendarRange className="size-3" />
            {formatDateRange(stop.startDate, stop.endDate)}
          </p>
        </button>

        <Badge variant={stop.itemCount ? "primary" : "neutral"}>{stop.itemCount}</Badge>

        <ReorderControls
          index={index}
          total={total}
          onMove={onMove}
          label={stop.cityName}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={`Remove ${stop.cityName}`}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
