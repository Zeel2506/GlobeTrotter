// Role-filtered navigation — docs/DESIGN_SYSTEM.md §6.
// Top-nav for the consumer app, sidebar for /admin only. The navbar is a dumb
// renderer over these arrays.
import {
  LayoutDashboard,
  Map,
  Compass,
  Ticket,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
};

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "My Trips", icon: Map },
  { href: "/cities", label: "Explore", icon: Compass },
  { href: "/activities", label: "Activities", icon: Ticket },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const MARKETING_NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

export function navForRole(role: string | undefined): NavItem[] {
  return MAIN_NAV.filter((i) => !i.roles || (role ? i.roles.includes(role) : false));
}

/** Active when the path matches exactly, or is a child segment of the item. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
