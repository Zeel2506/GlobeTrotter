"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import { Field, FormError } from "@/components/ui/field";
import { ImageUploadField } from "@/components/ui/image-upload";
import { api, ApiClientError } from "@/lib/api";

type FieldErrors = Record<string, string[] | undefined>;

export function CreateTripForm() {
  const router = useRouter();
  // The landing hero's "Plan a trip" tab hands over name/start/end, so arriving
  // from it lands on a form that is already filled in rather than empty.
  const params = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldErrors>({});
  const [name, setName] = useState(() => params.get("name") ?? "");
  const [startDate, setStartDate] = useState(() => params.get("start") ?? "");
  const [endDate, setEndDate] = useState(() => params.get("end") ?? "");
  const [cover, setCover] = useState<string | null>(null);

  // Client-side guard only mirrors the server rule for instant feedback; the
  // API re-validates endDate >= startDate regardless.
  const rangeInvalid = Boolean(startDate && endDate && endDate < startDate);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rangeInvalid) return;
    setError(null);
    setIssues({});
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      const trip = await api.post<{ id: string }>("/api/trips", {
        name: name.trim(),
        startDate,
        endDate,
        description: String(form.get("description") ?? "").trim() || undefined,
        coverPhotoUrl: cover ?? undefined,
        budgetTotal: form.get("budgetTotal") ? Number(form.get("budgetTotal")) : undefined,
      });

      toast.success("Trip created — now add your first stop.");
      router.push(`/trips/${trip.id}/build`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.issues) setIssues(err.issues);
        setError(err.message);
      } else {
        setError("Could not create the trip. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormError message={error} />

          <Field label="Trip name" htmlFor="name" error={issues.name} required>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Two weeks across Italy"
              minLength={2}
              maxLength={100}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="startDate" error={issues.startDate} required>
              <DateField
                id="startDate"
                value={startDate}
                onChange={setStartDate}
                placeholder="Pick a start date"
              />
            </Field>
            <Field
              label="End date"
              htmlFor="endDate"
              error={rangeInvalid ? "End date must be on or after the start date." : issues.endDate}
              required
            >
              <DateField
                id="endDate"
                value={endDate}
                onChange={setEndDate}
                min={startDate || undefined}
                placeholder="Pick an end date"
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="description"
            error={issues.description}
            hint="Optional. A line about what this trip is for."
          >
            <Textarea id="description" name="description" rows={3} maxLength={500} />
          </Field>

          <Field
            label="Total budget"
            htmlFor="budgetTotal"
            error={issues.budgetTotal}
            hint="Optional. Set this to get over-budget day alerts."
          >
            <Input
              id="budgetTotal"
              name="budgetTotal"
              type="number"
              min={0}
              step={1}
              placeholder="2000"
            />
          </Field>

          <ImageUploadField value={cover} onChange={setCover} name={name || "Your trip"} />

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={rangeInvalid}>
              Create trip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
