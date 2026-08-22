"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/**
 * Owner-only control on the public page (docs/SPEC.md S11).
 *
 * Un-sharing retains the slug (DECISIONS.md D-07), so re-sharing later revives
 * links people already have rather than breaking them — worth saying out loud,
 * because "make private" otherwise sounds permanent.
 */
export function UnshareBanner({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isOwner) return null;

  async function unshare() {
    setLoading(true);
    try {
      await api.post(`/api/trips/${tripId}/unshare`);
      toast.success("Trip is private again.");
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch {
      toast.error("Could not un-share this trip.");
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-primary-soft px-4 py-3">
      <p className="inline-flex items-center gap-2 text-[13px] text-primary-hover">
        <Eye className="size-4 shrink-0" />
        This is your trip, as everyone else sees it. Un-sharing keeps the link reserved, so
        re-sharing later revives it.
      </p>
      <Button variant="secondary" size="sm" onClick={unshare} loading={loading}>
        <Lock />
        Make private
      </Button>
    </div>
  );
}
