"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Globe2, Menu, X } from "lucide-react";
import { MARKETING_NAV } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Sticky translucent navbar — solidifies once the hero scrolls under it. */
export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-[var(--dur)]",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
            <Globe2 className="size-[18px]" />
          </span>
          <span className="text-[17px] tracking-tight">GlobeTrotter</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

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
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          {MARKETING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-foreground-muted"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2">
            {signedIn ? (
              <Button asChild className="flex-1">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
