"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItineraryPreview } from "./itinerary-preview";
import { HeroSearch } from "./hero-search";
import { RotatingText } from "@/components/motion/rotating-text";
import { CountUp } from "@/components/motion/count-up";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import {
  HERO,
  HERO_DESTINATIONS,
  STATS,
  FEATURES,
  STEPS,
  CTA_BAND,
  FOOTER_COLUMNS,
  FOOTER_NOTE,
} from "@/config/landing";
import { riseIn, stagger, reveal } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Sand → teal wash. Pure CSS, so nothing to load and nothing to break. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_15%_-10%,#ffedd5_0%,transparent_55%),radial-gradient(90%_70%_at_95%_0%,#ccfbf1_0%,transparent_60%)]"
      />

      {/* Centred headline over a full-bleed wash, with the planner card straddling
          the section below it — the arrangement every large travel portal uses,
          because the search box is the product's front door. */}
      <div className="page-shell pb-4 pt-14 text-center lg:pt-20">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          <motion.p variants={riseIn} className="overline mb-4 text-primary">
            {HERO.eyebrow}
          </motion.p>

          {/* The destination rotates through real catalog cities, so the headline
              advertises the thing the product actually contains. */}
          <motion.h1 variants={riseIn} className="display-1">
            Your trip to{" "}
            <span className="relative inline-flex text-primary">
              <RotatingText
                texts={HERO_DESTINATIONS}
                rotationInterval={2600}
                staggerFrom="first"
                mainClassName="overflow-hidden"
                splitLevelClassName="overflow-hidden pb-1"
              />
            </span>
            <br />
            starts here
          </motion.h1>

          <motion.p
            variants={riseIn}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-foreground-muted"
          >
            {HERO.subtitle}
          </motion.p>
        </motion.div>
      </div>

      <div className="page-shell pb-16">
        <div className="mx-auto max-w-5xl">
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}

/** The CSS-built itinerary visual, promoted to its own band under the hero. */
export function PreviewBand() {
  return (
    <section className="border-t border-border bg-surface-muted/40">
      <div className="page-shell grid items-center gap-10 py-16 lg:grid-cols-[.95fr_1.05fr] lg:py-20">
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
    <section className="border-y border-border bg-surface/60">
      <motion.div
        {...reveal}
        variants={stagger(0.05)}
        className="page-shell grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x"
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={riseIn} className="px-2 py-7 text-center">
            <div className="tnum text-2xl font-bold text-primary sm:text-3xl">
              <CountUp to={s.value} suffix={s.suffix} duration={1.4} />
            </div>
            <div className="mt-1 text-[13px] text-foreground-muted">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="page-shell py-20 lg:py-28">
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
              <SpotlightCard
                chrome={false}
                className="hover-lift group h-full rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-[var(--shadow)]"
              >
                <span className="mb-5 flex size-11 items-center justify-center rounded-[14px] bg-primary-soft text-primary-hover transition-transform duration-[var(--dur)] group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-foreground-muted">{f.body}</p>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-surface-muted/50">
      <div className="page-shell py-20 lg:py-28">
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
    <section className="page-shell py-20 lg:py-24">
      <motion.div
        {...reveal}
        variants={riseIn}
        className="relative overflow-hidden rounded-[var(--radius-xl)] bg-primary px-8 py-16 text-center text-primary-fg"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_80%_0%,rgba(249,115,22,.35),transparent_60%)]"
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
    <footer className="border-t border-border bg-surface">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
              <Globe2 className="size-[18px]" />
            </span>
            <span className="text-[17px] tracking-tight">GlobeTrotter</span>
          </Link>
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
