"use client";

// From 21st.dev — originui/calendar (React Day Picker v9/10 API).
// Adapted for GlobeTrotter:
//   · shadcn's token names remapped to ours: muted-foreground -> foreground-subtle,
//     accent -> surface-muted, primary-foreground -> primary-fg, ring -> primary
//   · @/lib/utils -> @/lib/cn
//   · their buttonVariants import dropped; the nav arrows use plain classes so
//     this pulls in nothing extra
//   · range start/end/middle radii kept — the trip and stop pickers select ranges
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButton =
  "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] p-0 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col gap-4 sm:flex-row",
    month: "w-full",
    month_caption: "relative z-20 mx-10 mb-1 flex h-9 items-center justify-center",
    caption_label: "text-sm font-semibold",
    nav: "absolute top-0 z-10 flex w-full justify-between",
    button_previous: navButton,
    button_next: navButton,
    weekday: "size-9 p-0 text-xs font-medium text-foreground-subtle",
    day_button: cn(
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] p-0 text-foreground outline-offset-2",
      "group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius] group-[[data-selected]:not(.range-middle)]:duration-150",
      "hover:bg-surface-muted focus:outline-none focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70",
      "group-data-[selected]:bg-primary group-data-[selected]:text-primary-fg",
      "group-data-[disabled]:pointer-events-none group-data-[disabled]:text-foreground/30 group-data-[disabled]:line-through",
      "group-data-[outside]:text-foreground/30 group-data-[outside]:group-data-[selected]:text-primary-fg",
      "group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none",
      "group-data-[selected]:group-[.range-middle]:bg-primary-soft group-data-[selected]:group-[.range-middle]:text-foreground",
    ),
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-surface [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
    outside: "text-foreground-subtle",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-foreground-subtle",
  };

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const mergedComponents = {
    Chevron: ({ orientation, ...rest }: { orientation?: "left" | "right" | "up" | "down" }) =>
      orientation === "left" ? (
        <ChevronLeft size={16} strokeWidth={2} aria-hidden {...rest} />
      ) : (
        <ChevronRight size={16} strokeWidth={2} aria-hidden {...rest} />
      ),
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
