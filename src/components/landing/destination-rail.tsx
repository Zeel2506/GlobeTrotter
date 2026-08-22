"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from "lucide-react";
import { ImageFallback } from "@/components/image-fallback";
import { GlareOverlay } from "@/components/motion/glare-hover";
import { reveal, riseIn } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { CityRow } from "@/lib/api";

/**
 * The horizontal "collections" rail large travel portals use below the fold:
 * a section heading on the left, carousel arrows and a "view all" on the right,
 * and image cards whose title sits ON the photo rather than under it.
 *
 * Native scroll-snap rather than a carousel library — the arrows only nudge
 * scrollLeft, so it stays swipeable on touch and keyboard-reachable, and there
 * is no slide state that can desynchronise.
 */
export function DestinationRail({
  title,
  subtitle,
  cities,
  viewAllHref = "/cities",
  id,
}: {
  title: string;
  subtitle?: string;
  cities: CityRow[];
  viewAllHref?: string;
  id?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }

  function nudge(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  }

  if (cities.length === 0) return null;

  return (
    // Wrapped in the same .panel as every other band. Previously the scroller
    // used a negative margin to bleed past the page gutter, so the rail's cards
    // ran off the right edge while the panels above and below stayed inset —
    // which is what made the sections look like different widths.
    <section id={id} className="page-shell scroll-mt-28 pb-10 lg:pb-14">
      <div className="panel px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
      <motion.div
        {...reveal}
        variants={riseIn}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-foreground-muted">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={viewAllHref}
            className="mr-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
          {/* Arrows are a convenience over a natively scrollable list, so they are
              hidden from assistive tech rather than duplicating the scroll. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(-1)}
            disabled={atStart}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-border bg-surface transition-all",
              atStart ? "cursor-default opacity-35" : "hover:border-primary hover:text-primary",
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(1)}
            disabled={atEnd}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-border bg-surface transition-all",
              atEnd ? "cursor-default opacity-35" : "hover:border-primary hover:text-primary",
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </motion.div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city, i) => (
          <Link
            key={city.id}
            href={`/cities?q=${encodeURIComponent(city.name)}`}
            className="group relative aspect-[3/4] w-[210px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow)] transition-transform duration-[var(--dur)] hover:-translate-y-1 sm:w-[240px]"
          >
            <GlareOverlay />
            <ImageFallback
              src={city.imageUrl}
              name={city.name}
              variant="city"
              className="size-full transition-transform duration-[700ms] ease-[var(--ease)] group-hover:scale-110"
            />
            {/* Heavier at the base so the overlaid title stays readable on any photo. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
            />

            <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-foreground shadow-sm">
              TOP {i + 1}
            </span>

            <div className="absolute inset-x-3 bottom-3">
              <p className="flex items-center gap-1 text-[12px] font-medium text-white/85">
                <MapPin className="size-3" />
                {city.country}
              </p>
              <h3 className="mt-0.5 text-[17px] font-bold leading-tight text-white">
                {city.name}
              </h3>
              <p className="mt-1 text-[12px] text-white/75">
                {city._count?.activities ?? 0} things to do · cost index {city.costIndex}
              </p>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </section>
  );
}
