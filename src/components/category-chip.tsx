import { categoryStyle } from "@/config/category-colors";
import { cn } from "@/lib/cn";

/**
 * Colour + icon + label, always all three — DESIGN_SYSTEM.md §4 rule 4.
 * FOOD (amber) and ADVENTURE (orange) are the closest pair on the wheel, so
 * colour alone would fail that pair and colour-blind users alike.
 */
export function CategoryChip({
  category,
  size = "sm",
  iconOnly = false,
  className,
}: {
  category: string | null | undefined;
  size?: "sm" | "md";
  iconOnly?: boolean;
  className?: string;
}) {
  const style = categoryStyle(category);
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        iconOnly && "px-1.5",
        className,
      )}
      style={{ backgroundColor: style.soft, color: style.color }}
      title={style.label}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {iconOnly ? <span className="sr-only">{style.label}</span> : style.label}
    </span>
  );
}

/** Bare dot for dense surfaces (calendar cells) where a full chip will not fit. */
export function CategoryDot({ category, className }: { category: string; className?: string }) {
  const style = categoryStyle(category);
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", className)}
      style={{ backgroundColor: style.color }}
      title={style.label}
    />
  );
}
