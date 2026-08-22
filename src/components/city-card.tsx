"use client";

import { Heart, Plus, TrendingUp, Ticket } from "lucide-react";
import { ImageFallback } from "@/components/image-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CityRow } from "@/lib/api";
import { cn } from "@/lib/cn";

/** costIndex is 1-100 relative daily cost (prisma/catalog.ts). Bucketed for a
 *  readable badge — the raw number alone means nothing to a first-time viewer. */
function costBand(costIndex: number): { label: string; variant: "success" | "warning" | "danger" } {
  if (costIndex <= 40) return { label: "Budget", variant: "success" };
  if (costIndex <= 70) return { label: "Moderate", variant: "warning" };
  return { label: "Pricey", variant: "danger" };
}

export function CityCard({
  city,
  saved,
  onToggleSave,
  onAddToTrip,
  className,
}: {
  city: CityRow;
  saved?: boolean;
  onToggleSave?: (city: CityRow) => void;
  onAddToTrip?: (city: CityRow) => void;
  className?: string;
}) {
  const band = costBand(city.costIndex);

  return (
    <div
      className={cn(
        "hover-lift group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow)]",
        className,
      )}
    >
      <div className="relative">
        <ImageFallback
          src={city.imageUrl}
          name={city.name}
          variant="city"
          className="aspect-[16/10] w-full"
        />

        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(city)}
            aria-label={saved ? `Remove ${city.name} from saved` : `Save ${city.name}`}
            aria-pressed={saved}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-surface/90 text-foreground-muted shadow-[var(--shadow-sm)] backdrop-blur transition-colors hover:text-danger"
          >
            <Heart className={cn("size-4", saved && "fill-danger text-danger")} />
          </button>
        )}

        <div className="absolute left-3 top-3">
          <Badge variant={band.variant} size="md">
            {band.label} · {city.costIndex}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-[17px] font-semibold leading-snug">{city.name}</h3>
        <p className="text-[13px] text-foreground-muted">
          {city.country} · {city.region}
        </p>

        {city.description && (
          <p className="mt-2 line-clamp-2 text-[13px] text-foreground-muted">{city.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <TrendingUp />
            {city.popularity} popularity
          </Badge>
          {city._count && (
            <Badge variant="outline">
              <Ticket />
              {city._count.activities} activities
            </Badge>
          )}
        </div>

        {onAddToTrip && (
          <Button
            variant="soft"
            size="sm"
            className="mt-4 w-full"
            onClick={() => onAddToTrip(city)}
          >
            <Plus />
            Add to Trip
          </Button>
        )}
      </div>
    </div>
  );
}
