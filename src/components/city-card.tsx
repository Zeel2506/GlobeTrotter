"use client";

import { motion } from "framer-motion";
import { Heart, Plus, TrendingUp, Ticket } from "lucide-react";
import { ImageFallback } from "@/components/image-fallback";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { GlareOverlay } from "@/components/motion/glare-hover";
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
    <SpotlightCard
      chrome={false}
      className={cn(
        "hover-lift group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow)]",
        className,
      )}
    >
      <div className="relative overflow-hidden">
        {/* Light sweeps across the photo on hover — the cue that reads as
            "premium" on a card without adding a single moving element. */}
        <GlareOverlay />

        {/* Slow zoom on hover — the imagery-forward pattern every travel product
            uses to make a destination feel like somewhere you could actually go. */}
        <ImageFallback
          src={city.imageUrl}
          name={city.name}
          variant="city"
          className="aspect-[16/10] w-full transition-transform duration-[600ms] ease-[var(--ease)] group-hover:scale-[1.07]"
        />

        {/* Scrim keeps the badges legible over any photo, and deepens on hover. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 opacity-70 transition-opacity duration-[var(--dur)] group-hover:opacity-90"
        />

        {onToggleSave && (
          <motion.button
            type="button"
            onClick={() => onToggleSave(city)}
            aria-label={saved ? `Remove ${city.name} from saved` : `Save ${city.name}`}
            aria-pressed={saved}
            whileTap={{ scale: 0.85 }}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground-muted shadow-[var(--shadow-sm)] backdrop-blur transition-colors hover:text-danger"
          >
            <motion.span
              // A saved heart pops once; it is the only reward for the action.
              key={String(saved)}
              initial={saved ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 14 }}
              className="flex"
            >
              <Heart className={cn("size-[18px]", saved && "fill-danger text-danger")} />
            </motion.span>
          </motion.button>
        )}

        <div className="absolute left-3 top-3">
          <Badge variant={band.variant} size="md">
            {band.label} · {city.costIndex}
          </Badge>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold leading-snug text-white drop-shadow-sm">
              {city.name}
            </h3>
            <p className="truncate text-[13px] text-white/80">
              {city.country} · {city.region}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {city.description && (
          <p className="line-clamp-2 text-[13px] text-foreground-muted">{city.description}</p>
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
            className="mt-4 w-full transition-colors group-hover:bg-primary group-hover:text-primary-fg"
            onClick={() => onAddToTrip(city)}
          >
            <Plus />
            Add to Trip
          </Button>
        )}
      </div>
    </SpotlightCard>
  );
}
