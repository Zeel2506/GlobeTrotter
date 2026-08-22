"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The one and only card-hover effect in the product: a spotlight that follows
 * the pointer.
 *
 * Everything else has been removed on purpose — no tilt, no lift, no scale, no
 * shadow bloom, no image zoom. Those ran on five different timings and layered
 * into something busy; one confident effect reads as more considered than five
 * competing ones.
 *
 * Because nothing transforms any more, this needs no springs and no
 * framer-motion at all: two pointer handlers and a radial gradient. That is also
 * why there is no reduced-motion branch — a gradient tracking the cursor is not
 * motion in the vestibular sense, and branching on that hook during render is
 * what caused the earlier hydration mismatch.
 */
export function HoverCard({
  children,
  className,
  /** Radius of the spotlight in px. */
  size = 460,
  /** Brand red at low alpha: visible on a white panel AND over a photo. */
  tint = "rgba(235, 34, 38, 0.10)",
}: {
  children: React.ReactNode;
  className?: string;
  size?: number;
  tint?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("relative", className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[var(--radius-lg)] transition-opacity duration-500 ease-out"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(${size}px circle at ${pointer.x}px ${pointer.y}px, ${tint}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}

export default HoverCard;
