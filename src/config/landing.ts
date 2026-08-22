// All landing copy lives here — docs/DESIGN_SYSTEM.md §7. The page components
// are dumb renderers so wording can change without touching JSX.
import {
  CalendarRange,
  Wallet,
  Compass,
  Share2,
  type LucideIcon,
} from "lucide-react";

export const HERO = {
  eyebrow: "Multi-city trip planning",
  title: "Plan multi-city trips, beautifully",
  subtitle:
    "Build a day-by-day itinerary across every city on your route, watch the budget update as you go, and share the finished plan with one link.",
  primaryCta: { label: "Start planning free", href: "/signup" },
  secondaryCta: { label: "Explore destinations", href: "/cities" },
};

// Sourced from prisma/catalog.ts — 31 cities across 7 regions, 10 activities each.
export const STATS = [
  { value: "31", label: "Cities in the catalog" },
  { value: "310", label: "Curated activities" },
  { value: "7", label: "Regions covered" },
  { value: "1 link", label: "To share the whole plan" },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  span: "wide" | "tall" | "normal";
};

export const FEATURES: Feature[] = [
  {
    icon: CalendarRange,
    title: "An itinerary builder that keeps up",
    body: "Add city stops, drag them into the right order, and drop activities onto specific days. The running total follows every change.",
    span: "wide",
  },
  {
    icon: Wallet,
    title: "Budget you can actually see",
    body: "Transport, stay, activities and meals split into a live breakdown, with over-budget days flagged before you book them.",
    span: "normal",
  },
  {
    icon: Compass,
    title: "Discovery built in",
    body: "Search cities by cost index and popularity, filter activities by category, cost and duration. No tab-hopping.",
    span: "normal",
  },
  {
    icon: Share2,
    title: "Share it, and let people copy it",
    body: "Publish to a public link anyone can open. Any traveller who likes it can copy the whole plan into their own account in one click.",
    span: "wide",
  },
];

export const STEPS = [
  {
    title: "Create the trip",
    body: "Name it, set the dates, add a cover photo if you have one.",
  },
  {
    title: "Add your city stops",
    body: "Pick cities from the catalog and give each one a date range.",
  },
  {
    title: "Fill the days",
    body: "Browse activities per city and assign them to specific days and times.",
  },
  {
    title: "Watch the budget",
    body: "Add expenses per stop and see exactly which days run hot.",
  },
  {
    title: "Share the plan",
    body: "Flip it public and send the link. Others can copy it outright.",
  },
];

export const CTA_BAND = {
  title: "Your next trip is a few clicks from planned",
  body: "Free to start. No card, no trial timer.",
  cta: { label: "Create your first trip", href: "/signup" },
};

export const FOOTER_NOTE = "Built for the Odoo x LDCE Hackathon 2026.";

/** The CSS-built hero visual — no stock photography, nothing that can 404. */
export const PREVIEW_DAYS = [
  {
    day: "Day 1",
    city: "Paris",
    items: [
      { time: "09:30", name: "Eiffel Tower Summit", category: "SIGHTSEEING", cost: 32 },
      { time: "13:00", name: "Latin Quarter Food Crawl", category: "FOOD", cost: 75 },
    ],
  },
  {
    day: "Day 2",
    city: "Paris",
    items: [
      { time: "10:00", name: "Louvre Guided Tour", category: "CULTURE", cost: 45 },
      { time: "21:00", name: "Moulin Rouge Show", category: "NIGHTLIFE", cost: 130 },
    ],
  },
  {
    day: "Day 3",
    city: "Rome",
    items: [
      { time: "08:45", name: "Colosseum Underground", category: "SIGHTSEEING", cost: 38 },
    ],
  },
];
