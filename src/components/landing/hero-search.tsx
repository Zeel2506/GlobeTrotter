"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Ticket, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POPULAR_SEARCHES } from "@/config/landing";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Mode = "cities" | "activities";

const MODES: { key: Mode; label: string; icon: typeof MapPin; placeholder: string }[] = [
  {
    key: "cities",
    label: "Destinations",
    icon: MapPin,
    placeholder: "Try Paris, Japan, or Southeast Asia",
  },
  {
    key: "activities",
    label: "Things to do",
    icon: Ticket,
    placeholder: "Try food tour, museum, or hiking",
  },
];

/**
 * The booking-widget pattern every travel product opens with (MakeMyTrip,
 * Booking, Kayak): a mode switcher above one elevated search card that overlaps
 * the hero.
 *
 * It is wired to the real catalog rather than being decorative — submitting
 * lands on /cities or /activities with the query applied, which is exactly where
 * a visitor wants to be. Middleware bounces logged-out users to /login and
 * returns them here afterwards.
 */
export function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("cities");
  const [q, setQ] = useState("");

  const active = MODES.find((m) => m.key === mode)!;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(`/${mode}${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
      className="w-full"
    >
      {/* Mode switcher sits on the card's shoulder, the way the travel majors do it. */}
      <div
        role="tablist"
        aria-label="What are you looking for?"
        className="flex w-fit gap-1 rounded-t-[var(--radius-lg)] border border-b-0 border-border bg-surface p-1.5"
      >
        {MODES.map((m) => {
          const selected = m.key === mode;
          return (
            <button
              key={m.key}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setMode(m.key)}
              className={cn(
                "relative flex items-center gap-2 rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition-colors",
                selected ? "text-primary-fg" : "text-foreground-muted hover:text-foreground",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="hero-search-tab"
                  className="absolute inset-0 -z-10 rounded-[var(--radius)] bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <m.icon className="size-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={submit}
        className="rounded-[var(--radius-lg)] rounded-tl-none border border-border bg-surface p-2 shadow-[var(--shadow-lg)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-foreground-subtle" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={active.placeholder}
              aria-label={`Search ${active.label.toLowerCase()}`}
              className="h-14 w-full rounded-[var(--radius)] bg-transparent pl-12 pr-4 text-[15px] outline-none placeholder:text-foreground-subtle"
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-8 text-[15px] sm:w-auto">
            Search
            <ArrowRight className="size-[18px]" />
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground-subtle">
          <TrendingUp className="size-3.5" />
          Popular
        </span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/cities?q=${encodeURIComponent(term)}`)}
            className="rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[13px] font-medium text-foreground-muted transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            {term}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
