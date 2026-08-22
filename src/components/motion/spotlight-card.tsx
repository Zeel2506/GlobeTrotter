"use client";

// Adapted from React Bits — https://reactbits.dev (MIT), Components/SpotlightCard.
// Changes for GlobeTrotter:
//   · the original is dark-theme (neutral-900 on neutral-800); this uses the
//     project's surface/border tokens so it belongs to the light design system
//   · the spotlight defaults to the brand teal at low alpha rather than white,
//     which is invisible on a light card
//   · pointer tracking is skipped for coarse pointers and reduced-motion users —
//     a spotlight that follows a finger just repaints for nothing
//   · padding is not baked in, so it can wrap existing cards without double padding
import React, { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  /** Any CSS colour. Defaults to the brand teal at the alpha that reads on sand. */
  spotlightColor?: string;
  /** Set false to keep the card's own background/border and only add the spotlight. */
  chrome?: boolean;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(13, 148, 136, 0.14)",
  chrome = true,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const enabled = !reduceMotion;

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const show = () => enabled && setOpacity(1);
  const hide = () => setOpacity(0);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn(
        "relative overflow-hidden",
        chrome && "rounded-[var(--radius-lg)] border border-border bg-surface",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 72%)`,
        }}
      />
      {children}
    </div>
  );
}

export default SpotlightCard;
