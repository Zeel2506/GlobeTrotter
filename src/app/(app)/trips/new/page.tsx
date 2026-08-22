import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTripForm } from "./create-trip-form";

export const metadata: Metadata = { title: "Plan a new trip" };

// S3 — docs/SPEC.md. On save, redirect straight into the builder.
export default function NewTripPage() {
  return (
    <div className="page-shell"><div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="New trip"
        title="Plan a new trip"
        description="Name it and set the dates. You will add city stops next."
      />
      {/* The form reads name/start/end from the query, so it needs a Suspense
          boundary — useSearchParams opts the subtree into client rendering. */}
      <Suspense fallback={<Skeleton className="h-[560px] w-full rounded-[var(--radius-lg)]" />}>
        <CreateTripForm />
      </Suspense>
    </div>
    </div>
  );
}
