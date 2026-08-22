"use client";

import Link from "next/link";
import { MapPin, Wallet, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { ImageFallback } from "@/components/image-fallback";
import { TiltCard } from "@/components/motion/tilt-card";
import { GlareOverlay } from "@/components/motion/glare-hover";
import { StatusBadge, CountdownPill } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { TripCard as TripCardData } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * S4 / S2 card. Cover image falls back to the first city's image, then to the
 * deterministic gradient — every one of those fields is nullable, so the chain
 * matters (docs/API_CONTRACT.md TripCard).
 */
export function TripCard({
  trip,
  daysUntil,
  onDelete,
  className,
}: {
  trip: TripCardData;
  daysUntil?: number;
  onDelete?: (trip: TripCardData) => void;
  className?: string;
}) {
  const cover = trip.coverPhotoUrl ?? trip.firstCityImage;

  return (
    <TiltCard className={cn("h-full", className)} amplitude={5}>
    <div className="hover-lift group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow)]">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative overflow-hidden">
          <GlareOverlay />
          <ImageFallback
            src={cover}
            name={trip.firstCityName ?? trip.name}
            variant="trip"
            className="aspect-[16/10] w-full transition-transform duration-[600ms] ease-[var(--ease)] group-hover:scale-[1.07]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-[var(--dur)] group-hover:opacity-100"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <StatusBadge status={trip.status} />
            {trip.isPublic && <Badge variant="primary">Shared</Badge>}
          </div>
          {daysUntil !== undefined && trip.status === "upcoming" && (
            <div className="absolute right-3 top-3">
              <CountdownPill daysUntil={daysUntil} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/trips/${trip.id}`} className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold leading-snug group-hover:text-primary">
              {trip.name}
            </h3>
          </Link>

          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Actions for ${trip.name}`}
                className="-mr-1 shrink-0 rounded-[var(--radius-sm)] p-1 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/trips/${trip.id}`}>
                    <Eye />
                    View itinerary
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/trips/${trip.id}/build`}>
                    <Pencil />
                    Edit trip
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem destructive onSelect={() => onDelete(trip)}>
                  <Trash2 />
                  Delete trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="mt-1 text-[13px] text-foreground-muted">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" size="md">
            <MapPin />
            {trip.stopCount} {trip.stopCount === 1 ? "stop" : "stops"}
          </Badge>
          <Badge variant="primary" size="md" className="tnum">
            <Wallet />
            {formatMoney(trip.totalCost)}
          </Badge>
        </div>
      </div>
    </div>
    </TiltCard>
  );
}
