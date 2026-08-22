"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-lg)] focus:outline-none",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
