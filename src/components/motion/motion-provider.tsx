"use client";

import { MotionConfig } from "framer-motion";

/**
 * Global motion policy.
 *
 * `reducedMotion="user"` makes Framer drop transform and layout animations for
 * anyone with the OS preference set, WITHOUT the component tree rendering
 * different markup.
 *
 * That distinction matters: components previously called useReducedMotion() and
 * branched on it while rendering. On the server that hook returns null, in the
 * browser it returns the real value — so a reduced-motion visitor got server
 * HTML with `filter: blur(4px); transform: translateY(10px)` and client HTML
 * with only `opacity: 0`, which React reports as a hydration mismatch and
 * refuses to patch. Letting MotionConfig handle it keeps both renders identical.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
