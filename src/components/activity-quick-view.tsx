"use client";

import { Clock, MapPin, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryChip } from "@/components/category-chip";
import { ImageFallback } from "@/components/image-fallback";
import { formatMoney, formatDuration } from "@/lib/format";
import type { ActivityRow } from "@/lib/api";

export function ActivityQuickView({
  activity,
  onOpenChange,
  onAdd,
}: {
  activity: ActivityRow | null;
  onOpenChange: (open: boolean) => void;
  onAdd?: (a: ActivityRow) => void;
}) {
  return (
    <Dialog open={Boolean(activity)} onOpenChange={onOpenChange}>
      <DialogContent>
        {activity && (
          <>
            <ImageFallback
              src={activity.imageUrl}
              name={activity.name}
              variant="activity"
              className="aspect-[16/7] w-full rounded-t-[var(--radius-lg)]"
            />

            <DialogHeader>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <CategoryChip category={activity.category} size="md" />
                {activity.city && (
                  <Badge variant="outline" size="md">
                    <MapPin />
                    {activity.city.name}, {activity.city.country}
                  </Badge>
                )}
              </div>
              <DialogTitle>{activity.name}</DialogTitle>
            </DialogHeader>

            <DialogBody>
              {activity.description && (
                <p className="text-sm leading-relaxed text-foreground-muted">
                  {activity.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="primary" size="md" className="tnum">
                  {formatMoney(activity.cost)} per person
                </Badge>
                <Badge variant="outline" size="md">
                  <Clock />
                  {formatDuration(activity.durationHours)}
                </Badge>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onAdd && (
                <Button onClick={() => onAdd(activity)}>
                  <Plus />
                  Add to a day
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
