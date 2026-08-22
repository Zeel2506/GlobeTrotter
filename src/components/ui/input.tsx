"use client";

import * as React from "react";
import { ChevronDown, Search, X, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * One shared control surface. Every field in the app — text, search, select,
 * date, textarea — is built from this so they share a height, radius, border
 * and focus ring. Before this, selects and date inputs were raw elements with
 * ad-hoc classes in nine different files and no two looked the same.
 */
export const controlBase =
  "w-full rounded-[var(--radius)] border border-border-strong bg-surface text-sm text-foreground " +
  "shadow-sm shadow-black/[0.04] " +
  "placeholder:text-foreground-subtle transition-[border-color,box-shadow] outline-none " +
  "hover:border-foreground-subtle " +
  "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 " +
  // Strip WebKit's own search chrome so our clear button is the only one.
  "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none " +
  "[&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none";

const CONTROL_H = "h-11";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlBase, CONTROL_H, "px-3.5", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlBase, "min-h-24 resize-y px-3.5 py-2.5 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/**
 * Native <select> keeps the platform's own dropdown — on a phone that is the
 * OS picker, which beats any custom menu. Only the closed state is restyled,
 * with the browser's arrow removed and ours drawn on top.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        controlBase,
        CONTROL_H,
        "cursor-pointer appearance-none pl-3.5 pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle"
    />
  </div>
));
Select.displayName = "Select";

/** Text input with a leading magnifier and a clear button once it has a value. */
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }
>(({ className, onClear, value, ...props }, ref) => {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-foreground-subtle"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(
          controlBase,
          CONTROL_H,
          "pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
});
SearchInput.displayName = "SearchInput";

/**
 * Date field. Chrome/Edge render their own calendar glyph, so ours is hidden
 * there rather than drawing two — Firefox and Safari show none, and get ours.
 */
export const DateInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      type="date"
      className={cn(
        controlBase,
        CONTROL_H,
        "px-3.5 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100",
        className,
      )}
      {...props}
    />
    <Calendar
      aria-hidden
      className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle [@supports(-webkit-appearance:none)]:hidden"
    />
  </div>
));
DateInput.displayName = "DateInput";
