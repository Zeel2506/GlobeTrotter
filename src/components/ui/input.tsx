import * as React from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-sm text-foreground placeholder:text-foreground-subtle transition-colors focus-visible:border-primary disabled:opacity-50 disabled:bg-surface-muted";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, "h-10", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-20 resize-y py-2 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";
