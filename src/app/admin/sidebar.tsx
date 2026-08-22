"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, isActivePath } from "@/config/nav";
import { cn } from "@/lib/cn";

/** Mode A navigation. Vertical in the sidebar, horizontal in the mobile bar. */
export function AdminSidebar({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        horizontal ? "flex gap-1 overflow-x-auto py-2" : "flex flex-1 flex-col gap-0.5 p-3",
      )}
    >
      {ADMIN_NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
