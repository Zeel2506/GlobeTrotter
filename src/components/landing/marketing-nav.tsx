"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { MARKETING_NAV } from "@/config/nav";
import { cn } from "@/lib/cn";

/**
 * Floating pill navbar — the EcoSphere pattern: a detached white capsule inset
 * from the viewport edges, sitting ON the page background rather than spanning
 * it. It gains a stronger shadow once the hero scrolls under it.
 */
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
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-[var(--radius-pill)] border border-border bg-surface/95 pl-5 pr-3 backdrop-blur-xl transition-shadow duration-[var(--dur)]",
          scrolled ? "shadow-[var(--shadow-float)]" : "shadow-[var(--shadow-sm)]",
        )}
      >
        <Logo />

        {/* Centred link cluster, the way EcoSphere balances its capsule. */}
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {MARKETING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-pill)] px-4 py-2 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-6 text-[15px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[.98]"
            >
              Go to dashboard
              <ArrowUpRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-[15px] font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-6 text-[15px] font-semibold text-primary-fg transition-all hover:bg-primary-hover active:scale-[.98]"
              >
                Get started
                <ArrowUpRight className="size-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="ml-auto flex size-10 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-[var(--shadow-float)] md:hidden">
          {MARKETING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-[var(--radius)] px-4 py-3 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-surface-muted"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="flex h-11 items-center justify-center rounded-[var(--radius-pill)] bg-primary font-semibold text-primary-fg"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-[var(--radius-pill)] border border-border font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex h-11 items-center justify-center rounded-[var(--radius-pill)] bg-primary font-semibold text-primary-fg"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
