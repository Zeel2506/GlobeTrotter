"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItineraryPreview } from "./itinerary-preview";
import {
  HERO,
  STATS,
  FEATURES,
  STEPS,
  CTA_BAND,
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

      <div className="page-shell grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          <motion.p variants={riseIn} className="overline mb-4 text-primary">
            {HERO.eyebrow}
          </motion.p>
          <motion.h1 variants={riseIn} className="display-1">
            {HERO.title}
          </motion.h1>
          <motion.p
            variants={riseIn}
            className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-muted"
          >
            {HERO.subtitle}
          </motion.p>
          <motion.div variants={riseIn} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={HERO.primaryCta.href}>
                {HERO.primaryCta.label}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={HERO.secondaryCta.href}>{HERO.secondaryCta.label}</Link>
            </Button>
          </motion.div>
        </motion.div>

        <div className="lg:pl-6">
          <ItineraryPreview />
        </div>
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
            <div className="tnum text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
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
              className={cn(
                "hover-lift rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-[var(--shadow)]",
                f.span === "wide" && "lg:col-span-2",
              )}
            >
              <span className="mb-5 flex size-11 items-center justify-center rounded-[14px] bg-primary-soft text-primary-hover">
                <Icon className="size-5" />
              </span>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-foreground-muted">{f.body}</p>
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
      <div className="page-shell flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-[9px] bg-primary text-primary-fg">
            <Globe2 className="size-4" />
          </span>
          GlobeTrotter
        </Link>
        <p className="text-[13px] text-foreground-subtle">{FOOTER_NOTE}</p>
      </div>
    </footer>
  );
}
