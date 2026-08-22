import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/format";
import type { TripStatus } from "@/lib/api";

const MAP: Record<TripStatus, { label: string; variant: "primary" | "success" | "neutral" }> = {
  upcoming: { label: "Upcoming", variant: "primary" },
  ongoing: { label: "Ongoing", variant: "success" },
  past: { label: "Past", variant: "neutral" },
};

/** Status is derived server-side from dates (docs/SPEC.md §3) — never recomputed here. */
export function StatusBadge({ status }: { status: TripStatus }) {
  const s = MAP[status] ?? MAP.past;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** `daysUntil` also arrives from the API (/api/dashboard). */
export function CountdownPill({ daysUntil }: { daysUntil: number }) {
  return (
    <Badge variant="accent" size="md" className="font-semibold">
      {formatCountdown(daysUntil)}
    </Badge>
  );
}
