"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Ticket,
  CalendarRange,
  ArrowRight,
  Compass,
  Wallet,
  Share2,
} from "lucide-react";
import { DateField } from "@/components/ui/date-field";
import { POPULAR_SEARCHES } from "@/config/landing";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

type TabKey = "plan" | "destinations" | "activities";

const TABS: { key: TabKey; label: string; icon: typeof MapPin }[] = [
  { key: "plan", label: "Plan a trip", icon: CalendarRange },
  { key: "destinations", label: "Destinations", icon: MapPin },
  { key: "activities", label: "Things to do", icon: Ticket },
];

const REGIONS = ["Europe", "Asia", "Middle East", "Africa", "North America", "South America", "Oceania"];
const CATEGORIES = ["SIGHTSEEING", "FOOD", "ADVENTURE", "CULTURE", "NIGHTLIFE", "SHOPPING", "NATURE", "OTHER"];

const QUICK_LINKS = [
  { icon: Compass, label: "Explore cities", href: "/cities" },
  { icon: Ticket, label: "Activities", href: "/activities" },
  { icon: Wallet, label: "Budget tracking", href: "/trips" },
  { icon: Share2, label: "Shared trips", href: "/p/sea-shoestring-demo" },
];

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
    <label
      className={cn(
        "block cursor-text px-5 py-4 transition-colors hover:bg-surface-muted/60",
        className,
      )}
    >
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

const cellInput =
  "mt-1.5 w-full bg-transparent text-[17px] font-semibold leading-tight outline-none placeholder:font-normal placeholder:text-foreground-subtle";

/** The DateField trigger, stripped back to sit inside a segmented cell: no
 *  border, no shadow, no fixed height — the cell already provides all of that. */
const cellDateTrigger =
  "mt-1.5 h-auto border-0 bg-transparent p-0 text-[17px] font-semibold shadow-none hover:border-0 focus-visible:ring-0";

/**
 * The planner widget: icon tabs, one row of segmented labelled fields, then a
 * single footer row carrying the CTA and the shortcuts.
 *
 * Everything lives in ONE panel on purpose. An earlier pass had the card, a
 * quick-tools bar and a popular-searches row as three separate floating strips,
 * which read as clutter and left dead space between each. One card, one footer.
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
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE }}
      onSubmit={submit}
      className="overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-lg)]"
    >
      <div
        role="tablist"
        aria-label="What do you want to do?"
        className="flex gap-1 overflow-x-auto border-b border-border px-3"
      >
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
                "relative flex min-w-[96px] shrink-0 flex-col items-center gap-1.5 px-4 pb-3.5 pt-4 text-[13px] font-medium transition-colors",
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
              <DateField
                value={start}
                onChange={setStart}
                placeholder="Add date"
                className={cellDateTrigger}
              />
            </FieldCell>
            <FieldCell label="End date">
              <DateField
                value={end}
                min={start || undefined}
                onChange={setEnd}
                placeholder="Add date"
                className={cellDateTrigger}
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

      {/* One footer row: shortcuts left, the action right. */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface-muted/50 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => router.push(link.href)}
              className="flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium text-foreground-muted transition-colors hover:bg-surface hover:text-primary"
            >
              <link.icon className="size-3.5" />
              {link.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-primary px-8 py-3 text-[14px] font-semibold uppercase tracking-wide text-primary-fg transition-all hover:bg-primary-hover active:scale-[.98]"
        >
          {tab === "plan" ? "Start planning" : "Search"}
          <ArrowRight className="size-[18px]" />
        </button>
      </div>

      {/* Popular searches, tucked in rather than floating as their own strip. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-foreground-subtle">
          Popular
        </span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/cities?q=${encodeURIComponent(term)}`)}
            className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-[13px] font-medium text-foreground-muted transition-all hover:border-primary/40 hover:text-primary"
          >
            {term}
          </button>
        ))}
      </div>
    </motion.form>
  );
}
