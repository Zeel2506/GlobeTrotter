import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "success";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-foreground-muted">
        {Icon && <Icon className="size-4" />}
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <p
        className={cn(
          "tnum mt-2 text-2xl font-bold",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[13px] text-foreground-subtle">{hint}</p>}
    </div>
  );
}
