import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-foreground-muted",
        primary: "bg-primary-soft text-primary-hover",
        accent: "bg-accent-soft text-[#c2410c]",
        success: "bg-success-soft text-[#15803d]",
        warning: "bg-warning-soft text-[#a16207]",
        danger: "bg-danger-soft text-[#b91c1c]",
        outline: "border border-border-strong text-foreground-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] [&_svg]:size-3",
        md: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "neutral", size: "sm" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
