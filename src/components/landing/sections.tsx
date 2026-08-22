"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItineraryPreview } from "./itinerary-preview";

import { CountUp } from "@/components/motion/count-up";
import { HoverCard } from "@/components/motion/hover-card";
import {
  HERO,

  STATS,
  FEATURES,
  STEPS,
  CTA_BAND,
  FOOTER_COLUMNS,
  FOOTER_NOTE,
} from "@/config/landing";
import { riseIn, stagger, reveal } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** The CSS-built itinerary visual, promoted to its own band under the hero. */
export function PreviewBand() {
  return (
    <section id="builder" className="page-shell scroll-mt-28 pb-10 lg:pb-14">
      <div className="panel grid items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[.95fr_1.05fr] lg:px-14 lg:py-20">
        <motion.div {...reveal} variants={riseIn}>
          <p className="overline mb-3 text-primary">The itinerary builder</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Every day accounted for, every cost with it
          </h2>
          <p className="mt-4 max-w-lg text-foreground-muted">
            Stops in the order you travel them, activities on the day you do them, and a
            running total that never needs a spreadsheet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={HERO.primaryCta.href}>
                {HERO.primaryCta.label}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
            </Button>
          </div>
        </motion.div>

        <ItineraryPreview />
      </div>
    </section>
  );
}

export function StatsStrip() {
  return (
    <section className="page-shell pb-10 lg:pb-14">
      {/* A white panel floating on the grey canvas — the unit MakeMyTrip stacks
          its whole page out of. */}
      <motion.div
        {...reveal}
        variants={stagger(0.05)}
        className="panel grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x"
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={riseIn} className="px-4 py-10 text-center">
            <div className="tnum text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={s.value} suffix={s.suffix} duration={1.4} />
            </div>
            <div className="mt-2 text-[13px] text-foreground-muted">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="page-shell scroll-mt-28 pb-10 lg:pb-14">
      <div className="panel px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
      <motion.div {...reveal} variants={riseIn} className="mb-12 max-w-2xl">
        <p className="overline mb-3 text-primary">Everything in one place</p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          The parts of trip planning that usually live in five different tabs
        </h2>
      </motion.div>

      <motion.div
        {...reveal}
        variants={stagger(0.07)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              variants={riseIn}
              className={cn(f.span === "wide" && "lg:col-span-2")}
            >
              {/* Inside a white panel the cards need their own tone, or the
                  whole grid flattens into one sheet. */}
              <HoverCard className="h-full" spotlight={false}>
              <div className="group h-full rounded-[var(--radius-lg)] border border-border bg-surface-muted p-7">
                <span className="mb-5 flex size-12 items-center justify-center rounded-[var(--radius)] bg-primary-soft text-primary transition-transform duration-[var(--dur)] group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-foreground-muted">{f.body}</p>
              </div>
              </HoverCard>
            </motion.div>
          );
        })}
      </motion.div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="page-shell scroll-mt-28 pb-10 lg:pb-14">
      <div className="panel px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
        <motion.div {...reveal} variants={riseIn} className="mb-14 max-w-2xl">
          <p className="overline mb-3 text-primary">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Five steps from an idea to a shareable plan
          </h2>
        </motion.div>

        <motion.ol
          {...reveal}
          variants={stagger(0.08)}
          className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5"
        >
          {/* The connecting rule, drawn only on wide screens */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block"
          />
          {STEPS.map((step, i) => (
            <motion.li key={step.title} variants={riseIn} className="relative">
              <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-primary shadow-[var(--shadow-sm)]">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-foreground-muted">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="page-shell pb-10 pt-2 lg:pb-14">
      <motion.div
        {...reveal}
        variants={riseIn}
        className="relative overflow-hidden rounded-[var(--radius-xl)] bg-primary px-8 py-20 text-center text-primary-fg lg:py-24"
      >
        {/* Coral wash over the blue — the MakeMyTrip accent pairing. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_80%_0%,rgba(255,102,75,.4),transparent_60%)]"
        />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{CTA_BAND.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">{CTA_BAND.body}</p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-primary-hover hover:bg-white/90"
          >
            <Link href={CTA_BAND.cta.href}>
              {CTA_BAND.cta.label}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-[14px] leading-relaxed text-foreground-muted">
            Multi-city itineraries, a budget that keeps itself honest, and one link that
            shares the whole plan.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="overline mb-3 text-foreground-subtle">{col.heading}</h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-foreground-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="page-shell flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-[13px] text-foreground-subtle">{FOOTER_NOTE}</p>
          <p className="text-[13px] text-foreground-subtle">
            © {new Date().getFullYear()} GlobeTrotter
          </p>
        </div>
      </div>
    </footer>
  );
}
