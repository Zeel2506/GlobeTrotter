"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

/** photoUrl is a nullable base64 data URL — the initials fallback is the norm. */
export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  return (
    <Primitive.Root
      className={cn(
        "relative flex size-9 shrink-0 select-none overflow-hidden rounded-full",
        className,
      )}
    >
      {src && <Primitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <Primitive.Fallback
        delayMs={src ? 200 : 0}
        className="flex h-full w-full items-center justify-center bg-primary-soft text-[12px] font-bold uppercase text-primary-hover"
      >
        {initials(name)}
      </Primitive.Fallback>
    </Primitive.Root>
  );
}
