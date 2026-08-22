"use client";

import { useState } from "react";
import { MapPin, Ticket, Luggage, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The keystone component — docs/DESIGN_SYSTEM.md §9.
 *
 * Every image field in the schema is nullable (City.imageUrl, Activity.imageUrl,
 * Trip.coverPhotoUrl), so a missing image is the NORMAL case, not an error. This
 * renders a deterministic gradient derived from a hash of `name` — the same city
 * always gets the same gradient, across renders, reloads and users — with a
 * centred icon and initial.
 *
 * It is also the onError target, so a broken URL degrades into the same gradient
 * rather than a browser's broken-image icon. Rule 2 of the design system: no bare
 * <img> anywhere in this app.
 */

type Variant = "city" | "activity" | "trip";

const VARIANT_ICON: Record<Variant, LucideIcon> = {
  city: MapPin,
  activity: Ticket,
  trip: Luggage,
};

/** Warm, travel-flavoured hue pairs. Index chosen by hash, so it is stable. */
const GRADIENTS = [
  ["#0d9488", "#0891b2"],
  ["#0891b2", "#4338ca"],
  ["#f97316", "#db2777"],
  ["#d97706", "#ea580c"],
  ["#059669", "#0d9488"],
  ["#7c3aed", "#db2777"],
  ["#0284c7", "#7c3aed"],
  ["#ea580c", "#ca8a04"],
  ["#059669", "#65a30d"],
  ["#4338ca", "#0891b2"],
] as const;

/** FNV-1a. Small, stable, and no dependency — a name must always map to the
 *  same gradient or cards would flicker between renders. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function gradientFor(name: string): string {
  const [from, to] = GRADIENTS[hash(name) % GRADIENTS.length];
  const angle = (hash(name + "angle") % 4) * 45 + 135;
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

export type ImageFallbackProps = {
  src?: string | null;
  name: string;
  variant?: Variant;
  className?: string;
  /** Hide the icon+initial overlay — for large hero areas where text sits on top. */
  bare?: boolean;
  priority?: boolean;
};

export function ImageFallback({
  src,
  name,
  variant = "city",
  className,
  bare = false,
  priority = false,
}: ImageFallbackProps) {
  const [failed, setFailed] = useState(false);
  const Icon = VARIANT_ICON[variant];
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn("relative overflow-hidden bg-surface-muted", className)}
      style={showImage ? undefined : { backgroundImage: gradientFor(name) }}
    >
      {showImage ? (
        // Plain <img>: catalog images are arbitrary remote URLs and next/image
        // would need every host allow-listed in next.config. The onError handler
        // is what makes this safe — a dead URL falls back to the gradient.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        !bare && (
          <div
            aria-hidden
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/90"
          >
            <Icon className="h-[22%] max-h-8 min-h-4 w-auto opacity-90" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">
              {name.slice(0, 18)}
            </span>
          </div>
        )
      )}

      {/* Subtle inner edge so the tile reads as a surface, not a colour block */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" />
    </div>
  );
}
