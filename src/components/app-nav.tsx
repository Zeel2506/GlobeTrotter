"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Globe2, Plus, Menu, X, User, Heart, Shield, LogOut } from "lucide-react";
import { MAIN_NAV, isActivePath } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";

/**
 * Consumer app shell — top-nav, per DESIGN_SYSTEM.md §6. Travel products favour
 * top-nav and the itinerary builder needs the full horizontal width. Admin gets
 * its own sidebar inside /admin.
 *
 * Session data is passed down from the server layout, so this never needs a
 * SessionProvider round-trip.
 */
export function AppNav({
  user,
}: {
  user: { name: string; email: string; role: string; photoUrl?: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <nav className="page-shell flex h-16 items-center gap-3">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
            <Globe2 className="size-[18px]" />
          </span>
          <span className="hidden text-[17px] tracking-tight sm:inline">GlobeTrotter</span>
        </Link>

        <div className="mx-2 hidden flex-1 items-center gap-1 md:flex">
          {MAIN_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-hover"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/trips/new">
              <Plus />
              Plan New Trip
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="rounded-full transition-opacity hover:opacity-85"
              >
                <Avatar src={user.photoUrl} name={user.name} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-[13px] text-foreground-subtle">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User />
                  Profile & settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile#saved">
                  <Heart />
                  Saved destinations
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => signOut({ callbackUrl: "/" })}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium",
                  active ? "bg-primary-soft text-primary-hover" : "text-foreground-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <Button asChild className="mt-2 w-full">
            <Link href="/trips/new" onClick={() => setOpen(false)}>
              <Plus />
              Plan New Trip
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
