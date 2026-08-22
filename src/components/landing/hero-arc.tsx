"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Check } from "lucide-react";
import ArcHero, { type ArcCard } from "@/components/ui/arc-hero";
import { HERO, HERO_TRUST } from "@/config/landing";
import { EASE } from "@/lib/motion";

/**
 * The landing hero: a static arc of real catalog cities with the headline
 * sitting in the hollow beneath it.
 *
 * The arc does not animate and does not touch scroll. Only the cards react, and
 * only to hover.
 */
export function HeroArc({ cards }: { cards: ArcCard[] }) {
  return (
    <section className="relative">
      {/* Pulled above the section so the wash continues up behind the floating
          navbar rather than starting with a hard seam beneath it. */}
      <div
        aria-hidden
        className="hero-aura pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[900px]"
      />

      <div className="h-[clamp(480px,64vh,720px)] w-full">
        <ArcHero cards={cards} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
        className="page-shell relative z-10 -mt-[15vh] flex flex-col items-center gap-7 pb-4 text-center sm:-mt-[17vh]"
      >
        <h1 className="display-1 max-w-4xl">
          Plan multi-city trips,{" "}
          <span className="display-oblique text-primary">beautifully</span>
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
