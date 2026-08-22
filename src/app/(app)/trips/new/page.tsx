import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CreateTripForm } from "./create-trip-form";

export const metadata: Metadata = { title: "Plan a new trip" };

// S3 — docs/SPEC.md. On save, redirect straight into the builder.
export default function NewTripPage() {
  return (
    <div className="page-shell max-w-2xl">
      <PageHeader
        eyebrow="New trip"
        title="Plan a new trip"
        description="Name it and set the dates. You will add city stops next."
      />
      <CreateTripForm />
    </div>
  );
}
