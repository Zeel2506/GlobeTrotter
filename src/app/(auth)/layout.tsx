import Link from "next/link";
import { Globe2, ChevronLeft, Map, Wallet, Share2 } from "lucide-react";
import { FloatingPaths } from "@/components/auth/floating-paths";

/**
 * Split-screen auth shell, structured after 21st.dev's sshahaider/auth-page:
 * brand panel with an animated path backdrop on one side, form on the other.
 *
 * Two deliberate departures from the source: the social sign-in buttons are
 * gone, because this app has credentials auth only and a dead "Continue with
 * Google" button is worse than no button; and the panel carries the product's
 * three actual promises rather than a fictional testimonial.
 */
const HIGHLIGHTS = [
  { icon: Map, text: "Day-by-day itineraries across every city on your route" },
  { icon: Wallet, text: "A live budget that flags the days running hot" },
  { icon: Share2, text: "One public link that anyone can open — or copy" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1fr_0.85fr]">
      {/* Form side */}
      <div className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10">
        <div className="absolute left-5 top-7 flex items-center gap-3 sm:left-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 font-semibold lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Globe2 className="size-[19px]" />
            </span>
            <span className="text-[17px] tracking-tight">GlobeTrotter</span>
          </Link>

          {children}
        </div>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-border bg-surface-muted lg:flex lg:flex-col lg:p-10">
        <div aria-hidden className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div
          aria-hidden
          className="hero-aura absolute inset-0"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-surface-muted via-transparent to-transparent"
        />

        <Link href="/" className="relative z-10 flex items-center gap-2.5 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg">
            <Globe2 className="size-[19px]" />
          </span>
          <span className="text-[17px] tracking-tight">GlobeTrotter</span>
        </Link>

        <div className="relative z-10 mt-auto">
          <h2 className="statement max-w-md text-[2rem] leading-tight">
            Every trip you meant to plan,{" "}
            <span className="display-oblique">finally in one place</span>.
          </h2>

          <ul className="mt-8 flex max-w-md flex-col gap-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-surface text-primary shadow-[var(--shadow-sm)]">
                  <h.icon className="size-[18px]" />
                </span>
                <p className="pt-1.5 text-[15px] text-foreground-muted">{h.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
