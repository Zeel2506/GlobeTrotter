"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = Primitive.Root;
export const TabsContent = Primitive.Content;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-foreground-muted transition-colors hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-fg",
        className,
      )}
      {...props}
    />
  );
}
