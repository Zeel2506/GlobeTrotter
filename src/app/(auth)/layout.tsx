import Link from "next/link";
import { Globe2, Map, Wallet, Share2 } from "lucide-react";

// Split layout: form on the left, brand panel on the right. Consistent with the
// landing gradient so signup does not feel like a different product.
const HIGHLIGHTS = [
  { icon: Map, text: "Day-by-day itineraries across every city on your route" },
  { icon: Wallet, text: "A live budget that flags the days running hot" },
  { icon: Share2, text: "One public link that anyone can open — or copy" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <div className="flex flex-1 flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
            <Globe2 className="size-[18px]" />
          </span>
          <span className="text-[17px] tracking-tight">GlobeTrotter</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <aside className="relative hidden w-[42%] max-w-2xl overflow-hidden lg:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,#ccfbf1_0%,transparent_55%),radial-gradient(100%_80%_at_100%_100%,#ffedd5_0%,transparent_60%)] bg-surface-muted"
        />
        <div className="relative flex h-full flex-col justify-center px-12">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Every trip you have been meaning to plan, finally in one place.
          </h2>
          <ul className="mt-8 flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <li key={h.text} className="flex items-start gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-surface text-primary shadow-[var(--shadow-sm)]">
                    <Icon className="size-[18px]" />
                  </span>
                  <p className="pt-1.5 text-[15px] text-foreground-muted">{h.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
