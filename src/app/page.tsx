import { auth } from "@/auth";
import { MarketingNav } from "@/components/landing/marketing-nav";
import {
  Hero,
  StatsStrip,
  FeatureBento,
  HowItWorks,
  CtaBand,
  Footer,
} from "@/components/landing/sections";

// Public landing — S-landing in docs/API_CONTRACT.md. Reads the session only to
// swap the nav CTA between "Sign up" and "Go to dashboard"; the page itself
// renders identically logged out.
export default async function LandingPage() {
  const session = await auth();

  return (
    <>
      <MarketingNav signedIn={Boolean(session?.user)} />
      <main className="flex-1">
        <Hero />
        <StatsStrip />
        <FeatureBento />
        <HowItWorks />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
