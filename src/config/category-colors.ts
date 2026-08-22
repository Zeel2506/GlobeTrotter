// Frozen activity-category map — docs/DESIGN_SYSTEM.md §4.
// The icon is load-bearing, not decorative: FOOD (amber) and ADVENTURE (orange)
// are the closest pair on this wheel, so every chip renders icon + label + colour.
import {
  Landmark,
  Theater,
  UtensilsCrossed,
  Mountain,
  Music,
  ShoppingBag,
  Trees,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const ACTIVITY_CATEGORIES = [
  "SIGHTSEEING",
  "CULTURE",
  "FOOD",
  "ADVENTURE",
  "NIGHTLIFE",
  "SHOPPING",
  "NATURE",
  "OTHER",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type CategoryStyle = {
  label: string;
  color: string;
  soft: string;
  icon: LucideIcon;
};

export const CATEGORY_STYLES: Record<ActivityCategory, CategoryStyle> = {
  SIGHTSEEING: { label: "Sightseeing", color: "#0891b2", soft: "#cffafe", icon: Landmark },
  CULTURE: { label: "Culture", color: "#7c3aed", soft: "#ede9fe", icon: Theater },
  FOOD: { label: "Food", color: "#d97706", soft: "#fef3c7", icon: UtensilsCrossed },
  ADVENTURE: { label: "Adventure", color: "#ea580c", soft: "#ffedd5", icon: Mountain },
  NIGHTLIFE: { label: "Nightlife", color: "#4338ca", soft: "#e0e7ff", icon: Music },
  SHOPPING: { label: "Shopping", color: "#db2777", soft: "#fce7f3", icon: ShoppingBag },
  NATURE: { label: "Nature", color: "#059669", soft: "#d1fae5", icon: Trees },
  OTHER: { label: "Other", color: "#64748b", soft: "#f1f5f9", icon: Sparkles },
};

/** Never throws on an unknown category — a catalog change must not crash a chip. */
export function categoryStyle(category: string | null | undefined): CategoryStyle {
  return CATEGORY_STYLES[category as ActivityCategory] ?? CATEGORY_STYLES.OTHER;
}

// Budget donut palette — splits spend, not activity type, so it deliberately
// does not reuse the category map. Five segments: the API returns `other`.
export const BUDGET_COLORS = {
  activities: "#0d9488",
  transport: "#0284c7",
  stay: "#7c3aed",
  meals: "#d97706",
  other: "#94a3b8",
} as const;

export const BUDGET_SEGMENTS = [
  { key: "activities", label: "Activities" },
  { key: "transport", label: "Transport" },
  { key: "stay", label: "Stay" },
  { key: "meals", label: "Meals" },
  { key: "other", label: "Other" },
] as const;

export const EXPENSE_CATEGORIES = ["TRANSPORT", "STAY", "MEALS", "OTHER"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
