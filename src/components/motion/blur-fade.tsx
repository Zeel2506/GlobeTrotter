"use client";

// Adapted from 21st.dev — dillionverma/blur-fade (registry pull).
// Changes for GlobeTrotter:
//   · upstream animates to `y: -yOffset`, which leaves the content sitting
//     yOffset px ABOVE where it belongs forever. Settles at y: 0 instead, so it
//     can wrap real layout without nudging it.
//   · "easeOut" replaced with the project's shared --ease curve
//   · honours prefers-reduced-motion (no blur, no travel, just presence)
//   · the AnimatePresence wrapper is dropped: nothing here ever unmounts through
//     it, and it was re-running the entrance on every parent re-render
import { useRef } from "react";
import { motion, useInView, type UseInViewOptions, type Variants } from "framer-motion";
import { EASE } from "@/lib/motion";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variants;
  duration?: number;
  delay?: number;
  yOffset?: number;
  /** true = wait until scrolled into view; false = animate on mount. */
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  blur?: string;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 8,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isVisible = !inView || inViewResult;

  // Constant on both server and client. MotionConfig reducedMotion="user"
  // strips the transform for those who ask for it, so branching here would only
  // reintroduce a hydration mismatch.
  const variants: Variants = variant ?? {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default BlurFade;
