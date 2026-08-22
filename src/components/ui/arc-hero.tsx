"use client";

// A static arc of destination cards. Descended from 21st.dev's
// @prashantsom75/scroll-morph-hero, but every scroll-driven behaviour has been
// removed on purpose:
//
//   · no wheel/touch hijacking — the original swallowed scroll events and could
//     trap the visitor on the hero
//   · no scatter -> line -> circle intro, no morph, no scroll rotation
//   · no mouse parallax
//
// What remains is the arc as it finally rested, plus the flip-on-hover. That is
// the whole component now: geometry + hover, no springs, no motion values, no
// listeners. It renders identically on first paint and never moves on its own.
import { useEffect, useRef, useState } from "react";

export type ArcCard = { src: string; label: string };

// Base card box. Final on-screen size is this multiplied by CARD_SCALE below.
const CARD_W = 62;
const CARD_H = 88;

function FlipCard({
  src,
  label,
  x,
  y,
  rotation,
  scale,
}: ArcCard & { x: number; y: number; rotation: number; scale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        width: CARD_W,
        height: CARD_H,
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className="group cursor-pointer"
    >
      {/* The flip is CSS, not framer-motion, on purpose: <MotionConfig
          reducedMotion="user"> strips transform animations, which silently
          killed a whileHover rotateY for anyone with the OS preference set.
          A CSS transform is outside Framer's control, so the card still turns.
          The `card-flip` transition is exempted from the global reduced-motion
          rule in globals.css — see the note there. */}
      <div
        className="card-flip relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-[14px] bg-surface-muted shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img src={src} alt="" className="h-full w-full object-cover" loading="eager" />
        </div>

        <div
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[14px] bg-foreground px-1.5 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-center text-[7px] font-bold uppercase tracking-[0.18em] text-primary">
            Explore
          </p>
          <p className="mt-1 text-center text-[9px] font-medium leading-tight text-white">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ArcHero({ cards }: { cards: ArcCard[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    setSize({ width: el.offsetWidth, height: el.offsetHeight });
    return () => observer.disconnect();
  }, []);

  const total = cards.length;
  const { width, height } = size;
  const isMobile = width < 768;

  // Geometry is driven mainly by WIDTH. The old version used
  // min(width, height * 1.5), which made the radius collapse on a short
  // viewport — that is why the arc looked right at 75% browser zoom (taller in
  // CSS pixels) and cramped at 100%. Tying it to width keeps the same shape at
  // any zoom level.
  const arcRadius = Math.min(width * 0.6, height * 2.4);
  const cardScale = isMobile ? 1.15 : 1.55;
  const spreadAngle = isMobile ? 96 : 120;

  // Cards are positioned from the container's CENTRE, so a negative apex lifts
  // the arc into the upper half and leaves the hollow for the headline.
  //
  // The apex is deliberately short of the container top: at -0.30 the crown of
  // the arc came within ~20px of the floating navbar and read as one mass with
  // it. This keeps roughly 70px of air under the nav.
  const apexY = -height * (isMobile ? 0.12 : 0.24);
  const arcCentreY = apexY + arcRadius;
  const step = spreadAngle / Math.max(1, total - 1);
  const startAngle = -90 - spreadAngle / 2;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div className="relative flex h-full w-full items-center justify-center">
        {width > 0 &&
          cards.map((card, i) => {
            const angle = startAngle + i * step;
            const rad = (angle * Math.PI) / 180;
            return (
              <FlipCard
                key={card.label + i}
                src={card.src}
                label={card.label}
                x={Math.cos(rad) * arcRadius}
                y={Math.sin(rad) * arcRadius + arcCentreY}
                rotation={angle + 90}
                scale={cardScale}
              />
            );
          })}
      </div>
    </div>
  );
}
