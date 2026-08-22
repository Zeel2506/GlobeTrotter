"use client";

// Adapted from React Bits — https://reactbits.dev (MIT), TextAnimations/CountUp.
// Changes for GlobeTrotter:
//   · motion/react -> framer-motion
//   · prefers-reduced-motion renders the final value immediately, no spring
//   · `prefix`/`suffix` added so "$3,303" and "31+" work without a wrapper span
//     that would break tabular alignment
//   · defaults to grouped thousands, because every number this app counts is money
//     or a catalog size
import { useCallback, useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  prefix?: string;
  suffix?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function decimalPlaces(n: number): number {
  const str = n.toString();
  if (!str.includes(".")) return 0;
  const decimals = str.split(".")[1];
  return Number.parseInt(decimals, 10) === 0 ? 0 : decimals.length;
}

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 1.6,
  className = "",
  startWhen = true,
  separator = ",",
  prefix = "",
  suffix = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  });

  const isInView = useInView(ref, { once: true, margin: "0px" });
  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));

  const format = useCallback(
    (latest: number) => {
      const formatted = Intl.NumberFormat("en-US", {
        useGrouping: Boolean(separator),
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(latest);
      const withSeparator = separator === "," ? formatted : formatted.replace(/,/g, separator);
      return `${prefix}${withSeparator}${suffix}`;
    },
    [maxDecimals, separator, prefix, suffix],
  );

  // Paint the starting value before any animation so the slot never renders empty
  // and the surrounding layout does not jump when the number arrives.
  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = format(reduceMotion ? to : direction === "down" ? to : from);
  }, [from, to, direction, format, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !isInView || !startWhen) return;
    onStart?.();
    const startId = setTimeout(() => {
      motionValue.set(direction === "down" ? from : to);
    }, delay * 1000);
    const endId = setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);
    return () => {
      clearTimeout(startId);
      clearTimeout(endId);
    };
  }, [
    isInView,
    startWhen,
    motionValue,
    direction,
    from,
    to,
    delay,
    duration,
    onStart,
    onEnd,
    reduceMotion,
  ]);

  useEffect(() => {
    if (reduceMotion) return;
    return springValue.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
  }, [springValue, format, reduceMotion]);

  return <span className={className} ref={ref} />;
}

export default CountUp;
