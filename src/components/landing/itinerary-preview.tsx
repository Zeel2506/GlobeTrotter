"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { PREVIEW_DAYS } from "@/config/landing";
import { CategoryChip } from "@/components/category-chip";
import { formatMoney } from "@/lib/format";
import { EASE } from "@/lib/motion";

/**
 * The hero visual — a CSS/DOM-built itinerary preview, not a screenshot.
 * Deliberately built from real components (CategoryChip, formatMoney) so it can
 * never drift from what the actual product looks like, and there is no image
 * asset to 404 on first paint.
 */
export function ItineraryPreview() {
  return (
    <div className="relative select-none" aria-hidden>
      {/* Warm glow behind the stack */}
      <div className="pointer-events-none absolute -inset-8 rounded-[var(--radius-xl)] bg-[radial-gradient(60%_60%_at_50%_40%,rgba(13,148,136,.18),transparent_70%)] blur-xl" />

      <div className="relative flex flex-col gap-3">
        {PREVIEW_DAYS.map((day, i) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 24, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -1.2 : 0.9 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: EASE }}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-lg)]"
            style={{ marginLeft: i * 14, marginRight: (2 - i) * 10 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-fg">
                {day.day}
              </span>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground">
                <MapPin className="size-3.5 text-primary" />
                {day.city}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {day.items.map((item) => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span className="tnum w-11 shrink-0 text-[11px] font-semibold text-foreground-subtle">
                    {item.time}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {item.name}
                  </span>
                  <CategoryChip category={item.category} />
                  <span className="tnum shrink-0 text-[12px] font-semibold text-foreground-muted">
                    {formatMoney(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Running-total pill — the builder's always-visible total, in miniature */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.62, duration: 0.4, ease: EASE }}
          className="absolute -bottom-5 right-0 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-[var(--shadow-lg)]"
        >
          <span className="text-[11px] font-medium text-foreground-muted">Trip total</span>
          <span className="tnum text-sm font-bold text-primary">{formatMoney(320)}</span>
        </motion.div>
      </div>
    </div>
  );
}
