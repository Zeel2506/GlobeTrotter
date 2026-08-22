// Path backdrop for the auth shell, after 21st.dev — sshahaider/auth-page.
//
// Static, and much quieter than the original.
//
// Upstream ramps stroke opacity as `0.1 + i * 0.03` across 36 strokes, which
// tops out near 1.0 — on a light panel that reads as a tangle of bright red
// wires running straight through the headline. Here the ramp is clamped to
// 0.04–0.13, the stroke count is down to 9, and the spacing is widened so the
// curves stay separated instead of bunching. It should register as texture you
// notice only if you look for it.
//
// No framer-motion, no hooks: a plain server component that ships no JS.

export function FloatingPaths({ position }: { position: number }) {
  const COUNT = 9;

  const paths = Array.from({ length: COUNT }, (_, i) => {
    // Wide stride keeps the curves apart; the original's tight step is what
    // made them bunch into a bundle at the top-left.
    const n = i * 5;
    return {
      id: i,
      d: `M-${380 - n * 5 * position} -${189 + n * 6}C-${380 - n * 5 * position} -${189 + n * 6} -${312 - n * 5 * position} ${216 - n * 6} ${152 - n * 5 * position} ${343 - n * 6}C${616 - n * 5 * position} ${470 - n * 6} ${684 - n * 5 * position} ${875 - n * 6} ${684 - n * 5 * position} ${875 - n * 6}`,
      width: 0.4 + i * 0.05,
      opacity: Number((0.04 + i * 0.01).toFixed(3)),
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 text-primary">
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
