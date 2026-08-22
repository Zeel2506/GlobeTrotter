"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "./label";
import { cn } from "@/lib/cn";

/**
 * Label + control + hint + error, in one wrapper — DESIGN_SYSTEM.md §9.
 * `error` accepts the string[] shape that the API's 422 `issues` payload returns
 * (docs/API_CONTRACT.md), so a server validation failure can be piped straight in.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string | string[] | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </Label>
      )}
      {children}
      {message ? (
        <p className="flex items-start gap-1.5 text-[13px] text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {message}
        </p>
      ) : (
        hint && <p className="text-[13px] text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}

/** Form-level error banner — for 401/409/500 responses that aren't field-scoped. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-[var(--radius)] border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[13px] text-[#b91c1c]"
    >
      <AlertCircle className="mt-px size-4 shrink-0" />
      {message}
    </div>
  );
}
