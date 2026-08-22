"use client";

import { usePathname } from "next/navigation";
import { BlurFade } from "@/components/motion/blur-fade";

/**
 * The entrance every screen shares. Keyed on the pathname so it re-runs on each
 * navigation rather than only on first mount — that is what makes moving around
 * the app feel composed instead of like a series of hard cuts.
 *
 * Deliberately NOT an exit animation: Next's App Router unmounts the old tree
 * before the new one is ready, so an exit would show a blank frame. A fast,
 * confident entrance reads better than a slow crossfade anyway.
 *
 * `duration` is short on purpose. Anything past ~350ms starts to feel like
 * latency rather than polish, and every one of these screens is behind a
 * navigation the user just asked for.
 */
export function PageTransition({
  children,
  duration = 0.32,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const pathname = usePathname();

  return (
    <BlurFade key={pathname} duration={duration} yOffset={10} blur="4px">
      {children}
    </BlurFade>
  );
}
