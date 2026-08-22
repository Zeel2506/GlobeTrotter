// Shared zod pieces. Money and dates are validated in one place so every route
// agrees on what a valid day, price and uploaded image look like.
import { z } from "zod";
import { toUtcDay } from "@/lib/dates";

/** Accepts "2026-09-01" or a full ISO string; always yields a UTC-midnight Date. */
export const dayString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date")
  .transform(toUtcDay);

export const money = z.number().min(0).max(99_999_999);

/** "HH:mm", 24-hour. */
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm");

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * base64 data URL, <= 2 MB. Checked server-side — a client-side cap is not a cap
 * (docs/DECISIONS.md D-12). base64 inflates by 4/3, so compare decoded size.
 */
export const base64Image = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/, "Expected an image data URL")
  .refine((s) => {
    const b64 = s.slice(s.indexOf(",") + 1);
    return Math.floor((b64.length * 3) / 4) <= MAX_IMAGE_BYTES;
  }, "Image must be 2 MB or smaller");

export const cuid = z.string().min(1);

/** Non-empty list of unique ids — the shape both reorder endpoints take. */
export const idList = z
  .array(cuid)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids");

export const sortDir = z.enum(["asc", "desc"]).default("asc");

/** ?page=&pageSize= as a zod object, for routes that parse the whole query at once. */
export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

/** Prisma Decimal | number | null → plain JSON number. Frontend never does money math. */
export function num(v: { toString(): string } | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

/** Same, but preserves null (for optional fields like budgetTotal). */
export function numOrNull(v: { toString(): string } | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "number" ? v : Number(v.toString());
}

/** Round to 2 dp without float dust (0.1 + 0.2 style). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
