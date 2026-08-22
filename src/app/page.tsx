import { auth } from "@/auth";
import { MarketingNav } from "@/components/landing/marketing-nav";
import {
  PreviewBand,
  StatsStrip,
  FeatureBento,
  HowItWorks,
  CtaBand,
  Footer,
} from "@/components/landing/sections";
import { DestinationRail } from "@/components/landing/destination-rail";
import { MorphHero } from "@/components/landing/morph-hero";
import { HeroSearch } from "@/components/landing/hero-search";
import { prisma } from "@/lib/prisma";

// Public landing — S-landing in docs/API_CONTRACT.md. Reads the session only to
// swap the nav CTA between "Sign up" and "Go to dashboard"; the page itself
// renders identically logged out.
export default async function LandingPage() {
  const [session, topCities, valueCities] = await Promise.all([
    auth(),
    // The rails show the real catalog, so the landing page can never advertise a
    // destination the product does not actually contain.
    prisma.city.findMany({
      orderBy: [{ popularity: "desc" }, { name: "asc" }],
      take: 16,
      include: { _count: { select: { activities: true } } },
    }),
    prisma.city.findMany({
      where: { costIndex: { lte: 45 } },
      orderBy: [{ costIndex: "asc" }, { popularity: "desc" }],
      take: 10,
      include: { _count: { select: { activities: true } } },
    }),
  ]);

  return (
    <>
      <MarketingNav signedIn={Boolean(session?.user)} />
      <main className="flex-1">
        <MorphHero
          cards={topCities.map((c) => ({
            src: c.imageUrl ?? "",
            label: c.name,
          }))}
        />

        <div className="page-shell pb-16 pt-10 lg:pb-24">
          <div className="mx-auto max-w-5xl">
            <HeroSearch />
          </div>
        </div>

        <StatsStrip />
        <DestinationRail
          title="Handpicked destinations"
          subtitle="The most-planned cities in the GlobeTrotter catalog."
          cities={topCities as never}
        />
        <PreviewBand />
        <DestinationRail
          title="Big trips, small budgets"
          subtitle="Cities with the lowest cost index — go further for less."
          cities={valueCities as never}
          viewAllHref="/cities?sort=costIndex&dir=asc"
        />
        <FeatureBento />
        <HowItWorks />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
