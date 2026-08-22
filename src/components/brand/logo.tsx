import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The GlobeTrotter lockup — mark plus wordmark, in one place so the nav, auth
 * shell, admin console and footer can never drift apart.
 *
 * The mark is a red line drawing on a transparent background, so it is
 * deliberately NOT set inside the filled brand-red circle the old Globe2 icon
 * used: red artwork on a red disc is invisible. It also is not square
 * (628 x 397), so the height is fixed and the width left to follow — forcing it
 * into a square box would letterbox or squash it.
 */
export function Logo({
  href = "/",
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
}: {
  /** Pass null to render a plain span instead of a link. */
  href?: string | null;
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  const content = (
    <>
      {/* Plain <img>: a fixed local asset, no optimisation pipeline needed, and
          it must never be swapped for a fallback. */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        className={cn("h-7 w-auto shrink-0 select-none", markClassName)}
      />
      {showWordmark && (
        <span className={cn("text-[17px] font-semibold tracking-tight", wordmarkClassName)}>
          GlobeTrotter
        </span>
      )}
    </>
  );

  const classes = cn("flex shrink-0 items-center gap-2.5", className);

  if (href === null) {
    return (
      <span className={classes}>
        {content}
        <span className="sr-only">GlobeTrotter</span>
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label="GlobeTrotter home">
      {content}
    </Link>
  );
}
