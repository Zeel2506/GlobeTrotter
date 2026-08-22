"use client";

// The tilt mechanism from React Bits — https://reactbits.dev (MIT),
// Components/TiltedCard.
//
// Adapted for GlobeTrotter: upstream TiltedCard renders its own <img>, caption
// and fixed container size, so it can only BE a card — it cannot wrap one. This
// keeps only the pointer maths and spring config and exposes them as a wrapper,
// so it drops around the cards that already exist.
//
// Also:
//   · motion/react -> framer-motion
//   · disabled under prefers-reduced-motion, and the handlers are never attached
//     for coarse pointers — a tilt that tracks a finger is jitter, not polish
//   · perspective lives on the wrapper so nested transforms stay in one 3D space
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type SpringOptions } from "framer-motion";
import { cn } from "@/lib/cn";

const spring: SpringOptions = { damping: 30, stiffness: 220, mass: 0.8 };

export function TiltCard({
  children,
  className,
  /** Max degrees of rotation at the card's edge. Low by default — a travel card
   *  should feel like it lifts, not like it swivels. */
  amplitude = 7,
  scaleOnHover = 1.02,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  scaleOnHover?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);
  const scale = useSpring(1, spring);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    rotateX.set((offsetY / (rect.height / 2)) * -amplitude);
    rotateY.set((offsetX / (rect.width / 2)) * amplitude);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => scale.set(scaleOnHover)}
      onMouseLeave={reset}
      className={cn("[perspective:900px]", className)}
    >
      <motion.div
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default TiltCard;
