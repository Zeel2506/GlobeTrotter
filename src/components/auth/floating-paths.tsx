"use client";

// From 21st.dev — sshahaider/auth-page (the FloatingPaths background).
// Adapted for GlobeTrotter:
//   · strokes use currentColor against our brand red instead of slate-950
//   · path count halved (36 -> 18 per layer); 72 infinitely-animating SVG paths
//     is a lot of continuous compositing for a decorative backdrop
//   · durations are deterministic rather than Math.random(), so the server and
//     client markup agree — random values here caused a hydration mismatch
//   · disabled entirely under prefers-reduced-motion
import { motion, useReducedMotion } from "framer-motion";

export function FloatingPaths({ position }: { position: number }) {
  const reduceMotion = useReducedMotion();

  const paths = Array.from({ length: 18 }, (_, i) => {
    const n = i * 2; // keep the original spacing with half the strokes
    return {
      id: i,
      d: `M-${380 - n * 5 * position} -${189 + n * 6}C-${380 - n * 5 * position} -${189 + n * 6} -${312 - n * 5 * position} ${216 - n * 6} ${152 - n * 5 * position} ${343 - n * 6}C${616 - n * 5 * position} ${470 - n * 6} ${684 - n * 5 * position} ${875 - n * 6} ${684 - n * 5 * position} ${875 - n * 6}`,
      width: 0.5 + n * 0.03,
      opacity: 0.1 + n * 0.02,
      duration: 22 + (i % 7) * 2,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 text-primary">
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={
              reduceMotion
                ? { pathLength: 1, opacity: 0.4 }
                : { pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: path.duration, repeat: Infinity, ease: "linear" }
            }
          />
        ))}
      </svg>
    </div>
  );
}
