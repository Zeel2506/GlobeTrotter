import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/**
 * Footer for the signed-in shell.
 *
 * Without it, <main className="flex-1"> stretched to fill the viewport and every
 * page ended in a band of empty grey below its content. This gives the page a
 * bottom edge and somewhere for the secondary links to live.
 */
const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "My trips" },
  { href: "/cities", label: "Explore" },
  { href: "/activities", label: "Activities" },
  { href: "/profile", label: "Profile" },
];

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="page-shell flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
        <Logo markClassName="h-6" wordmarkClassName="text-[15px]" />

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-foreground-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[13px] text-foreground-subtle">
          © {new Date().getFullYear()} GlobeTrotter
        </p>
      </div>
    </footer>
  );
}
