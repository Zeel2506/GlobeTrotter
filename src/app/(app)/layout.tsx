import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { AppFooter } from "@/components/app-footer";

// Shell for every signed-in consumer screen. Middleware already gates these
// routes; the redirect here is belt-and-braces for direct server renders.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const sessionUser = session?.user as
    | { id: string; name: string; email: string; role: string }
    | undefined;

  if (!sessionUser?.id) redirect("/login");

  // The JWT carries id/name/email/role but not photoUrl, and the avatar wants it.
  const profile = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { photoUrl: true },
  });

  return (
    <>
      <AppNav
        user={{
          name: sessionUser.name ?? "Traveller",
          email: sessionUser.email ?? "",
          role: sessionUser.role,
          photoUrl: profile?.photoUrl,
        }}
      />
      <main className="flex-1 pb-20 pt-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <AppFooter />
    </>
  );
}
