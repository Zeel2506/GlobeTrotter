"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, HeartOff, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ImageFallback } from "@/components/image-fallback";
import { HoverCard } from "@/components/motion/hover-card";
import { api, ApiClientError, type CityRow } from "@/lib/api";
import { EASE } from "@/lib/motion";

/**
 * S12's saved-destinations grid. Removal is optimistic — the heart is a
 * throwaway action and waiting on a round trip makes it feel broken — but the
 * row is restored if the API rejects it.
 */
export function SavedDestinations({ initial }: { initial: CityRow[] }) {
  const [cities, setCities] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);

  async function remove(city: CityRow) {
    setPending(city.id);
    const previous = cities;
    setCities((c) => c.filter((x) => x.id !== city.id));

    try {
      await api.del(`/api/saved-destinations/${city.id}`);
      toast.success(`Removed ${city.name}`);
    } catch (err) {
      setCities(previous);
      toast.error(
        err instanceof ApiClientError ? err.message : `Could not remove ${city.name}.`,
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <Card id="saved" className="scroll-mt-24 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Saved destinations</h2>
          <p className="mt-0.5 text-[14px] text-foreground-muted">
            Places you have hearted while exploring.
          </p>
        </div>
        <Badge variant="primary" size="md">
          <Heart className="size-3.5" />
          {cities.length}
        </Badge>
      </div>

      {cities.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Heart}
          title="Nothing saved yet"
          description="Heart a city while exploring and it will wait for you here."
          action={
            <Button asChild variant="soft" size="sm">
              <Link href="/cities">
                <Compass className="size-4" />
                Explore cities
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {cities.map((city) => (
              <motion.div
                key={city.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                <HoverCard className="h-full"><div className="group h-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
                  <div className="relative h-24 overflow-hidden">
                    <ImageFallback
                      src={city.imageUrl}
                      name={city.name}
                      className="size-full"
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="secondary"
                      aria-label={`Remove ${city.name} from saved`}
                      loading={pending === city.id}
                      onClick={() => remove(city)}
                      className="absolute right-2 top-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <HeartOff className="size-3.5" />
                    </Button>
                  </div>

                  <div className="p-3">
                    <Link
                      href={`/activities?cityId=${city.id}`}
                      className="font-semibold leading-tight hover:text-primary"
                    >
                      {city.name}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-foreground-subtle">
                      {city.country}
                      {city._count ? ` · ${city._count.activities} things to do` : ""}
                    </p>
                  </div>
                </div></HoverCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
