"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type SpringOptions } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * The single card-hover interaction for the whole product.
 *
 * It replaces a stack of four independent effects (CSS .hover-lift, TiltCard,
 * SpotlightCard, GlareOverlay) that each animated on its own timing. Layered,
 * they fought: a 240ms CSS translate under a spring-driven tilt under a 700ms
 * glare sweep reads as busy rather than considered, and the CSS transform and
 * the spring transform were applied to different wrappers, which made the whole
 * card jitter on fast pointer movement.
 *
 * Everything here runs off ONE spring config and one pointer handler:
 *   · lift + scale, weighted and slightly slow to settle
 *   · a very shallow tilt (3°) — enough to feel dimensional, not a swivel
 *   · a spotlight that tracks the pointer
 *   · a shadow that blooms with the lift
 *
 * Disabled wholesale under prefers-reduced-motion, where it renders a plain box.
 */

// Low stiffness + high damping = no overshoot, a long smooth settle. This is
// what separates "premium" from "springy".
const SPRING: SpringOptions = { stiffness: 150, damping: 20, mass: 0.7 };

export function HoverCard({
  children,
  className,
  /** Max tilt in degrees. Kept deliberately small. */
  tilt = 3,
  lift = 6,
  scale = 1.015,
  /** Set false for dense grids where a spotlight would be noise. */
  spotlight = true,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: number;
  lift?: number;
  scale?: number;
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  const s = useSpring(useMotionValue(1), SPRING);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setPointer({ x: px, y: py });
    rotateX.set(((py - rect.height / 2) / (rect.height / 2)) * -tilt);
    rotateY.set(((px - rect.width / 2) / (rect.width / 2)) * tilt);
  }

  function enter() {
    setHovered(true);
    y.set(-lift);
    s.set(scale);
  }

  function leave() {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    y.set(0);
    s.set(1);
  }

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseEnter={enter} onMouseLeave={leave} className={cn("[perspective:1100px]", className)}>
      <motion.div
        style={{
          rotateX,
          rotateY,
          y,
          scale: s,
          transformStyle: "preserve-3d",
          // Shadow is a plain CSS transition rather than a motion value: it is
          // the one property here that does not need per-frame interpolation.
          boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow)",
          transition: "box-shadow 420ms var(--ease)",
        }}
        className="relative h-full w-full rounded-[var(--radius-lg)]"
      >
        {spotlight && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-500"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(460px circle at ${pointer.x}px ${pointer.y}px, rgba(255,255,255,0.16), transparent 60%)`,
            }}
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}

export default HoverCard;
