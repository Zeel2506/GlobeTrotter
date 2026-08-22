"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Copy, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiClientError } from "@/lib/api";
import { EASE } from "@/lib/motion";

/** Deterministic confetti pieces — no randomness, so the burst is identical on
 *  server and client and never triggers a hydration mismatch. */
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i % 6) * 40 - 100 + (i % 3) * 12,
  y: -60 - (i % 5) * 28,
  rotate: (i % 7) * 51,
  color: ["#0d9488", "#f97316", "#7c3aed", "#db2777", "#059669", "#d97706"][i % 6],
  delay: (i % 6) * 0.03,
}));

/**
 * Signature moment #3 (DESIGN_SYSTEM.md §8): copy-trip celebration.
 *
 * A logged-out visitor is sent to login with a callback back to this page, so
 * they land where they started rather than on a dashboard with no context.
 */
export function CopyTripButton({
  slug,
  signedIn,
  size = "lg",
}: {
  slug: string;
  signedIn: boolean;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  async function copyTrip() {
    if (!signedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/p/${slug}`)}`);
      return;
    }

    setLoading(true);
    try {
      const trip = await api.post<{ id: string; name: string }>(
        `/api/public/trips/${slug}/copy`,
      );

      if (reduced) {
        toast.success("Trip copied to your account.");
        router.push(`/trips/${trip.id}/build`);
        return;
      }

      setCelebrating(true);
      toast.success(`"${trip.name}" is yours — opening the builder.`);
      setTimeout(() => router.push(`/trips/${trip.id}/build`), 1100);
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not copy this trip.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <AnimatePresence>
        {celebrating &&
          CONFETTI.map((c) => (
            <motion.span
              key={c.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{ opacity: 0, x: c.x, y: c.y, rotate: c.rotate, scale: 0.6 }}
              transition={{ duration: 0.95, ease: EASE, delay: c.delay }}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 size-2 rounded-[2px]"
              style={{ backgroundColor: c.color }}
            />
          ))}
      </AnimatePresence>

      <Button size={size} onClick={copyTrip} loading={loading} disabled={celebrating}>
        {celebrating ? <PartyPopper /> : <Copy />}
        {celebrating ? "Copied!" : signedIn ? "Copy this trip" : "Log in to copy"}
      </Button>
    </div>
  );
}
