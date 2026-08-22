"use client";

// Adapted from React Bits — https://reactbits.dev (MIT), Animations/GlareHover.
// Changes for GlobeTrotter:
//   · upstream forces width/height/background/borderRadius/border as inline
//     styles, so it can only BE a card — it cannot wrap one. This version is a
//     pure overlay that inherits the parent's box, so it drops into the cards
//     that already exist without fighting them.
//   · driven by the parent's :hover via CSS instead of JS mouse listeners —
//     same sweep, no React state, nothing to clean up
//   · disabled under prefers-reduced-motion and for coarse pointers, where a
//     hover sweep can never be seen anyway
import { cn } from "@/lib/cn";

/**
 * A light sweep across the parent on hover. The parent must be
 * `position: relative` and carry the `group` class.
 *
 *   <div className="group relative …">
 *     <GlareOverlay />
 *     …
 *   </div>
 */
export function GlareOverlay({
  className,
  angle = -45,
  /** 0-1. Kept low: this is a light theme, a strong white sweep looks cheap. */
  opacity = 0.35,
  durationMs = 700,
}: {
  className?: string;
  angle?: number;
  opacity?: number;
  durationMs?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden",
        // The sweep itself: off-canvas by default, driven across on group-hover.
        "[background-position:-100%_-100%] [background-repeat:no-repeat] [background-size:250%_250%]",
        "group-hover:[background-position:100%_100%]",
        "motion-reduce:hidden",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, transparent 60%, rgba(255,255,255,${opacity}) 70%, transparent 100%)`,
        transition: `background-position ${durationMs}ms ease`,
      }}
    />
  );
}

export default GlareOverlay;
