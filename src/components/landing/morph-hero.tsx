"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Check } from "lucide-react";
import ScrollMorphHero, { type MorphCard } from "@/components/ui/scroll-morph-hero";
import { HERO, HERO_TRUST } from "@/config/landing";
import { EASE } from "@/lib/motion";

/**
 * The scroll-morph hero, fed with real catalog cities so the cards a visitor
 * flips are places the product can actually plan a trip to.
 *
 * The morph owns a bounded stretch of scroll and then hands the page back — see
 * the wheel handler in scroll-morph-hero.tsx. The CTAs sit below the canvas
 * rather than inside it so they are always reachable, including before the
 * animation has finished and for anyone on reduced motion.
 */
export function MorphHero({ cards }: { cards: MorphCard[] }) {
  return (
    <section className="relative">
      {/* Pulled above the section so the wash continues up behind the floating
          navbar. Anchored at top-0 it started exactly where the sticky header
          ended, drawing a hard grey seam across the page. */}
      <div
        aria-hidden
        className="hero-aura pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[860px]"
      />

      <div className="h-[clamp(440px,58vh,620px)] w-full">
        <ScrollMorphHero
          cards={cards}
          title={HERO.title}
          subtitle="Scroll to explore"
          arcTitle="31 cities. 310 things to do."
          arcSubtitle="Every destination below is in the catalog, with real costs and durations behind it — nothing here is a placeholder."
        />
      </div>

      {/* Lifted into the hollow under the arc so the headline reads as part of
          the hero rather than as the next section. `relative` keeps it above the
          canvas; the arc's ends still bracket it on either side. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
        className="page-shell relative z-10 -mt-[14vh] flex flex-col items-center gap-7 pb-4 text-center sm:-mt-[16vh]"
      >
        {/* The real, permanent <h1>. The one inside the morph canvas animates to
            opacity 0, so the page would otherwise be left with a heading that
            disappears — bad for a screen reader and for the crawler. This also
            fills the gap the arc leaves under its dip. */}
        <h1 className="display-1 max-w-4xl">
          Plan multi-city trips,{" "}
          <span className="display-accent text-primary">beautifully</span>
        </h1>

        <p className="max-w-2xl text-[17px] leading-[1.75] text-foreground-muted">
          {HERO.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={HERO.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-primary px-8 py-3.5 text-[15px] font-semibold text-primary-fg shadow-[var(--shadow)] transition-all hover:bg-primary-hover hover:shadow-[var(--shadow-hover)] active:scale-[.98]"
          >
            {HERO.primaryCta.label}
            <ArrowUpRight className="size-[18px]" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-surface px-8 py-3.5 text-[15px] font-semibold transition-all hover:bg-surface-muted active:scale-[.98]"
          >
            <Play className="size-4" />
            Sign in
          </Link>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {HERO_TRUST.map((point) => (
            <li key={point} className="flex items-center gap-2 text-[14px] text-foreground-muted">
              <Check className="size-4 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
