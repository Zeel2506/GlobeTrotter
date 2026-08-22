import type { Metadata } from "next";
import { Heart, Map, CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { ProfileForm } from "./profile-form";
import { SavedDestinations } from "./saved-destinations";
import { formatDate } from "@/lib/format";
import type { CityRow } from "@/lib/api";

export const metadata: Metadata = { title: "Profile & settings" };

// S12 — docs/SPEC.md. Server-rendered so the form starts populated with no
// loading flash; every mutation goes back through /api/profile.
export default async function ProfilePage() {
  const session = await auth();
  const sessionUser = session!.user as { id: string };

  const [user, saved] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoUrl: true,
        languagePref: true,
        createdAt: true,
        _count: { select: { trips: true, savedDestinations: true } },
      },
    }),
    prisma.savedDestination.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      include: { city: { include: { _count: { select: { activities: true } } } } },
    }),
  ]);

  const savedCities = saved.map((s) => s.city) as unknown as CityRow[];

  return (
    <div className="page-shell py-8">
      <PageHeader
        eyebrow="Account"
        title="Profile & settings"
        description="Update how you appear across GlobeTrotter and manage the places you've saved."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Map} label="Trips planned" value={user._count.trips} />
        <StatCard icon={Heart} label="Saved destinations" value={user._count.savedDestinations} />
        <StatCard
          icon={CalendarDays}
          label="Member since"
          value={formatDate(user.createdAt, { month: "short", year: "numeric" })}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            photoUrl: user.photoUrl,
            languagePref: user.languagePref ?? "en",
          }}
        />
        <SavedDestinations initial={savedCities} />
      </div>
    </div>
  );
}
