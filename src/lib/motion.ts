// Shared framer-motion preset kit — docs/DESIGN_SYSTEM.md §8.
// Everything that is NOT one of the three signature moments uses these.
import type { Variants, Transition } from "framer-motion";

export const EASE = [0.32, 0.72, 0, 1] as const;

export const DUR = { micro: 0.15, base: 0.24, entrance: 0.42 } as const;

export const transition: Transition = { duration: DUR.base, ease: EASE };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.entrance, ease: EASE } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 26 },
  },
};

/** Parent wrapper: children with `riseIn` cascade 60ms apart. */
export const stagger = (gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});

/** Scroll reveal — used by the landing sections. */
export const reveal = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;

export const hoverLift = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.99 },
  transition,
} as const;
