"use client";

// From 21st.dev — @prashantsom75/scroll-morph-hero.
//
// Adapted for GlobeTrotter:
//   · IMPORTANT FIX — the original calls e.preventDefault() on every wheel
//     event, so once the virtual scroll hits MAX_SCROLL the page can never be
//     scrolled past the hero. It traps the visitor. Here the wheel is only
//     captured while the animation still has somewhere to go; at either end the
//     event is released and the page scrolls normally.
//   · real catalog photography instead of the stock set, and the card backs
//     show the city name rather than "View Details"
//   · design tokens instead of hard-coded greys
//   · prefers-reduced-motion renders the finished arc immediately with no
//     scroll hijacking at all
//   · ResizeObserver guard for SSR
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, useReducedMotion } from "framer-motion";

export type AnimationPhase = "scatter" | "line" | "circle";

type Target = { x: number; y: number; rotation: number; scale: number; opacity: number };

interface FlipCardProps {
  src: string;
  label: string;
  target: Target;
}

const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({ src, label, target }: FlipCardProps) {
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="group cursor-pointer"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl bg-surface-muted shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Plain <img>: these are arbitrary remote URLs, same call as ImageFallback. */}
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
        </div>

        <div
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-foreground p-2 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-center text-[9px] font-bold uppercase tracking-widest text-primary">
            Explore
          </p>
          <p className="mt-1 text-center text-[10px] font-medium leading-tight text-white">
            {label}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const MAX_SCROLL = 2200;
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export type MorphCard = { src: string; label: string };

export default function ScrollMorphHero({
  cards,
  title,
  subtitle,
  arcTitle,
  arcSubtitle,
}: {
  cards: MorphCard[];
  title: string;
  subtitle: string;
  arcTitle: string;
  arcSubtitle: string;
}) {
  const total = cards.length;
  const reduceMotion = useReducedMotion();
  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    return () => observer.disconnect();
  }, []);

  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reduceMotion) return;

    const advance = (delta: number) => {
      const next = Math.min(Math.max(scrollRef.current + delta, 0), MAX_SCROLL);
      const changed = next !== scrollRef.current;
      scrollRef.current = next;
      virtualScroll.set(next);
      return changed;
    };

    const handleWheel = (e: WheelEvent) => {
      // Only swallow the gesture while the animation can still consume it.
      // At either end the page takes over, so the visitor is never trapped.
      const atEnd = scrollRef.current >= MAX_SCROLL && e.deltaY > 0;
      const atStart = scrollRef.current <= 0 && e.deltaY < 0;
      if (atEnd || atStart) return;
      e.preventDefault();
      advance(e.deltaY);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      const atEnd = scrollRef.current >= MAX_SCROLL && deltaY > 0;
      const atStart = scrollRef.current <= 0 && deltaY < 0;
      if (atEnd || atStart) return;
      e.preventDefault();
      touchStartY = touchY;
      advance(deltaY);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll, reduceMotion]);

  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
  const scrollRotate = useTransform(virtualScroll, [600, MAX_SCROLL], [0, 360]);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 80);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setIntroPhase("circle");
      return;
    }
    const t1 = setTimeout(() => setIntroPhase("line"), 500);
    const t2 = setTimeout(() => setIntroPhase("circle"), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduceMotion]);

  const scatterPositions = useMemo(
    () =>
      cards.map(() => ({
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 900,
        rotation: (Math.random() - 0.5) * 180,
        scale: 0.6,
        opacity: 0,
      })),
    [cards],
  );

  const [morphValue, setMorphValue] = useState(reduceMotion ? 1 : 0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const a = smoothMorph.on("change", setMorphValue);
    const b = smoothScrollRotate.on("change", setRotateValue);
    const c = smoothMouseX.on("change", setParallaxValue);
    return () => {
      a();
      b();
      c();
    };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX, reduceMotion]);

  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center">
        {/* Intro copy — fades out as the ring morphs into the arc. */}
        <div className="pointer-events-none absolute top-1/2 z-0 flex -translate-y-1/2 flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={
              introPhase === "circle" && morphValue < 0.5
                ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(10px)" }
            }
            transition={{ duration: 1 }}
            className="display-1 max-w-3xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={
              introPhase === "circle" && morphValue < 0.5
                ? { opacity: 0.7 - morphValue }
                : { opacity: 0 }
            }
            transition={{ duration: 1, delay: 0.2 }}
            className="overline mt-6 text-foreground-subtle"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Arc copy — fades in once the arc is formed. */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="pointer-events-none absolute top-[8%] z-10 flex flex-col items-center justify-center px-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{arcTitle}</h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-foreground-muted md:text-base">
            {arcSubtitle}
          </p>
        </motion.div>

        <div className="relative flex h-full w-full items-center justify-center">
          {cards.map((card, i) => {
            let target: Target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const spacing = 70;
              target = {
                x: i * spacing - (total * spacing) / 2,
                y: 0,
                rotation: 0,
                scale: 1,
                opacity: 1,
              };
            } else {
              const isMobile = containerSize.width < 768;
              const minDimension = Math.min(containerSize.width, containerSize.height);

              const circleRadius = Math.min(minDimension * 0.35, 320);
              const circleAngle = (i / total) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
              const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY = arcApexY + arcRadius;

              const spreadAngle = isMobile ? 100 : 130;
              const startAngle = -90 - spreadAngle / 2;
              const step = spreadAngle / Math.max(1, total - 1);

              const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
              const boundedRotation = -scrollProgress * (spreadAngle * 0.8);

              const currentArcAngle = startAngle + i * step + boundedRotation;
              const arcRad = (currentArcAngle * Math.PI) / 180;

              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: isMobile ? 1.4 : 1.8,
              };

              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return <FlipCard key={card.label + i} src={card.src} label={card.label} target={target} />;
          })}
        </div>
      </div>
    </div>
  );
}
