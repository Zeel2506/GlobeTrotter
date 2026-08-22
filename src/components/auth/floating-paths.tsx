// Path backdrop for the auth shell, after 21st.dev — sshahaider/auth-page.
//
// Now fully static. The original animated every stroke's pathLength, opacity and
// pathOffset on an infinite linear loop; behind a login form that is 36 paths
// compositing forever for decoration nobody is looking at. Drawing them once
// gives the same picture at no running cost.
//
// Also adapted: strokes take currentColor (our brand red) instead of slate-950,
// and the count is halved from the original 36 per layer.
//
// No framer-motion, no client hooks — this is a plain server component.

export function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 18 }, (_, i) => {
    const n = i * 2; // keep the original spacing with half the strokes
    return {
      id: i,
      d: `M-${380 - n * 5 * position} -${189 + n * 6}C-${380 - n * 5 * position} -${189 + n * 6} -${312 - n * 5 * position} ${216 - n * 6} ${152 - n * 5 * position} ${343 - n * 6}C${616 - n * 5 * position} ${470 - n * 6} ${684 - n * 5 * position} ${875 - n * 6} ${684 - n * 5 * position} ${875 - n * 6}`,
      width: 0.5 + n * 0.03,
      opacity: 0.1 + n * 0.02,
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
