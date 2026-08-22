import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CitySearch } from "./city-search";

export const metadata: Metadata = { title: "Explore cities" };

// S7 — docs/SPEC.md. Filters, sort and pagination all live client-side against
// GET /api/cities so the URL stays shareable and the grid never full-reloads.
export default function CitiesPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Discover"
        title="Explore destinations"
        description="31 cities across 7 regions. Filter by country, region or how expensive a day there is."
      />
      <CitySearch />
    </div>
  );
}
