import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { AdminSidebar } from "./sidebar";
import { PageTransition } from "@/components/motion/page-transition";

/**
 * Mode A shell — DESIGN_SYSTEM.md §5. Deliberately unlike the consumer app:
 * a persistent sidebar, denser type, muted surfaces, no decorative motion.
 * The admin is reading tables, not being sold a holiday.
 *
 * Middleware already restricts /admin to ADMIN; this re-check covers direct
 * server renders and makes the requirement legible at the layout level.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { role?: string; name?: string } | undefined;

  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Logo
          href="/admin"
          className="h-14 border-b border-border px-4"
          markClassName="h-6"
          wordmarkClassName="text-[15px]"
        />

        <AdminSidebar />

        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to app
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The sidebar collapses below lg; this keeps the sections reachable. */}
        <div className="sticky top-0 z-30 border-b border-border bg-surface px-4 lg:hidden">
          <AdminSidebar horizontal />
        </div>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
