import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ActivitySearch } from "./activity-search";

export const metadata: Metadata = { title: "Activities" };

// S8 — docs/SPEC.md. Scope is global, or narrowed to one city via ?cityId=.
export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ cityId?: string }>;
}) {
  const { cityId } = await searchParams;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Discover"
        title="Find things to do"
        description="310 curated activities. Filter by category, cost or how long they take."
      />
      <ActivitySearch cityId={cityId} />
    </div>
  );
}
