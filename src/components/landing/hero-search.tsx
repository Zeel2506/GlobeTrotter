"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Ticket,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  Compass,
  Wallet,
  Share2,
} from "lucide-react";
import { POPULAR_SEARCHES } from "@/config/landing";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

type TabKey = "plan" | "destinations" | "activities";

const TABS: { key: TabKey; label: string; icon: typeof MapPin }[] = [
  { key: "plan", label: "Plan a trip", icon: CalendarRange },
  { key: "destinations", label: "Destinations", icon: MapPin },
  { key: "activities", label: "Things to do", icon: Ticket },
];

const REGIONS = [
  "Europe",
  "Asia",
  "Middle East",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

const CATEGORIES = [
  "SIGHTSEEING",
  "FOOD",
  "ADVENTURE",
  "CULTURE",
  "NIGHTLIFE",
  "SHOPPING",
  "NATURE",
  "OTHER",
];

/** One labelled cell of the segmented search bar — the MakeMyTrip field pattern:
 *  a small caption above a large, low-chrome value. */
function FieldCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("group/cell block cursor-text px-4 py-3 transition-colors hover:bg-surface-muted/60", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

const cellInput =
  "mt-1 w-full bg-transparent text-[17px] font-semibold leading-tight outline-none placeholder:font-normal placeholder:text-foreground-subtle";

/**
 * The booking-widget every Indian travel product opens with: an icon tab row,
 * one row of segmented labelled fields, and a large CTA straddling the card's
 * bottom edge.
 *
 * Each tab is wired to a real destination rather than being decorative —
 * Destinations and Things to do drive the live catalog search, and Plan a trip
 * pre-fills the create-trip form through query params.
 */
export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("plan");

  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [maxCost, setMaxCost] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    if (tab === "plan") {
      if (name.trim()) params.set("name", name.trim());
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      router.push(`/trips/new${params.size ? `?${params}` : ""}`);
      return;
    }

    if (q.trim()) params.set("q", q.trim());
    if (tab === "destinations") {
      if (region) params.set("region", region);
      router.push(`/cities${params.size ? `?${params}` : ""}`);
    } else {
      if (category) params.set("category", category);
      if (maxCost) params.set("maxCost", maxCost);
      router.push(`/activities${params.size ? `?${params}` : ""}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
      className="w-full"
    >
      <form
        onSubmit={submit}
        className="relative rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-lg)]"
      >
        {/* Icon tab row: icon above label, active marked by a rule beneath. */}
        <div role="tablist" aria-label="What do you want to do?" className="flex gap-1 overflow-x-auto border-b border-border px-2 sm:px-3">
          {TABS.map((t) => {
            const selected = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex min-w-[92px] shrink-0 flex-col items-center gap-1.5 px-4 pb-3 pt-4 text-[13px] font-medium transition-colors",
                  selected ? "text-primary" : "text-foreground-muted hover:text-foreground",
                )}
              >
                <t.icon className={cn("size-[22px] transition-transform", selected && "scale-110")} />
                {t.label}
                {selected && (
                  <motion.span
                    layoutId="hero-tab-underline"
                    className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Segmented fields. One row on desktop, stacked with rules on mobile. */}
        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {tab === "plan" ? (
            <>
              <FieldCell label="Trip name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer in Europe"
                  className={cellInput}
                />
              </FieldCell>
              <FieldCell label="Start date">
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className={cellInput}
                />
              </FieldCell>
              <FieldCell label="End date">
                <input
                  type="date"
                  value={end}
                  min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)}
                  className={cellInput}
                />
              </FieldCell>
            </>
          ) : tab === "destinations" ? (
            <>
              <FieldCell label="Where to" className="sm:col-span-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Paris, Japan, Europe…"
                  className={cellInput}
                />
              </FieldCell>
              <FieldCell label="Region">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={cn(cellInput, "cursor-pointer")}
                >
                  <option value="">Anywhere</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </FieldCell>
            </>
          ) : (
            <>
              <FieldCell label="What to do">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Food tour, museum, hiking…"
                  className={cellInput}
                />
              </FieldCell>
              <FieldCell label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={cn(cellInput, "cursor-pointer")}
                >
                  <option value="">Any category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </FieldCell>
              <FieldCell label="Max cost">
                <input
                  type="number"
                  min={0}
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  placeholder="Any price"
                  className={cellInput}
                />
              </FieldCell>
            </>
          )}
        </div>

        {/* The CTA straddles the card's bottom edge — MakeMyTrip's most copied detail. */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="-mb-6 inline-flex h-12 translate-y-1/2 items-center gap-2 rounded-full bg-primary px-10 text-[15px] font-semibold uppercase tracking-wide text-primary-fg shadow-[var(--shadow-lg)] transition-all duration-[var(--dur-micro)] hover:bg-primary-hover hover:shadow-[var(--shadow-hover)] active:scale-[.98]"
          >
            {tab === "plan" ? "Start planning" : "Search"}
            <ArrowRight className="size-[18px]" />
          </button>
        </div>
      </form>

      {/* Quick-tools pill row, the strip MakeMyTrip floats under its search card. */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-surface/80 p-1.5 backdrop-blur sm:gap-2">
        {[
          { icon: Compass, label: "Explore cities", href: "/cities" },
          { icon: Ticket, label: "Activities", href: "/activities" },
          { icon: Wallet, label: "Budget tracking", href: "/trips" },
          { icon: Share2, label: "Shared trips", href: "/p/sea-shoestring-demo" },
        ].map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => router.push(tool.href)}
            className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-primary sm:px-4"
          >
            <tool.icon className="size-4" />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
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
