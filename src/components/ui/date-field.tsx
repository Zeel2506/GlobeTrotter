"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { controlBase } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * Date field: our control surface as the trigger, the 21st.dev calendar in a
 * popover. Replaces `<input type="date">`, which rendered a different widget in
 * every browser and could not be themed.
 *
 * Values stay as "YYYY-MM-DD" strings, which is exactly what the API's
 * `dayString` validator accepts — no Date objects cross this boundary, so there
 * is no timezone conversion to get wrong (docs/DECISIONS.md D-03).
 */

/** Parse "YYYY-MM-DD" as a LOCAL calendar day. `new Date(s)` would read it as
 *  UTC midnight and show the previous day west of Greenwich. */
function parseDay(value?: string): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Format a local Date back to "YYYY-MM-DD" without going through UTC. */
function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  max,
  clearable = true,
  id,
  className,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "YYYY-MM-DD" — days before this are not selectable. */
  min?: string;
  max?: string;
  clearable?: boolean;
  id?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDay(value);
  const minDate = parseDay(min);
  const maxDate = parseDay(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            controlBase,
            "flex h-11 items-center gap-2 px-3.5 text-left",
            !selected && "text-foreground-subtle",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-foreground-subtle" />
          <span className="flex-1 truncate">
            {selected
              ? selected.toLocaleDateString("en", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : placeholder}
          </span>
          {clearable && selected && (
            // A nested <button> would be invalid inside the trigger, so this is
            // a span that intercepts the click before the popover opens.
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            if (date) {
              onChange(formatDay(date));
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
