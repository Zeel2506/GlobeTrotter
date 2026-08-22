"use client";

// Adapted from React Bits — https://reactbits.dev (MIT), TextAnimations/RotatingText.
// Changes for GlobeTrotter:
//   · motion/react -> framer-motion (the version this project already ships)
//   · local cn() replaced with the project's @/lib/cn
//   · honours prefers-reduced-motion: the text still rotates, but swaps instantly
//     instead of animating per character
//   · the visible text is aria-hidden and the current value is exposed once in an
//     sr-only node, so a screen reader hears "Tokyo", not "T o k y o"
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Target,
  type TargetAndTransition,
  type Transition,
  type VariantLabels,
} from "framer-motion";
import { cn } from "@/lib/cn";

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    "children" | "transition" | "initial" | "animate" | "exit"
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: "sync" | "wait";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

function splitIntoCharacters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(function RotatingText(
  {
    texts,
    transition = { type: "spring", damping: 28, stiffness: 320 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2400,
    staggerDuration = 0.018,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  },
  ref,
) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const elements = useMemo(() => {
    const current = texts[index] ?? "";
    if (splitBy === "characters") {
      const words = current.split(" ");
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }
    if (splitBy === "words") {
      return current.split(" ").map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === "lines") {
      return current.split("\n").map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }
    return current.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, index, splitBy]);

  const totalChars = useMemo(
    () => elements.reduce((sum, w) => sum + w.characters.length, 0),
    [elements],
  );

  const staggerDelay = useCallback(
    (charIndex: number) => {
      if (reduceMotion) return 0;
      if (staggerFrom === "first") return charIndex * staggerDuration;
      if (staggerFrom === "last") return (totalChars - 1 - charIndex) * staggerDuration;
      if (staggerFrom === "center") {
        return Math.abs(Math.floor(totalChars / 2) - charIndex) * staggerDuration;
      }
      if (staggerFrom === "random") {
        return Math.abs(Math.floor(Math.random() * totalChars) - charIndex) * staggerDuration;
      }
      return Math.abs((staggerFrom as number) - charIndex) * staggerDuration;
    },
    [staggerFrom, staggerDuration, totalChars, reduceMotion],
  );

  const change = useCallback(
    (next: number) => {
      setIndex(next);
      onNext?.(next);
    },
    [onNext],
  );

  const next = useCallback(() => {
    const n = index === texts.length - 1 ? (loop ? 0 : index) : index + 1;
    if (n !== index) change(n);
  }, [index, texts.length, loop, change]);

  const previous = useCallback(() => {
    const p = index === 0 ? (loop ? texts.length - 1 : index) : index - 1;
    if (p !== index) change(p);
  }, [index, texts.length, loop, change]);

  const jumpTo = useCallback(
    (i: number) => {
      const valid = Math.max(0, Math.min(i, texts.length - 1));
      if (valid !== index) change(valid);
    },
    [texts.length, index, change],
  );

  const reset = useCallback(() => {
    if (index !== 0) change(0);
  }, [index, change]);

  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [
    next,
    previous,
    jumpTo,
    reset,
  ]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial, animate, exit };

  return (
    <motion.span
      className={cn("relative inline-flex flex-wrap whitespace-pre-wrap", mainClassName)}
      {...rest}
      layout
      transition={transition}
    >
      {/* One accessible reading of the whole word, not one per character. */}
      <span className="sr-only">{texts[index]}</span>

      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={index}
          className={cn(
            splitBy === "lines"
              ? "flex w-full flex-col"
              : "relative inline-flex flex-wrap whitespace-pre-wrap",
          )}
          layout
          aria-hidden
        >
          {elements.map((word, wordIndex, arr) => {
            const before = arr
              .slice(0, wordIndex)
              .reduce((sum, w) => sum + w.characters.length, 0);
            return (
              <span key={wordIndex} className={cn("inline-flex", splitLevelClassName)}>
                {word.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    {...motionProps}
                    transition={{ ...transition, delay: staggerDelay(before + charIndex) }}
                    className={cn("inline-block", elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {word.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

export default RotatingText;
